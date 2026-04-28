import SignupForm from "@/components/locatomed/signup-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { signupPharmacistAction } from "./actions";

export default async function PharmacySignupPage() {
  const { t } = await getServerTranslator();

  return (
    <SignupForm
      title={t("authPages.pharmacySignupTitle", "Creer votre pharmacie")}
      description={t(
        "authPages.pharmacySignupDescription",
        "Creez votre pharmacie et le compte pharmacien principal associe."
      )}
      action={signupPharmacistAction}
      variant="pharmacy"
      loginHref="/pharmacy/login"
      backHref="/business"
    />
  );
}
