import { CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  cardClassName,
  FormField,
  listShellClassName,
  LoadingState,
  PageHeader,
} from "../../components/ui/Form";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useListParams } from "../../hooks/useListParams";
import { api } from "../../lib/api";
import {
  currentPersianYear,
  persianYearOptions,
} from "../../lib/datetime";
import type { ReceptionDashboard } from "../../types/app";
import { ReservationDashboardStats } from "./ReservationDashboardStats";

export function ReservationStatsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const navigate = useNavigate();
  const { searchParams, setParams } = useListParams();
  const year = searchParams.get("year") || String(currentPersianYear());

  const dashboard = useQuery({
    queryKey: ["reservations", "dashboard", year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionDashboard>(
        "/reservations/dashboard",
        {
          params: { year: Number(year) },
        },
      );
      return data;
    },
  });

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t("menus.reservationsReport")}
        subtitle={t("reservations.statsSubtitle")}
        className="mb-3 sm:gap-2"
      />
      <div className="mb-4 space-y-2.5">
        <div className={`${cardClassName} p-4 sm:max-w-sm`}>
          <FormField
            icon={CalendarDays}
            label={t("reservations.year")}
            htmlFor="reservation-stats-year"
          >
            <SearchSelect
              id="reservation-stats-year"
              value={year}
              onChange={(next) => setParams({ year: next || undefined })}
              options={persianYearOptions(locale, Number(year))}
              placeholder={t("reservations.year")}
            />
          </FormField>
        </div>
        {dashboard.isLoading ? (
          <LoadingState />
        ) : dashboard.data ? (
          <ReservationDashboardStats
            data={dashboard.data}
            status=""
            highlightActive={false}
            showExtras
            onStatusFilter={(next) => {
              const params = new URLSearchParams();
              params.set("year", year);
              if (next) params.set("status", next);
              navigate(`/reservations?${params.toString()}`);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
