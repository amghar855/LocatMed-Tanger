"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  addFavoriteHospitalAction,
  removeFavoriteHospitalAction,
} from "@/app/patient/favorites/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/locatomed/i18n-provider";

type Props = {
  hospitalId: string;
  isFavorite: boolean;
};

export function FavoriteToggleForm({ hospitalId, isFavorite }: Props) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    const formData = new FormData();
    formData.set("hospitalId", hospitalId);

    startTransition(async () => {
      const result = isFavorite
        ? await removeFavoriteHospitalAction(formData)
        : await addFavoriteHospitalAction(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isFavorite ? t("patient.favorites.removedToast") : t("patient.favorites.addedToast"));
    });
  }

  return (
    <Button
      type="button"
      onClick={onSubmit}
      disabled={isPending}
      variant={isFavorite ? "secondary" : "outline"}
      size="sm"
    >
      {isFavorite ? t("patient.favorites.remove") : t("patient.favorites.add")}
    </Button>
  );
}
