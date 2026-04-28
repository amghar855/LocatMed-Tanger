"use server";

import { requireRole } from "@/lib/auth/guards";
import { validatePatientChatQuestion } from "@/features/patient/schemas/chatbot";
import { askPatientChatbot } from "@/features/patient/services/chatbot";
import type { ChatbotResponse } from "@/features/patient/types/chatbot";

type AskPatientChatbotActionResult =
  | { success: true; data: ChatbotResponse }
  | { error: string };

export async function askPatientChatbotAction(formData: FormData): Promise<AskPatientChatbotActionResult> {
  const session = await requireRole("patient");

  const question = String(formData.get("question") ?? "").trim();
  const checked = validatePatientChatQuestion({ question });
  if (!checked.ok) {
    return { error: checked.error };
  }

  try {
    const chatbotResponse = await askPatientChatbot(checked.data.question, session.user.id);

    return { success: true, data: chatbotResponse };

  } catch (error) {
    console.error("Patient chatbot action error:", error);
    const fallbackResponse: ChatbotResponse = {
      answer:
        "Wakha sidi, sm7li bzaf l réseau t9il chwiya daba. Essayer mera khra aw chof les options lte7t (Je suis temporairement indisponible).",
      intent: "general",
      suggestions: [
        {
          id: "fallback",
          type: "action",
          title: "Découvrir la carte",
          subtitle: "Rechercher manuellement",
          href: "/patient/discover",
        },
      ],
    };

    return { success: true, data: fallbackResponse };
  }
}
