import LoginForm from "@/components/locatomed/login-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { loginPatientAction } from "./actions";

export default async function PatientLoginPage() {
  const { t } = await getServerTranslator();

  return (
    <LoginForm
      title={t("authPages.patientLoginTitle", "Connexion Patient")}
      description={t(
        "authPages.patientLoginDescription",
        "Accedez a votre espace sante personnel"
      )}
      action={loginPatientAction}
      redirectTo="/patient"
      signupHref="/patient/signup"
      variant="patient"
    />
  );
}
