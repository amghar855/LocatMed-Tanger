import { desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hospitals, medicines, pharmacies, pharmacyStock } from "@/lib/db/schema";
import type {
  ChatbotResponse,
  ChatbotStarterContext,
  ChatIntent,
  ChatSuggestion,
} from "@/features/patient/types/chatbot";
import { getAzureChatModelOrNull } from "@/lib/ai/azure";
import { generateText } from "ai";
import { z } from "zod";

const specialtyHints: Record<string, string> = {
  cardio: "cardio",
  coeur: "cardio",
  pediatrie: "pediatrie",
  enfant: "pediatrie",
  gyn: "gyneco",
  grossesse: "gyneco",
  dermato: "dermato",
  peau: "dermato",
  urgence: "urgence",
};

function tokenizeQuestion(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[\u2019']/g, " ")
    .replace(/[^a-z0-9\u00C0-\u017F\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function detectIntent(question: string): ChatIntent {
  const text = question.toLowerCase();

  if (text.includes("reserver") || text.includes("rendez") || text.includes("appointment")) {
    return "booking";
  }
  if (
    text.includes("pharmacie") ||
    text.includes("medicament") ||
    text.includes("ordonnance") ||
    text.includes("disponibil")
  ) {
    return "pharmacy";
  }
  if (text.includes("hopital") || text.includes("special") || text.includes("decouvrir")) {
    return "discover";
  }

  // Heuristic: if a medicine-like keyword is present (e.g. "doliprane"),
  // treat it as a pharmacy intent even if the user doesn't mention "medicament/pharmacie".
  const medicineQuery = extractMedicineQuery(question);
  if (medicineQuery) {
    return "pharmacy";
  }

  return "general";
}

function detectSpecialtyKeyword(question: string): string | null {
  const text = question.toLowerCase();
  for (const [needle, value] of Object.entries(specialtyHints)) {
    if (text.includes(needle)) {
      return value;
    }
  }
  return null;
}

function detectMedicineKeyword(question: string): string | null {
  const words = tokenizeQuestion(question);
  const ignored = new Set([
    "bonjour",
    "salut",
    "pharmacie",
    "hopital",
    "medicament",
    "medicaments",
    "disponible",
    "disponibilite",
    "ordonnance",
    "avoir",
    "avec",
    "sans",
    "pour",
    "dans",
    "tanger",
    "cherche",
    "cherch",
    "recherche",
    "trouver",
    "trouve",
    "trouvez",
    "veux",
    "veut",
    "besoin",
    "bghit",
    "kan9lb",
    "ken9lb",
    "n9lb",
    "n9ellb",
    "wahd",
    "chi",
    "fin",
    "fina",
    "win",
    "wach",
    "3la",
    "ila",
    "li",
    "l",
    "smito",
    "ismo",
    "smiyto",
    "nom",
    "called",
    "named",
  ]);

  const candidate = words.find((word) => word.length >= 4 && !ignored.has(word));
  return candidate ?? null;
}

function extractMedicineQuery(question: string): string | null {
  const words = tokenizeQuestion(question);
  if (words.length === 0) return null;

  const anchors = new Set([
    "medicament",
    "medicaments",
    "médicament",
    "médicaments",
    "medicine",
    "drug",
    "ordo",
    "ordonnance",
    "ismo",
    "smito",
    "smiyto",
    "nom",
    "called",
    "named",
  ]);

  for (let i = 0; i < words.length; i++) {
    if (!anchors.has(words[i]!)) continue;
    const next = words[i + 1];
    if (next && next.length >= 3) return next;
  }

  // Fallback heuristic for short queries like "doliprane tanger"
  return detectMedicineKeyword(question);
}

async function getOnDutyPharmacySuggestions(limit = 3): Promise<ChatSuggestion[]> {
  const rows = await db
    .select({
      id: pharmacies.id,
      name: pharmacies.name,
      neighborhood: pharmacies.neighborhood,
      address: pharmacies.address,
    })
    .from(pharmacies)
    .where(eq(pharmacies.isOnDuty, true))
    .limit(limit);

  return rows.map((row) => ({
    id: `pharmacy-${row.id}`,
    type: "pharmacy",
    title: row.name,
    subtitle: row.neighborhood ?? row.address ?? "Pharmacie de garde",
    href: "/patient/discover?view=pharmacies",
  }));
}

async function resolveMedicineByName(query: string): Promise<{ id: string; name: string } | null> {
  const like = `%${query}%`;

  const rows = await db
    .select({ id: medicines.id, name: medicines.name })
    .from(medicines)
    .where(sql`lower(${medicines.name}) LIKE lower(${like})`)
    .orderBy(
      sql`CASE WHEN lower(${medicines.name}) = lower(${query}) THEN 0 ELSE 1 END`,
      sql`length(${medicines.name})`
    )
    .limit(1);

  return rows[0] ?? null;
}

async function getHospitalSuggestionsBySpecialty(specialty: string, limit = 3): Promise<ChatSuggestion[]> {
  const like = `%${specialty}%`;
  const rows = await db
    .select({
      id: hospitals.id,
      name: hospitals.name,
      type: hospitals.type,
      address: hospitals.address,
    })
    .from(hospitals)
    .where(
      sql`EXISTS (
        SELECT 1
        FROM json_each(${hospitals.specialties})
        WHERE lower(json_each.value) LIKE lower(${like})
      )`
    )
    .limit(limit);

  return rows.map((row) => ({
    id: `hospital-${row.id}`,
    type: "hospital",
    title: row.name,
    subtitle: `${row.type.toUpperCase()} - ${row.address}`,
    href: `/patient/discover?view=hospitals&specialty=${encodeURIComponent(specialty)}`,
  }));
}

async function getMedicineAvailabilitySuggestions(medicineQuery: string, limit = 3): Promise<ChatSuggestion[]> {
  const resolved = await resolveMedicineByName(medicineQuery);
  const like = `%${resolved?.name ?? medicineQuery}%`;
  const nameCondition = resolved
    ? eq(medicines.id, resolved.id)
    : sql`lower(${medicines.name}) LIKE lower(${like})`;

  const rows = await db
    .select({
      pharmacyId: pharmacies.id,
      pharmacyName: pharmacies.name,
      neighborhood: pharmacies.neighborhood,
      medicineName: medicines.name,
      quantity: pharmacyStock.quantity,
    })
    .from(pharmacyStock)
    .innerJoin(medicines, eq(pharmacyStock.medicineId, medicines.id))
    .innerJoin(pharmacies, eq(pharmacyStock.pharmacyId, pharmacies.id))
    .where(
      sql`${nameCondition} AND ${pharmacyStock.quantity} > 0`
    )
    .orderBy(desc(pharmacyStock.quantity))
    .limit(limit);

  return rows.map((row) => ({
    id: `pharmacy-stock-${row.pharmacyId}-${row.medicineName}`,
    type: "pharmacy",
    title: row.pharmacyName,
    subtitle: `${row.medicineName} (${row.quantity}) - ${row.neighborhood ?? "Tangier"}`,
    href: "/patient/ordonnance-scan",
  }));
}

function buildBaseActionSuggestions(): ChatSuggestion[] {
  return [
    {
      id: "action-booking",
      type: "action",
      title: "Prendre un rendez-vous",
      subtitle: "Aller vers la reservation",
      href: "/patient/booking",
    },
    {
      id: "action-discover",
      type: "action",
      title: "Voir hopitaux et pharmacies",
      subtitle: "Explorer la carte de Tanger",
      href: "/patient/discover",
    },
    {
      id: "action-ordonnance",
      type: "action",
      title: "Scanner une ordonnance",
      subtitle: "Trouver les disponibilites en pharmacie",
      href: "/patient/ordonnance-scan",
    },
  ];
}

function uniqueSuggestions(items: ChatSuggestion[]): ChatSuggestion[] {
  const ids = new Set<string>();
  const output: ChatSuggestion[] = [];

  for (const item of items) {
    if (ids.has(item.id)) {
      continue;
    }
    ids.add(item.id);
    output.push(item);
  }

  return output;
}

async function generateAssistantAnswer(options: {
  question: string;
  intent: ChatIntent;
  suggestions: ChatSuggestion[];
  fallback: string;
  retrievalFacts: string;
  medicineQuery: string | null;
}): Promise<string> {
  const azure = getAzureChatModelOrNull();
  if (!azure) return options.fallback;

  try {
    const { text } = await generateText({
      model: azure.model,
      maxOutputTokens: 220,
      temperature: 0.4,
      system:
        "You are LocatMed's patient assistant for Tangier, Morocco. Use the provided retrieval facts as the ONLY source of pharmacy/availability info (do not invent). Do NOT paste or duplicate the retrieval facts verbatim; instead, write a short helpful answer (1-4 sentences) and reference up to 2 pharmacy names max. If the user asks for a medicine, confirm the medicine name and suggest the next in-app action to check availability.",
      prompt: [
        `User question: ${options.question}`,
        `Detected intent: ${options.intent}`,
        `Medicine query: ${options.medicineQuery ?? "(none)"}`,
        `Retrieval facts:\n${options.retrievalFacts}`,
        `Fallback answer (if needed): ${options.fallback}`,
      ].join("\n"),
    });

    const cleaned = text.trim();
    return cleaned.length > 0 ? cleaned : options.fallback;
  } catch (error) {
    console.error("Azure OpenAI generation failed:", error);
    return options.fallback;
  }
}

export async function askPatientChatbot(question: string, _patientId: string): Promise<ChatbotResponse> {
  const intent = detectIntent(question);
  const collectedSuggestions: ChatSuggestion[] = [];
  const medicineParams = z.object({ medicineName: z.string().min(2) });
  const specialtyParams = z.object({ specialty: z.string().min(2) });

  let usedMedicineAvailabilitySearch = false;
  let usedOnDutyFallback = false;
  const medicineQuery = intent === "pharmacy" ? extractMedicineQuery(question) : null;

  if (intent === "pharmacy") {
    if (medicineQuery) {
      const parsed = medicineParams.safeParse({ medicineName: medicineQuery });
      if (parsed.success) {
        const suggestions = await getMedicineAvailabilitySuggestions(parsed.data.medicineName);
        usedMedicineAvailabilitySearch = true;
        collectedSuggestions.push(...suggestions);
      }
    }

    if (collectedSuggestions.length === 0) {
      const dutySuggestions = await getOnDutyPharmacySuggestions(3);
      usedOnDutyFallback = true;
      collectedSuggestions.push(...dutySuggestions);
    }
  }

  if (intent === "discover" || intent === "general") {
    const detectedSpecialty = detectSpecialtyKeyword(question);
    if (detectedSpecialty) {
      const parsed = specialtyParams.safeParse({ specialty: detectedSpecialty });
      if (parsed.success) {
        const suggestions = await getHospitalSuggestionsBySpecialty(parsed.data.specialty);
        collectedSuggestions.push(...suggestions);
      }
    }
  }

  if (intent === "booking") {
    const detectedSpecialty = detectSpecialtyKeyword(question);
    if (detectedSpecialty) {
      const parsed = specialtyParams.safeParse({ specialty: detectedSpecialty });
      if (parsed.success) {
        const suggestions = await getHospitalSuggestionsBySpecialty(parsed.data.specialty);
        collectedSuggestions.push(...suggestions);
      }
    }
  }

  const text = (() => {
    if (intent === "booking") {
      return "Mzyan, n9dar n3awnk bach t7jez rendez-vous. Choisis un hopital ou un medecin men les options et kamel la reservation.";
    }

    if (intent === "pharmacy") {
      if (collectedSuggestions.some((item) => item.type === "pharmacy")) {
        return "Safi, chofit lik options dyal pharmacies f Tanger. T9dar tdkhol l details bach tchof disponibilite dyal medicament.";
      }
      return "Ma banlix daba disponibilite moubachira. Nqdr nwerik pharmacies de garde bach tsowwel 3la stock.";
    }

    if (intent === "discover") {
      return "Nqdar n3awnk tktachef hopitaux w specialites f Tanger. Chof les suggestions li t7t bach tbda.";
    }

    return "Marhba bik f LocatMed. Nqdar n3awnk b reservation, recherche de medicaments, w decouverte dyal hopitaux f Tanger.";
  })();

  if (collectedSuggestions.length === 0) {
    collectedSuggestions.push(...buildBaseActionSuggestions());
  }

  const suggestions = uniqueSuggestions(collectedSuggestions).slice(0, 6);
  const retrievalFacts = suggestions.map((s) => `${s.type}|${s.title}|${s.subtitle ?? ""}|${s.href}`).join("\n");
  const enhancedText = await generateAssistantAnswer({
    question,
    intent,
    suggestions,
    fallback: text,
    retrievalFacts,
    medicineQuery,
  });

  return {
    answer: enhancedText,
    intent,
    suggestions,
    retrieval: {
      used: intent === "pharmacy" || intent === "discover" || intent === "booking",
      pharmacySuggestionCount: suggestions.filter((s) => s.type === "pharmacy").length,
      usedMedicineAvailabilitySearch,
      usedOnDutyFallback,
    },
  };
}

export async function getPatientChatbotStarterContext(): Promise<ChatbotStarterContext> {
  const [onDutyPharmacies, topHospitals] = await Promise.all([
    getOnDutyPharmacySuggestions(2),
    db
      .select({ id: hospitals.id, name: hospitals.name, address: hospitals.address })
      .from(hospitals)
      .limit(2),
  ]);

  const hospitalSuggestions: ChatSuggestion[] = topHospitals.map((row) => ({
    id: `starter-hospital-${row.id}`,
    type: "hospital",
    title: row.name,
    subtitle: row.address,
    href: "/patient/discover?view=hospitals",
  }));

  return {
    welcomeMessage:
      "Bonjour, je suis votre assistant LocatMed. Posez une question sur la reservation, les hopitaux ou la disponibilite des medicaments.",
    suggestions: uniqueSuggestions([...hospitalSuggestions, ...onDutyPharmacies, ...buildBaseActionSuggestions()]).slice(0, 6),
  };
}
