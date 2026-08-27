import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Form";
import type { Reservation } from "../../types/app";
import { type ReservationStepCode } from "./reservation-steps";
import { ReservationCompanionsSummary } from "./ReservationCompanionsStep";
import { ReservationCompleteSummary } from "./ReservationCompleteSummary";
import { ReservationPlacementPanel } from "./ReservationPlacementPanel";
import { ReservationContactsSummary } from "./ReservationContactsStep";
import { ReservationInsuranceSummary } from "./ReservationInsuranceSummary";
import { ReservationTravelSummary } from "./ReservationTravelSummary";

export function ReservationStepReadonly({
  reservation,
  step,
  onBack,
  backLabel,
  audience = "owner",
}: {
  reservation: Reservation;
  step: ReservationStepCode;
  onBack?: () => void;
  backLabel?: string;
  audience?: "owner" | "admin";
}) {
  const { t } = useTranslation();
  const backButton = onBack ? (
    <Button type="button" variant="ghost" onClick={onBack}>
      <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
      {backLabel ?? t("reservations.backToCurrentStep")}
    </Button>
  ) : undefined;

  if (step === "travel" || step === "review") {
    return (
      <ReservationTravelSummary
        reservation={reservation}
        variant={step}
        hint={t("reservations.readonlyHint")}
        readonly
        footer={backButton}
      />
    );
  }

  if (step === "insurance") {
    return (
      <ReservationInsuranceSummary
        reservation={reservation}
        hint={t("reservations.readonlyHint")}
        readonly
        footer={backButton}
      />
    );
  }

  if (step === "placement") {
    return (
      <ReservationPlacementPanel reservation={reservation} footer={backButton} />
    );
  }

  if (step === "complete") {
    return (
      <ReservationCompleteSummary
        reservation={reservation}
        audience={audience}
        footer={backButton}
      />
    );
  }

  if (step === "companions") {
    return (
      <ReservationCompanionsSummary
        reservation={reservation}
        hint={t("reservations.readonlyHint")}
        readonly
        footer={backButton}
      />
    );
  }

  return (
    <ReservationContactsSummary
      reservation={reservation}
      hint={t("reservations.readonlyHint")}
      readonly
      footer={backButton}
    />
  );
}
