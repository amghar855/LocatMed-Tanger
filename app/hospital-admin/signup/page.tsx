import SignupForm from "@/components/locatomed/signup-form";
import { getServerTranslator } from "@/lib/i18n/server";
import { signupHospitalAdminAction } from "./actions";

export default async function HospitalAdminSignupPage() {
  const { t } = await getServerTranslator();

  return (
    <SignupForm
      title={t(
        "authPages.hospitalAdminSignupTitle",
        "Creer votre etablissement hospitalier"
      )}
      description={t(
        "authPages.hospitalAdminSignupDescription",
        "Creez un nouvel hopital ou une nouvelle clinique, puis activez le compte administrateur."
      )}
      action={signupHospitalAdminAction}
      variant="hospital-admin"
      loginHref="/hospital-admin/login"
      backHref="/business"
    />
  );
}
