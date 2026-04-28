import SignupForm from "@/components/locatomed/signup-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { signupPatientAction } from "./actions";

export default async function PatientSignupPage() {
  const { t } = await getServerTranslator();

  return (
    <SignupForm
      title={t("authPages.patientSignupTitle", "Creer un compte patient")}
      description={t(
        "authPages.patientSignupDescription",
        "Rejoignez LOCATOMED pour gerer votre sante"
      )}
      action={signupPatientAction}
      variant="patient"
      showPhone
      loginHref="/patient/login"
    />
  );
}
