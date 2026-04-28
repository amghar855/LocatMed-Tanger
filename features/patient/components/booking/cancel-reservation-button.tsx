"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelReservationAction } from "@/app/patient/booking/actions";
import { Loader2, XCircle } from "lucide-react";
import { useI18n } from "@/components/locatomed/i18n-provider";

type Props = {
  reservationId: string;
};

export function CancelReservationButton({ reservationId }: Props) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    const formData = new FormData();
    formData.set("reservationId", reservationId);

    startTransition(async () => {
      const result = await cancelReservationAction(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("patient.reservations.canceledToast"));
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleCancel}
      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <XCircle className="size-3.5" />
      )}
      {isPending ? t("patient.reservations.canceling") : t("patient.reservations.cancelAction")}
    </button>
  );
}
