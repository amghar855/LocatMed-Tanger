import { requireRole } from "@/lib/auth/guards";
import { ChatbotClient } from "@/features/patient/components/chatbot/chatbot-client";
import { getPatientChatbotStarterContext } from "@/features/patient/services/chatbot";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function PatientChatbotPage() {
  const { t } = await getServerTranslator();
  const session = await requireRole("patient");
  const starter = await getPatientChatbotStarterContext();

  return (
    <ChatbotClient
      initialMessage={starter.welcomeMessage}
      initialSuggestions={starter.suggestions}
      patient={{
        name: session.user.name ?? t("patient.profile.rolePatient"),
        email: session.user.email ?? "",
      }}
    />
  );
}
