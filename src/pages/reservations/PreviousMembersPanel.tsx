import { Calendar, History, UserPlus } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DateText } from "../../components/ui/DateText";
import { confirmToast } from "../../components/ui/confirmToast";
import { Button, LoadingState } from "../../components/ui/Form";
import { api, getApiErrorMessage } from "../../lib/api";
import { formatNumber } from "../../lib/datetime";
import { geoName } from "../../lib/geo";
import type {
  PreviousCaravanReservation,
  PreviousCaravanReservations,
  Reservation,
} from "../../types/app";
import { HeadcountPills } from "./HeadcountPills";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

export function PreviousMembersPanel({
  reservation,
  onImported,
}: {
  reservation: Pick<Reservation, "id" | "totalCount">;
  onImported: () => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const [transferringId, setTransferringId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["reservations", reservation.id, "previous-members"],
    queryFn: async () => {
      const { data } = await api.get<PreviousCaravanReservations>(
        `/reservations/${reservation.id}/members/previous`,
      );
      return data;
    },
  });

  const items = query.data?.items ?? [];

  function transfer(item: PreviousCaravanReservation) {
    if (!item.transferableCount) {
      toast.error(t("reservations.previousAlreadyCopied"));
      return;
    }
    const mismatch = item.memberCount !== reservation.totalCount;
    confirmToast({
      title: t(
        mismatch
          ? "reservations.previousTransferMismatchConfirm"
          : "reservations.previousTransferConfirm",
        { count: n(item.transferableCount) },
      ),
      confirmLabel: t("common.yes"),
      cancelLabel: t("common.cancel"),
      onConfirm: () => void runTransfer(item),
    });
  }

  async function runTransfer(item: PreviousCaravanReservation) {
    setTransferringId(item.id);
    try {
      await api.post(`/reservations/${reservation.id}/members/copy-previous`, {
        sourceReservationId: item.id,
      });
      toast.success(t("reservations.copiedPrevious"));
      await queryClient.invalidateQueries({
        queryKey: ["reservations", reservation.id, "previous-members"],
      });
      onImported();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
    } finally {
      setTransferringId(null);
    }
  }

  return (
    <div className="space-y-3">
      {query.isLoading ? <LoadingState /> : null}
      {!query.isLoading && !items.length ? (
        <article className="flex flex-col items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-4 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
            <History className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink-900">
            {t("reservations.previousMembersEmpty")}
          </p>
        </article>
      ) : null}
      {items.map((item) => {
        const mismatch = item.memberCount !== reservation.totalCount;
        const busy = transferringId === item.id;
        return (
          <article
            key={item.id}
            className="space-y-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink-900">
                {t("reservations.previousMembersYear", { year: n(item.year) })}
              </p>
              <ReservationStatusBadge status={item.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5 text-teal-700" aria-hidden />
                <DateText value={item.stayStartDate} />
                <span aria-hidden>—</span>
                <DateText value={item.stayEndDate} />
              </span>
              {item.originCity ? (
                <span>{geoName(item.originCity, locale)}</span>
              ) : null}
            </div>
            <HeadcountPills
              type="CARAVAN"
              male={item.maleCount}
              female={item.femaleCount}
              total={item.memberCount}
              format={n}
              maleLabel={t("reservations.countMale")}
              femaleLabel={t("reservations.countFemale")}
              totalLabel={t("reservations.countTotal")}
            />
            {item.alreadyMemberCount ? (
              <p className="text-xs text-ink-500">
                {t("reservations.previousAlreadyCount", {
                  count: n(item.alreadyMemberCount),
                })}
              </p>
            ) : null}
            {mismatch ? (
              <p className="text-xs font-medium text-ink-600">
                {t("reservations.previousCountMismatch")}
              </p>
            ) : null}
            <Button
              type="button"
              disabled={busy || !item.transferableCount}
              onClick={() => transfer(item)}
            >
              <UserPlus className="size-4" aria-hidden />
              {t("reservations.previousTransfer", {
                count: n(item.transferableCount || item.memberCount),
              })}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
