import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServerTranslator } from "@/lib/i18n/server";

type Props = {
  view: "hospitals" | "pharmacies";
  selectedType: string;
  selectedQuery: string;
};

export async function DiscoverFilterBar({
  view,
  selectedType,
  selectedQuery,
}: Props) {
  const { t } = await getServerTranslator();

  return (
    <form method="get" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="view" value={view} />
      <Input
        name="q"
        defaultValue={selectedQuery}
        className="h-11 min-w-[220px] flex-1 rounded-full border-slate-200 bg-white/95 shadow-sm"
        placeholder={t("patient.booking.searchHospital")}
      />
      {view === "hospitals" ? (
        <select
          name="type"
          defaultValue={selectedType}
          className="h-10 rounded-full border border-slate-200 bg-white/95 px-3 text-sm shadow-sm"
        >
          <option value="">{t("patient.discover.typeHospital")}</option>
          <option value="public">{t("patient.discover.typePublic")}</option>
          <option value="private">{t("patient.discover.typePrivate")}</option>
          <option value="chu">{t("patient.discover.typeChu")}</option>
        </select>
      ) : null}
      <Button type="submit" variant="outline" className="h-10 rounded-full border-slate-200 bg-white/95 px-5 shadow-sm">
        {t("patient.folder.applyFilters")}
      </Button>
    </form>
  );
}
