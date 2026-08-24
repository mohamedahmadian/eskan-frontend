import { ArrowRight, Ban, Hourglass, RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation, Trans } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  LoadingState,
  PageHeader,
  cardClassName,
  listShellClassName,
} from "../../components/ui/Form";
import { DateText } from "../../components/ui/DateText";
import { confirmToast } from "../../components/ui/confirmToast";
import { api, getApiErrorMessage } from "../../lib/api";
import { formatNumber } from "../../lib/datetime";
import type { Reservation } from "../../types/app";
import {
  currentStepFromStatus,
  ownerCanEditStep,
  ownerFlowSteps,
  type ReservationStepCode,
} from "./reservation-steps";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { CompanionsStep } from "./ReservationCompanionsStep";
import { ReservationContactsStep } from "./ReservationContactsStep";
import { ReservationTravelStep } from "./ReservationTravelStep";
import { ReservationStepReadonly } from "./ReservationStepReadonly";
import { ReservationCompleteSummary } from "./ReservationCompleteSummary";
import { ReservationTravelSummary } from "./ReservationTravelSummary";
import { ReservationTimeline } from "./ReservationTimeline";
import { ReservationWizardShell } from "./ReservationWizardShell";
import { InsuranceStep } from "./ReservationInsuranceStep";
import { ReservationTitleMeta } from "./ReservationSectionHeader";

