import LoginForm from "@/components/locatomed/login-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { loginDoctorAction } from "./actions";

export default async function DoctorLoginPage() {
  const { t } = await getServerTranslator();

  return (
    <LoginForm
      title={t("authPages.doctorLoginTitle", "Connexion Medecin")}
      description={t(
        "authPages.doctorLoginDescription",
        "Accedez a vos dossiers patients et rendez-vous"
      )}
      action={loginDoctorAction}
      redirectTo="/doctor"
      backHref="/business"
      variant="doctor"
    />
  );
}
