import LoginForm from "@/components/locatomed/login-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { loginPharmacistAction } from "./actions";

export default async function PharmacyLoginPage() {
  const { t } = await getServerTranslator();

  return (
    <LoginForm
      title={t("authPages.pharmacyLoginTitle", "Connexion Pharmacien")}
      description={t(
        "authPages.pharmacyLoginDescription",
        "Gerez votre stock et les disponibilites"
      )}
      action={loginPharmacistAction}
      redirectTo="/pharmacy"
      signupHref="/pharmacy/signup"
      backHref="/business"
      variant="pharmacy"
    />
  );
}