export function ReservationWizardPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const { id } = useParams();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reservations", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${id}`);
      return data;
    },
  });

  const reservation = query.data;
  const currentStep = reservation
    ? currentStepFromStatus(reservation.status, reservation.type)
    : "travel";
  const [viewedStep, setViewedStep] = useState<ReservationStepCode | null>(
    reservation?.status === "CANCELLED" ? null : currentStep,
  );

  useEffect(() => {
    setViewedStep(reservation?.status === "CANCELLED" ? null : currentStep);
  }, [currentStep, reservation?.status]);

  if (!id || query.isLoading) return <LoadingState />;
  if (query.isError || !reservation) {
    const status = axios.isAxiosError(query.error)
      ? query.error.response?.status
      : 0;
    const message =
      status === 403
        ? t("reservations.forbidden")
        : status === 404
          ? t("reservations.notFound")
          : t("common.error");
    return <p className="text-sm text-red-700">{message}</p>;
  }

  const blocked =
    reservation.status === "REJECTED" || reservation.status === "CANCELLED";

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={`${t("reservations.wizard")} ${formatNumber(reservation.year, locale)}`}
        subtitle={
          <ReservationTitleMeta
            reservation={reservation}
            extra={
              reservation.status === "PENDING_MANAGEMENT_REVIEW" ||
              reservation.status === "CANCELLED" ? null : (
                <ReservationStatusBadge status={reservation.status} />
              )
            }
          />
        }
      />
      {reservation.status === "REJECTED" ? (
        <div className={`${cardClassName} mb-4 border-red-100 p-4`}>
          <p className="font-medium text-red-700">
            {t("reservations.rejectedTitle")}
          </p>
          <p className="mt-1 text-sm text-ink-600">
            {t("reservations.rejectedHint")}
          </p>
          {reservation.rejectionReason ? (
            <p className="mt-2 text-sm text-ink-800">
              {t("reservations.rejectionReason")}: {reservation.rejectionReason}
            </p>
          ) : null}
        </div>
      ) : null}
      {reservation.status === "CANCELLED" ? (
        <CancelledBanner cancelledAt={reservation.cancelledAt} />
      ) : null}
      {reservation.status === "PENDING_MANAGEMENT_REVIEW" ? (
        <ReviewWaitingBanner />
      ) : null}
      {reservation.returnedToStatus === reservation.status &&
      reservation.status !== "REJECTED" ? (
        <ReturnedBanner />
      ) : null}

      <ReservationWizardShell
        reservation={reservation}
        viewedStep={viewedStep}
        onViewStep={setViewedStep}
      >
        {reservation.status === "CANCELLED" ? (
          viewedStep ? (
            <ReservationStepReadonly
              reservation={reservation}
              step={viewedStep}
              onBack={() => setViewedStep(null)}
              backLabel={t("reservations.backToFileInfo")}
            />
          ) : (
            <ReservationCompleteSummary
              reservation={reservation}
              variant="cancelled"
            />
          )
        ) : blocked ? (
          <div className={`${cardClassName} p-6`}>
            <ReservationStatusBadge status={reservation.status} />
          </div>
        ) : viewedStep &&
          viewedStep !== currentStep &&
          !ownerCanEditStep(viewedStep, reservation.status, reservation.type) ? (
          <ReservationStepReadonly
            reservation={reservation}
            step={viewedStep}
            onBack={() => setViewedStep(currentStep)}
          />
        ) : (
          <ActiveStep
            reservation={reservation}
            step={viewedStep ?? currentStep}
            onChanged={() =>
              queryClient.invalidateQueries({ queryKey: ["reservations", id] })
            }
            onGoToStep={setViewedStep}
            footer={
              viewedStep &&
              viewedStep !== currentStep &&
              !ownerFlowSteps(reservation.type).includes(viewedStep) ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setViewedStep(currentStep)}
                >
                  <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
                  {t("reservations.backToCurrentStep")}
                </Button>
              ) : null
            }
          />
        )}
      </ReservationWizardShell>
      <div className="mt-4">
        <ReservationTimeline reservation={reservation} />
      </div>
      {reservation.status !== "COMPLETED" &&
      reservation.status !== "CANCELLED" ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="danger"
            onClick={() =>
              confirmToast({
                title: t("reservations.confirmCancelFile"),
                confirmLabel: t("reservations.cancelFile"),
                cancelLabel: t("common.cancel"),
                confirmVariant: "danger",
                onConfirm: async () => {
                  try {
                    await api.post(`/reservations/${reservation.id}/cancel`);
                    toast.success(t("reservations.cancelledOk"));
                    void queryClient.invalidateQueries({
                      queryKey: ["reservations", id],
                    });
                    void queryClient.invalidateQueries({
                      queryKey: ["reservations", "mine"],
                    });
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, t("common.error")));
                  }
                },
              })
            }
          >
            <Ban className="size-4" aria-hidden />
            {t("reservations.cancelFile")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ActiveStep({
  reservation,
  onChanged,
  onGoToStep,
  step,
  footer,
}: {
  reservation: Reservation;
  onChanged: () => void;
  onGoToStep?: (step: ReservationStepCode) => void;
  step?: ReservationStepCode;
  footer?: ReactNode;
}) {
  const active = step ?? currentStepFromStatus(reservation.status, reservation.type);
  const body =
    active === "travel" ? (
      <ReservationTravelStep reservation={reservation} onChanged={onChanged} />
    ) : active === "review" ? (
      <ReviewStep reservation={reservation} />
    ) : active === "companions" ? (
      <CompanionsStep
        reservation={reservation}
        onChanged={onChanged}
        onGoToStep={onGoToStep}
      />
    ) : active === "contacts" ? (
      <ReservationContactsStep
        reservation={reservation}
        onChanged={onChanged}
        onGoToStep={onGoToStep}
      />
    ) : active === "insurance" ? (
      <InsuranceStep
        reservation={reservation}
        onChanged={onChanged}
        onGoToStep={onGoToStep}
      />
    ) : (
      <ReservationCompleteSummary reservation={reservation} />
    );

  if (!footer) return body;
  return (
    <div>
      {body}
      <div className="mt-3">{footer}</div>
    </div>
  );
}

function ReviewStep({ reservation }: { reservation: Reservation }) {
  const { t } = useTranslation();
  return (
    <ReservationTravelSummary
      reservation={reservation}
      variant="review"
      hint={
        reservation.managementReviewedAt
          ? t("reservations.reviewAuto")
          : t("reservations.reviewSummaryHint")
      }
    />
  );
}

function CancelledAtDate({ value }: { value: string | null }) {
  return (
    <span className="mx-1 inline-flex align-baseline text-red-800">
      <DateText value={value} withTime />
    </span>
  );
}

function CancelledBanner({ cancelledAt }: { cancelledAt: string | null }) {
  const { t } = useTranslation();
  return (
    <aside
      className="mb-4 flex flex-col items-center gap-3 rounded-[28px] border-2 border-red-200 bg-gradient-to-b from-red-50 via-white to-white px-5 py-7 text-center shadow-[0_16px_36px_rgba(185,28,28,0.14)]"
      role="status"
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-red-500 text-white shadow-[0_10px_22px_rgba(185,28,28,0.28)]">
        <Ban className="size-8" aria-hidden />
      </span>
      <p className="text-xl font-bold leading-8 text-red-700 sm:text-2xl">
        <Trans
          i18nKey="reservations.cancelledByYou"
          components={{ date: <CancelledAtDate value={cancelledAt} /> }}
        />
      </p>
      <p className="max-w-lg text-sm leading-7 text-ink-700">
        {t("reservations.cancelledHint")}
      </p>
    </aside>
  );
}

function ReturnedBanner() {
  const { t } = useTranslation();
  return (
    <div className={`${cardClassName} mb-4 border-teal-100 p-4`}>
      <p className="flex items-center gap-2 font-medium text-teal-800">
        <RotateCcw className="size-4 shrink-0" aria-hidden />
        {t("reservations.returnedTitle")}
      </p>
      <p className="mt-1 text-sm text-ink-600">{t("reservations.returnedHint")}</p>
    </div>
  );
}

function ReviewWaitingBanner() {
  const { t } = useTranslation();
  return (
    <aside
      className="mb-4 flex flex-col items-center gap-3 rounded-[28px] border-2 border-gold-400 bg-gradient-to-b from-gold-100 via-gold-50 to-white px-5 py-7 text-center shadow-[0_16px_36px_rgba(232,184,58,0.2)]"
      role="status"
      aria-live="polite"
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-gold-500 text-white shadow-[0_10px_22px_rgba(196,146,26,0.35)]">
        <Hourglass className="size-8" aria-hidden />
      </span>
      <p className="text-xl font-bold leading-8 text-gold-600 sm:text-2xl">
        {t("reservations.statuses.PENDING_MANAGEMENT_REVIEW")}
      </p>
      <p className="max-w-lg text-sm leading-7 text-ink-700">
        {t("reservations.reviewWaiting")}
      </p>
      <p className="text-base font-semibold text-ink-900">
        {t("reservations.reviewPleaseWait")}
      </p>
    </aside>
  );
}

