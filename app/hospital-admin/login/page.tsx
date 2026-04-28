import LoginForm from "@/components/locatomed/login-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { loginHospitalAdminAction } from "./actions";

export default async function HospitalAdminLoginPage() {
  const { t } = await getServerTranslator();

  return (
    <LoginForm
      title={t("authPages.hospitalAdminLoginTitle", "Connexion Administrateur")}
      description={t(
        "authPages.hospitalAdminLoginDescription",
        "Gerez les medecins de votre etablissement"
      )}
      action={loginHospitalAdminAction}
      redirectTo="/hospital-admin"
      signupHref="/hospital-admin/signup"
      backHref="/business"
      variant="hospital-admin"
    />
  );
}
