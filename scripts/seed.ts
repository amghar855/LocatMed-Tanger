/**
 * scripts/seed.ts — Wipes and re-seeds the local SQLite DB with Tangier demo data.
 * Never runs in production.  Run with: npm run db:seed
 */

import path from "path";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  users,
  hospitals,
  pharmacies,
  medicines,
  pharmacyStock,
  appointments,
  patientFavoriteHospitals,
  medicalRecords,
  reservations,
  notificationRequests,
} from "@/lib/db/schema";

// ─── Safety guard ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  throw new Error("🚫  Refusing to seed in production");
}

// ─── Deterministic PRNG (mulberry32, fixed seed = 0xDEADBEEF) ────────────────
function makePrng(seed: number): () => number {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = makePrng(0xdeadbeef);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ─── Simple CSV parser (handles quoted fields containing commas) ──────────────
function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of row) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Moroccan medicine barcodes to include (~50 common drugs) ─────────────────
// Critical: 6118000040279 = DOLIPRANE (demo search medicine, must stock qty > 0)
const MEDICINE_CODES = new Set([
  "6118000040279", // DOLIPRANE 300mg poudre   ← demo hero medicine
  "6118000081579", // ANDOL paracétamol 500mg
  "6118000040439", // GELUPRANE paracétamol 500mg
  "6118000080497", // RHINOFEBRAL paracétamol+chlorphénamine
  "6118000010845", // IMODIUM lopéramide 2mg
  "6118000160168", // AMOXIL amoxicilline 500mg susp
  "6118000160113", // AMOXIL amoxicilline 500mg comprimé
  "6118000030065", // ALGANTIL ibuprofène 200mg
  "6118000161073", // DOLFENE ibuprofène 300mg
  "6118000080039", // BRUFEN ibuprofène 2% suspension
  "6118010020155", // DILATOR salbutamol 2.5mg
  "6118001121373", // GLUCOVANCE métformine/glibenclamide
  "6118000032779", // IXOR oméprazole 10mg
  "6118000130017", // OMEGEN oméprazole 20mg
  "6118000040644", // PRAZOL oméprazole 20mg
  "6118000070979", // MIBRAL amlodipine 5mg
  "6118000071143", // DIPICOR amlodipine 10mg
  "6118000250548", // AMLOR amlodipine 10mg
  "6118000140719", // TORVA atorvastatine 20mg
  "6118000140801", // TORVA atorvastatine 15mg
  "6118000120155", // ZADRYL cétirizine solution
  "6118010121593", // VANTEC cétirizine 10mg
  "6118000241256", // MYNAZOL fluconazole 50mg
  "6118000070801", // SUPRIMASE fluconazole 50mg
  "6118001090112", // CIPRO LP ciprofloxacine 500mg
  "6118000040934", // AZIX azithromycine 500mg
  "6118000070108", // AZITHRIX azithromycine 200mg
  "6118000250685", // ZOLOFT sertraline 50mg
  "6118000180142", // CLOFENE diclofénac 25mg
  "6118000240372", // FENAC diclofénac 50mg
  "6118000160991", // ZANTAC ranitidine 75mg
  "6118000140849", // RAZON pantoprazole 40mg
  "6118000010814", // IDEOS calcium + vitamine D3
  "6118000032076", // VITA C 1000 vitamine C effervescent
  "6118000030744", // SANDOCAL calcium 500mg
  "6118000190950", // METROZAL métronidazole 500mg
  "6118000060567", // BIRODOGYL spiramycine/métronidazole
  "6118000032694", // NEOFORTAN phloroglucinol 40mg
  "6118001120925", // MOSCONTIN morphine 60mg
  "6118010122897", // NEOCLAV amoxicilline/clavulanate
  "6118000061106", // ASPEGIC ENF aspirine 250mg
  "6118000033189", // ASKARDIL aspirine 75mg
  "6118000060451", // LASILIX furosémide 20mg
  "6118000310297", // TENOCAN aténolol 100mg
  "6118000290100", // HYZAAR losartan/HCT
  "6118000230120", // INALAP énalapril 5mg
  "6118000071068", // GASTROLIBER lansoprazole 30mg
  "6118000140160", // DISPAMOX amoxicilline 500mg
  "6118000190707", // NEOMOX amoxicilline 250mg
]);

