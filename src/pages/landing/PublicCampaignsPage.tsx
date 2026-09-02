import { ArrowRight, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LoadingState } from "../../components/ui/Form";
import { FormEmptyHint } from "../../components/ui/FormLayout";
import { api } from "../../lib/api";
import type { PublicCampaign } from "../../types/app";
import { CampaignCard } from "../participations/CampaignCard";
import { LandingPageHeader } from "./LandingPageHeader";
import { LandingShell } from "./LandingShell";

export function PublicCampaignsPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["public", "participation-campaigns"],
    queryFn: async () => {
      const { data } = await api.get<PublicCampaign[]>(
        "/participation-campaigns/public",
      );
      return data;
    },
  });

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
        <Link
          to="/welcome/participations"
          className="inline-flex items-center gap-2 rounded-2xl text-sm font-medium text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t("common.back")}
        </Link>
        <div className="mt-6 mb-8">
          <LandingPageHeader
            icon={Coins}
            eyebrow={t("landing.participations.cashTitle")}
            title={t("landing.participations.listTitle")}
            subtitle={t("landing.participations.listHint")}
          />
        </div>
        {query.isLoading ? <LoadingState /> : null}
        {query.data?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.map((item) => (
              <CampaignCard
                key={item.id}
                item={item}
                to={`/welcome/participations/${item.id}`}
              />
            ))}
          </div>
        ) : query.isFetched ? (
          <FormEmptyHint>{t("participations.empty")}</FormEmptyHint>
        ) : null}
      </div>
    </LandingShell>
  );
}