// ─── Infer Tangier neighborhood from coordinates ──────────────────────────────
function inferNeighborhood(lat: number, lng: number): string {
  if (lat > 35.785) return "Médina";
  if (lng > -5.775 && lat > 35.76) return "Malabata";
  if (lng < -5.835 && lat > 35.76) return "Branes";
  if (lat < 35.74) return "Souani";
  if (lat < 35.76 && lng > -5.80) return "Charf";
  return "Centre-ville";
}

// ─── Fix UTF-8 text that was mis-read as Latin-1 (mojibake) ──────────────────
// e.g. "ArmÃ©es" → "Armées", "Ø´Ø§Ø±Ø¹" → "شارع"
function fixMojibake(str: string): string {
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

// ─── Strip garbled Arabic from pharmacy names ─────────────────────────────────
// Pattern: "Pharmacie Xxx ØµÙØ¯ÙÙØ© ..." — keep only the Latin part
function cleanPharmacyName(raw: string): string {
  const fixed = fixMojibake(raw);
  // Remove the Arabic portion that follows the French name
  const latin = fixed.replace(/\s+[\u0600-\u06FF\u0750-\u077F]+.*$/, "").trim();
  return latin || fixed.split(" ").slice(0, 3).join(" ");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  Seeding LOCATOMED demo database…\n");

  // 1. Wipe in reverse FK order ─────────────────────────────────────────────────
  console.log("  ↻  Wiping existing data…");
  await db.delete(notificationRequests);
  await db.delete(reservations);
  await db.delete(medicalRecords);
  await db.delete(appointments);
  await db.delete(patientFavoriteHospitals);
  await db.delete(pharmacyStock);
  await db.delete(users);
  await db.delete(hospitals);
  await db.delete(pharmacies);
  await db.delete(medicines);

  // 2. Hospitals ─────────────────────────────────────────────────────────────────
  console.log("  🏥  Inserting hospitals…");
  type HospitalJson = {
    name: string;
    type: "public" | "private" | "chu";
    lat: number;
    lng: number;
    address: string;
    phone?: string;
    specialties: string[];
  };
  const hospitalJson: HospitalJson[] = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "hospitals-tanger.json"), "utf8")
  );
  const hospitalRows = hospitalJson.map((h) => ({
    id: randomUUID(),
    name: h.name,
    type: h.type,
    lat: h.lat,
    lng: h.lng,
    address: h.address,
    city: "Tanger",
    phone: h.phone ?? null,
    specialties: h.specialties,
  }));
  await db.insert(hospitals).values(hospitalRows);

  const mohammedV = hospitalRows.find(
    (h) => h.name.includes("Hôpital Mohammed V") || h.name.includes("Hospital Mohammed V")
  );
  const chu = hospitalRows.find((h) => h.name.includes("CHU Mohammed VI"));
  const prive = hospitalRows.find((h) => h.name.includes("Privé"));

  if (!mohammedV || !chu || !prive) {
    throw new Error("Hospital seed references are missing from hospitals-tanger.json");
  }

  const mohammedVId = mohammedV.id;
  const chuId = chu.id;
  console.log(`      ✓ ${hospitalRows.length} hospitals`);

  // 3. Pharmacies ───────────────────────────────────────────────────────────────
  console.log("  💊  Inserting pharmacies…");
  type PharmacyJson = {
    pharmacie_id: string;
    name: string;
    address?: string;
    lat: string;
    lon: string;
    is_garde: string;
    open_time?: string;
    close_time?: string;
  };
  const pharmacyJson: PharmacyJson[] = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "pharmacies-tanger.json"), "utf8")
  );
  const pharmacyRows = pharmacyJson.map((p) => {
    const lat = parseFloat(p.lat);
    const lng = parseFloat(p.lon);
    const hours =
      p.open_time && p.close_time ? `${p.open_time}–${p.close_time}` : "08:30–20:00";
    return {
      id: randomUUID(),
      name: cleanPharmacyName(p.name),
      lat,
      lng,
      address: p.address ? fixMojibake(p.address) : null,
      city: "Tanger",
      neighborhood: inferNeighborhood(lat, lng),
      isOnDuty: p.is_garde === "1",
      openingHours: hours,
    };
  });
  await db.insert(pharmacies).values(pharmacyRows);

  const onDutyCount = pharmacyRows.filter((p) => p.isOnDuty).length;
  console.log(`      ✓ ${pharmacyRows.length} pharmacies (${onDutyCount} on duty)`);

  // 4. Medicines (from data/medicaments.csv) ────────────────────────────────────
  console.log("  💉  Inserting medicines…");
  const csvRaw = readFileSync(
    path.join(process.cwd(), "data", "medicaments.csv"),
    "utf8"
  ).replace(/^\uFEFF/, ""); // strip BOM

  const csvLines = csvRaw.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCsvRow(csvLines[0]);
  const col = {
    code: headers.indexOf("CODE"),
    nom: headers.indexOf("NOM"),
    dci: headers.indexOf("DCI1"),
    dosage: headers.indexOf("DOSAGE1"),
    unit: headers.indexOf("UNITE_DOSAGE1"),
    forme: headers.indexOf("FORME"),
    ppv: headers.indexOf("PPV"),
    princeps: headers.indexOf("PRINCEPS_GENERIQUE"),
  };

  const medicineRows: {
    id: string;
    name: string;
    activeIngredient: string;
    dosageForm: string | null;
    ppm: number | null;
    isGeneric: boolean;
  }[] = [];
  const seenCodes = new Set<string>();

  for (let i = 1; i < csvLines.length; i++) {
    const f = parseCsvRow(csvLines[i]);
    const code = f[col.code]?.trim();
    if (!code || !MEDICINE_CODES.has(code) || seenCodes.has(code)) continue;
    seenCodes.add(code);

    const rawPpv = (f[col.ppv] ?? "").replace(/[,\s]/g, "");
    const ppm =
      rawPpv === "" || rawPpv === "-" ? null : parseFloat(rawPpv) || null;
    const dosage = f[col.dosage]?.trim() ?? "";
    const unit = f[col.unit]?.trim() ?? "";
    const forme = f[col.forme]?.trim() ?? "";
    const dosageForm = forme
      ? `${forme}${dosage && unit ? ` ${dosage} ${unit}` : ""}`
      : null;

    medicineRows.push({
      id: code,
      name: f[col.nom]?.trim() ?? "?",
      activeIngredient: f[col.dci]?.trim() ?? "?",
      dosageForm,
      ppm,
      isGeneric: f[col.princeps]?.trim() === "G",
    });
  }
  await db.insert(medicines).values(medicineRows);
  console.log(`      ✓ ${medicineRows.length} medicines`);

  // 5. Users ─────────────────────────────────────────────────────────────────────
  console.log("  👤  Creating users (hashing passwords…)");
  const demoHash = await bcrypt.hash("demo123", 10);
  const extraHash = await bcrypt.hash("locatomed2025", 10);

  const demoPharmacyId = pharmacyRows[0].id; // Ahmed → first pharmacy in list

  const adminId = randomUUID();
  const fatimaId = randomUUID();
  const benjellounId = randomUUID();
  const ahmedId = randomUUID();
  const elfassiId = randomUUID();
  const taziId = randomUUID();

  await db.insert(users).values([
    // ── Demo hospital admin
    {
      id: adminId,
      email: "admin@locatomed.ma",
      passwordHash: demoHash,
      role: "hospital_admin",
      fullName: "Nadia Sqalli",
      phone: "+212 661 100 200",
      specialty: null,
      hospitalId: mohammedVId,
      pharmacyId: null,
      createdBy: null,
      createdAt: new Date("2025-06-01"),
    },
    {
      id: fatimaId,
      email: "fatima@locatomed.ma",
      passwordHash: demoHash,
      role: "patient",
      fullName: "Fatima Zahra Alami",
      phone: "+212 661 234 567",
      specialty: null,
      hospitalId: null,
      pharmacyId: null,
      createdBy: null,
      createdAt: new Date("2025-09-01"),
    },
    {
      id: benjellounId,
      email: "benjelloun@locatomed.ma",
      passwordHash: demoHash,
      role: "doctor",
      fullName: "Dr. Amine Benjelloun",
      phone: "+212 661 987 654",
      specialty: "Médecine générale",
      hospitalId: mohammedVId,
      pharmacyId: null,
      createdBy: adminId,          // added by the hospital admin
      createdAt: new Date("2025-06-01"),
    },
    {
      id: ahmedId,
      email: "ahmed@locatomed.ma",
      passwordHash: demoHash,
      role: "pharmacist",
      fullName: "Ahmed Bennani",
      phone: "+212 662 345 678",
      specialty: null,
      hospitalId: null,
      pharmacyId: demoPharmacyId,
      createdBy: null,
      createdAt: new Date("2025-06-01"),
    },
    {
      id: elfassiId,
      email: "elfassi@locatomed.ma",
      passwordHash: extraHash,
      role: "doctor",
      fullName: "Dr. Khadija El Fassi",
      phone: "+212 663 111 222",
      specialty: "Pédiatrie",
      hospitalId: chuId,
      pharmacyId: null,
      createdBy: null,
      createdAt: new Date("2025-06-01"),
    },
    {
      id: taziId,
      email: "tazi@locatomed.ma",
      passwordHash: extraHash,
      role: "doctor",
      fullName: "Dr. Youssef Tazi",
      phone: "+212 664 333 444",
      specialty: "Cardiologie",
      hospitalId: prive.id,
      pharmacyId: null,
      createdBy: null,
      createdAt: new Date("2025-06-01"),
    },
  ]);
  console.log("      ✓ 6 users");

  // 5.1 Patient favorite hospitals ────────────────────────────────────────────
  await db.insert(patientFavoriteHospitals).values([
    {
      patientId: fatimaId,
      hospitalId: mohammedVId,
      createdAt: new Date("2025-11-01"),
    },
    {
      patientId: fatimaId,
      hospitalId: chuId,
      createdAt: new Date("2025-11-10"),
    },
  ]);
  console.log("      ✓ 2 favorite hospitals for Fatima");

  // 6. Pharmacy stock ──────────────────────────────────────────────────────────
  console.log("  📦  Generating pharmacy stock…");

  // Guarantee demo condition: ≥1 Centre-ville pharmacy stocks Doliprane qty > 0
  const DOLIPRANE = "6118000040279";
  const centrePharma =
    pharmacyRows.find((p) => p.neighborhood === "Centre-ville") ?? pharmacyRows[0];

  const stockRows: {
    pharmacyId: string;
    medicineId: string;
    quantity: number;
    price: number;
    minThreshold: number;
    updatedAt: Date;
  }[] = [];

  for (const pharmacy of pharmacyRows) {
    for (const med of medicineRows) {
      const isGuaranteedDemo =
        pharmacy.id === centrePharma.id && med.id === DOLIPRANE;

      let quantity: number;
      const r = rand();
      if (isGuaranteedDemo) {
        quantity = randInt(15, 50);
      } else if (r < 0.15) {
        quantity = 0;
      } else if (r < 0.25) {
        quantity = randInt(1, 4);
      } else {
        quantity = randInt(5, 80);
      }

      const basePpm = med.ppm ?? 50;
      const price = Math.round(basePpm * (0.97 + rand() * 0.06) * 100) / 100;
      const minThreshold = randInt(3, 8);

      stockRows.push({
        pharmacyId: pharmacy.id,
        medicineId: med.id,
        quantity,
        price,
        minThreshold,
        updatedAt: new Date(),
      });
    }
  }

  // Insert in chunks of 500 to avoid SQLite variable limit
  const CHUNK = 500;
  for (let i = 0; i < stockRows.length; i += CHUNK) {
    await db.insert(pharmacyStock).values(stockRows.slice(i, i + CHUNK));
  }
  const outOfStock = stockRows.filter((r) => r.quantity === 0).length;
  const lowStock = stockRows.filter((r) => r.quantity > 0 && r.quantity < 5).length;
  console.log(
    `      ✓ ${stockRows.length} rows — ${outOfStock} out-of-stock (${Math.round((outOfStock / stockRows.length) * 100)}%), ${lowStock} low-stock`
  );

  // 7. Historical appointments + medical records for Fatima ────────────────────
  console.log("  📋  Creating Fatima's medical history…");

  const appt1Id = randomUUID();
  const appt2Id = randomUUID();
  const appt3Id = randomUUID();

  await db.insert(appointments).values([
    {
      id: appt1Id,
      patientId: fatimaId,
      doctorId: benjellounId,
      hospitalId: mohammedVId,
      datetime: new Date("2024-10-15T10:00:00"),
      status: "completed",
      reason: "Rhinite allergique persistante",
      createdAt: new Date("2024-10-10"),
    },
    {
      id: appt2Id,
      patientId: fatimaId,
      doctorId: benjellounId,
      hospitalId: mohammedVId,
      datetime: new Date("2025-01-22T09:30:00"),
      status: "completed",
      reason: "Contrôle tension artérielle",
      createdAt: new Date("2025-01-18"),
    },
    {
      id: appt3Id,
      patientId: fatimaId,
      doctorId: elfassiId,
      hospitalId: chuId,
      datetime: new Date("2025-03-05T14:00:00"),
      status: "completed",
      reason: "Bilan sanguin annuel",
      createdAt: new Date("2025-03-01"),
    },
  ]);

  await db.insert(medicalRecords).values([
    {
      id: randomUUID(),
      patientId: fatimaId,
      doctorId: benjellounId,
      appointmentId: appt1Id,
      date: new Date("2024-10-15"),
      diagnosis: "Rhinite allergique saisonnière",
      notes:
        "Patiente se plaignant de rhinorrhée aqueuse, éternuements fréquents et prurit nasal depuis 3 semaines. Terrain atopique connu. Prescription antihistaminique orale.",
      prescription: [
        {
          medicineId: "6118000120155",
          dosage: "1 comprimé/jour",
          duration: "30 jours",
        },
        {
          medicineId: "6118010121593",
          dosage: "1 comprimé/jour au coucher",
          duration: "30 jours",
        },
      ],
      createdAt: new Date("2024-10-15"),
    },
    {
      id: randomUUID(),
      patientId: fatimaId,
      doctorId: benjellounId,
      appointmentId: appt2Id,
      date: new Date("2025-01-22"),
      diagnosis: "Hypertension artérielle légère — stade 1",
      notes:
        "TA à 145/92 mmHg mesurée deux fois à 5 min d'intervalle. IMC 26.4. Conseils hygiéno-diététiques. Introduction antihypertenseur léger en première intention.",
      prescription: [
        {
          medicineId: "6118000230120",
          dosage: "1 comprimé/jour le matin",
          duration: "90 jours",
        },
        {
          medicineId: "6118000032076",
          dosage: "1 comprimé effervescent/jour",
          duration: "30 jours",
        },
      ],
      createdAt: new Date("2025-01-22"),
    },
    {
      id: randomUUID(),
      patientId: fatimaId,
      doctorId: elfassiId,
      appointmentId: appt3Id,
      date: new Date("2025-03-05"),
      diagnosis: "Anémie ferriprive légère — surveillance",
      notes:
        "NFS : hémoglobine 11.2 g/dL, VGM 78 fL, ferritine 8 µg/L. Supplémentation en fer + vitamine C recommandée. Régime alimentaire adapté. Contrôle à 3 mois.",
      prescription: [
        {
          medicineId: "6118000010814",
          dosage: "1 comprimé/jour",
          duration: "60 jours",
        },
        {
          medicineId: "6118000032076",
          dosage: "1 comprimé effervescent/jour",
          duration: "60 jours",
        },
      ],
      createdAt: new Date("2025-03-05"),
    },
  ]);
  console.log("      ✓ 3 historical appointments + 3 medical records");

  // 8. Upcoming appointment (tomorrow at 10:00) ─────────────────────────────────
  console.log("  📅  Creating upcoming appointment…");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await db.insert(appointments).values([
    {
      id: randomUUID(),
      patientId: fatimaId,
      doctorId: benjellounId,
      hospitalId: mohammedVId,
      datetime: tomorrow,
      status: "scheduled",
      reason: "Renouvellement ordonnance — hypertension",
      createdAt: new Date(),
    },
  ]);
  console.log(
    `      ✓ 1 upcoming appointment (${tomorrow.toLocaleDateString("fr-MA")})`
  );

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n✅  Seed complete!\n");
  console.log("   Demo accounts (password: demo123)");
  console.log("   ─────────────────────────────────────────────────────");
  console.log("   admin@locatomed.ma        → hospital_admin (Hôpital Mohammed V)");
  console.log("   fatima@locatomed.ma       → patient");
  console.log("   benjelloun@locatomed.ma   → médecin (créé par admin, Médecine générale)");
  console.log(`   ahmed@locatomed.ma        → pharmacien (${pharmacyRows[0].name})`);
}

seed().catch((e) => {
  console.error("❌  Seed failed:", e);
  process.exit(1);
});
