import {
  AlertCircle,
  BookUser,
  Calendar,
  Check,
  CreditCard,
  FileSpreadsheet,
  History,
  IdCard,
  Mars,
  Pencil,
  Phone,
  SearchX,
  Smartphone,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  Venus,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  ToggleField,
  cardClassName,
  fieldClassName,
} from "../../components/ui/Form";
import { confirmToast } from "../../components/ui/confirmToast";
import { CheckboxField } from "../../components/ui/CheckboxField";
import { PersianDateField } from "../../components/ui/PersianDateField";
import { CopyableDigits } from "../../components/ui/CopyableDigits";
import { api, getApiErrorMessage } from "../../lib/api";
import { formatNumber } from "../../lib/datetime";
import {
  isValidIranianNationalId,
  normalizeNationalId,
  normalizePassportNumber,
} from "../../lib/national-id";
import type {
  Reservation,
  ReservationMember,
  ReservationPerson,
} from "../../types/app";
import { neighborFlowStep, showSimBankRequests, stepLabelKey, type ReservationStepCode } from "./reservation-steps";
import { ReservationStepNav } from "./ReservationStepNav";
import { CompanionExcelImport } from "./CompanionExcelImport";
import { PreviousMembersPanel } from "./PreviousMembersPanel";
import { ReservationMembersGrid } from "./ReservationMembersGrid";
import {
  ReservationIdentityChips,
  ReservationMetaChip,
  ReservationSectionHeader,
} from "./ReservationSectionHeader";

type LookupResponse =
  { found: false } | { found: true; user: ReservationPerson };

type CompanionPanel = "new" | "excel" | "previousCaravan";
type Tone = "teal" | "mint" | "ink";
type CountMatch = "ok" | "mismatch";

function countMatch(have: number, need: number): CountMatch {
  return have === need ? "ok" : "mismatch";
}

function genderSlotOpen(
  gender: "MALE" | "FEMALE",
  need: number,
  have: number,
  editing?: ReservationMember | null,
) {
  if (editing?.user.gender === gender) return true;
  if (need <= 0) return false;
  return have < need;
}

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: "border-teal-100 bg-gradient-to-b from-teal-50 to-white",
    icon: "bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]",
  },
  mint: {
    wrap: "border-mint-100 bg-gradient-to-b from-mint-50 to-white",
    icon: "bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190),0.24)]",
  },
  ink: {
    wrap: "border-line bg-gradient-to-b from-cream-50 to-white",
    icon: "bg-ink-700 text-white",
  },
};

export function CompanionsStep({
  reservation,
  onChanged,
  onGoToStep,
  mode = "owner",
}: {
  reservation: Reservation;
  onChanged: () => void;
  onGoToStep?: (step: ReservationStepCode) => void;
  mode?: "owner" | "admin";
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const canSeeMembers = reservation.members !== undefined;
  const members = reservation.members ?? [];
  const males = members.filter((item) => item.user.gender === "MALE").length;
  const females = members.filter(
    (item) => item.user.gender === "FEMALE",
  ).length;
  const remaining = Math.max(0, reservation.totalCount - members.length);
  const countsOk =
    members.length === reservation.totalCount &&
    males === reservation.maleCount &&
    females === reservation.femaleCount;
  const isCaravan = reservation.type === "CARAVAN";
  const showNav =
    reservation.status !== "COMPLETED" &&
    reservation.status !== "CANCELLED" &&
    reservation.status !== "REJECTED";
  const nextStep = neighborFlowStep(reservation.type, "companions", 1, reservation);
  const [panel, setPanel] = useState<CompanionPanel | null>(null);
  const [editingMember, setEditingMember] = useState<ReservationMember | null>(
    null,
  );
  const maleOpen = genderSlotOpen("MALE", reservation.maleCount, males, null);
  const femaleOpen = genderSlotOpen(
    "FEMALE",
    reservation.femaleCount,
    females,
    null,
  );

  const complete = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Reservation>(
        `/reservations/${reservation.id}/companions/complete`,
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        t(
          isCaravan
            ? "reservations.companionsCompletedCaravan"
            : "reservations.companionsCompleted",
        ),
      );
      onChanged();
      if (nextStep && data.status !== "COMPANIONS") onGoToStep?.(nextStep);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, t("common.error"))),
  });

  if (!canSeeMembers) {
    return (
      <p className={`${cardClassName} p-4 text-sm text-ink-600`}>
        {t("reservations.membersHidden")}
      </p>
    );
  }

  return (
    <CompanionsFrame
      reservation={reservation}
      members={members}
      males={males}
      females={females}
      remaining={remaining}
      locale={locale}
      hint={t(
        mode === "admin"
          ? "reservations.adminEditHint"
          : isCaravan
            ? "reservations.companionsStepHintCaravan"
            : "reservations.companionsStepHint",
      )}
      footer={
        showNav && nextStep ? (
          <ReservationStepNav
            nextPending={complete.isPending}
            nextDisabled={!countsOk}
            onNext={() => {
              if (!countsOk) return;
              complete.mutate();
            }}
          />
        ) : null
      }
    >
      <MembersList
        reservationId={reservation.id}
        members={members}
        isCaravan={isCaravan}
        showServiceRequests={showSimBankRequests(reservation)}
        maleNeed={reservation.maleCount}
        femaleNeed={reservation.femaleCount}
        onChanged={onChanged}
        addBlocked={!maleOpen && !femaleOpen}
        onAddNew={() => {
          if (!maleOpen && !femaleOpen) {
            toast.error(t("reservations.memberSlotsClosed"));
            return;
          }
          setEditingMember(null);
          setPanel("new");
        }}
        onImportExcel={() => setPanel("excel")}
        onImportPrevious={isCaravan ? () => setPanel("previousCaravan") : undefined}
        onEdit={(member) => {
          setEditingMember(member);
          setPanel("new");
        }}
      />
      {panel === "new" ? (
        <CompanionFormModal
          title={
            editingMember
              ? t(
                  isCaravan
                    ? "reservations.editMemberTitleCaravan"
                    : "reservations.editMemberTitle",
                )
              : t("reservations.newPilgrimTitle")
          }
          icon={editingMember ? Pencil : UserPlus}
          busy={false}
          onClose={() => {
            setPanel(null);
            setEditingMember(null);
          }}
        >
          <MemberLookupForm
            key={editingMember?.id ?? "new"}
            reservationId={reservation.id}
            isCaravan={isCaravan}
            iraqi={Boolean(reservation.iraqiWorkflow)}
            showServiceRequests={showSimBankRequests(reservation)}
            maleNeed={reservation.maleCount}
            femaleNeed={reservation.femaleCount}
            maleHave={males}
            femaleHave={females}
            editing={editingMember}
            onAdded={() => {
              setEditingMember(null);
              setPanel(null);
              onChanged();
            }}
            onCancelEdit={() => {
              setPanel(null);
              setEditingMember(null);
            }}
          />
        </CompanionFormModal>
      ) : null}
      {panel === "excel" ? (
        <CompanionFormModal
          title={t("reservations.companionTabs.excel")}
          icon={FileSpreadsheet}
          wide
          onClose={() => setPanel(null)}
        >
          <CompanionExcelImport
            reservationId={reservation.id}
            isCaravan={isCaravan}
            onImported={() => {
              setPanel(null);
              onChanged();
            }}
          />
        </CompanionFormModal>
      ) : null}
      {panel === "previousCaravan" && isCaravan ? (
        <CompanionFormModal
          title={t("reservations.companionTabs.previousCaravan")}
          icon={History}
          onClose={() => setPanel(null)}
        >
          <PreviousMembersPanel
            reservation={reservation}
            onImported={() => {
              setPanel(null);
              onChanged();
            }}
          />
        </CompanionFormModal>
      ) : null}
    </CompanionsFrame>
  );
}

export function ReservationCompanionsSummary({
  reservation,
  hint,
  readonly,
  footer,
}: {
  reservation: Reservation;
  hint?: string;
  readonly?: boolean;
  footer?: ReactNode;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const members = reservation.members ?? [];
  const males = members.filter((item) => item.user.gender === "MALE").length;
  const females = members.filter(
    (item) => item.user.gender === "FEMALE",
  ).length;
  const remaining = Math.max(0, reservation.totalCount - members.length);

  return (
    <CompanionsFrame
      reservation={reservation}
      members={members}
      males={males}
      females={females}
      remaining={remaining}
      locale={locale}
      hint={hint}
      readonly={readonly}
      footer={
        footer ? (
          <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div>
        ) : null
      }
    >
      <MembersList
        members={members}
        isCaravan={reservation.type === "CARAVAN"}
        maleNeed={reservation.maleCount}
        femaleNeed={reservation.femaleCount}
      />
    </CompanionsFrame>
  );
}

function CompanionsFrame({
  reservation,
  members,
  males,
  females,
  remaining,
  locale,
  hint,
  readonly,
  footer,
  children,
}: {
  reservation: Reservation;
  members: ReservationMember[];
  males: number;
  females: number;
  remaining: number;
  locale: string;
  hint?: string;
  readonly?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, locale);
  const showMaleTile = !(males === 0 && reservation.maleCount === 0);
  const showFemaleTile = !(females === 0 && reservation.femaleCount === 0);
  const metricCols =
    showMaleTile && showFemaleTile
      ? "grid-cols-3"
      : showMaleTile || showFemaleTile
        ? "grid-cols-2"
        : "grid-cols-1";

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <ReservationSectionHeader
        icon={Users}
        title={t(stepLabelKey("companions", reservation.type))}
        hint={hint}
        readonly={readonly}
        chips={
          <ReservationIdentityChips
            reservation={reservation}
            extra={
              <ReservationMetaChip
                icon={UserPlus}
                label={t("reservations.remainingCount", { count: n(remaining) })}
                tone={remaining > 0 ? "alert" : "default"}
              />
            }
          />
        }
      />
      <div className="space-y-5 p-5 sm:p-6">
        <section>
          <div className={`grid gap-2 ${metricCols}`}>
            {showMaleTile ? (
              <MetricTile
                icon={Mars}
                label={t("reservations.male")}
                value={t("reservations.countProgress", {
                  have: n(males),
                  need: n(reservation.maleCount),
                })}
                tone="teal"
                match={countMatch(males, reservation.maleCount)}
              />
            ) : null}
            {showFemaleTile ? (
              <MetricTile
                icon={Venus}
                label={t("reservations.female")}
                value={t("reservations.countProgress", {
                  have: n(females),
                  need: n(reservation.femaleCount),
                })}
                tone="mint"
                match={countMatch(females, reservation.femaleCount)}
              />
            ) : null}
            <MetricTile
              icon={Users}
              label={t("reservations.registeredShort")}
              value={t("reservations.countProgress", {
                have: n(members.length),
                need: n(reservation.totalCount),
              })}
              tone="ink"
              match={countMatch(members.length, reservation.totalCount)}
            />
          </div>
        </section>
        {children}
      </div>
      {footer}
    </section>
  );
}

function CompanionFormModal({
  title,
  icon: Icon,
  busy,
  wide,
  onClose,
  children,
}: {
  title: string;
  icon: LucideIcon;
  busy?: boolean;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t("common.cancel")}
        disabled={busy}
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="companion-member-title"
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[22px] sm:rounded-[22px] ${
          wide ? "sm:max-w-6xl" : "sm:max-w-3xl"
        } ${cardClassName}`}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
            <Icon className="size-4" aria-hidden />
          </span>
          <h2
            id="companion-member-title"
            className="min-w-0 flex-1 pt-2 text-sm font-semibold text-ink-900"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            icon
            disabled={busy}
            aria-label={t("common.cancel")}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function MemberLookupForm({
  reservationId,
  isCaravan = false,
  iraqi = false,
  showServiceRequests = false,
  maleNeed,
  femaleNeed,
  maleHave,
  femaleHave,
  onAdded,
  editing,
  onCancelEdit,
}: {
  reservationId: string;
  isCaravan?: boolean;
  iraqi?: boolean;
  showServiceRequests?: boolean;
  maleNeed: number;
  femaleNeed: number;
  maleHave: number;
  femaleHave: number;
  onAdded: () => void;
  editing?: ReservationMember | null;
  onCancelEdit?: () => void;
}) {
  const { t } = useTranslation();
  const nationalIdRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const lookupSeq = useRef(0);
  const lookingRef = useRef(false);
  const inflight = useRef<{
    key: string;
    seq: number;
    promise: Promise<boolean>;
  } | null>(null);
  const serviceRef = useRef({ sim: false, bank: false });
  const passportTimer = useRef<number | null>(null);
  const [nationalId, setNationalId] = useState(() =>
    editing && !iraqi ? (editing.user.nationalId ?? "") : "",
  );
  const [passportNumber, setPassportNumber] = useState(() =>
    editing && iraqi ? (editing.user.nationalId ?? "") : "",
  );
  const [looking, setLooking] = useState(false);
  const [missingNationalId, setMissingNationalId] = useState<string | null>(
    null,
  );
  const [person, setPerson] = useState<Partial<ReservationPerson>>(() =>
    editing
      ? {
          firstName: editing.user.firstName,
          lastName: editing.user.lastName,
          phone: editing.user.phone ?? "",
          fullName: editing.user.fullName,
        }
      : {},
  );
  const [gender, setGender] = useState(() => {
    if (editing?.user.gender === "MALE" || editing?.user.gender === "FEMALE") {
      return editing.user.gender;
    }
    if (genderSlotOpen("MALE", maleNeed, maleHave, null)) return "MALE";
    if (genderSlotOpen("FEMALE", femaleNeed, femaleHave, null)) return "FEMALE";
    return "MALE";
  });
  const [birthDate, setBirthDate] = useState(
    () => editing?.user.birthDate ?? "",
  );
  const [requestsSimCard, setRequestsSimCard] = useState(() =>
    Boolean(editing?.requestsSimCard),
  );
  const [requestsBankCard, setRequestsBankCard] = useState(() =>
    Boolean(editing?.requestsBankCard),
  );
  function slotOpen(
    next: "MALE" | "FEMALE",
    editingMember: ReservationMember | null | undefined = editing,
  ) {
    return genderSlotOpen(
      next,
      next === "MALE" ? maleNeed : femaleNeed,
      next === "MALE" ? maleHave : femaleHave,
      editingMember,
    );
  }

  const maleAllowed = slotOpen("MALE");
  const femaleAllowed = slotOpen("FEMALE");

  function slotClosedMessage(gender: "MALE" | "FEMALE") {
    return t(
      gender === "MALE"
        ? "reservations.maleSlotClosed"
        : "reservations.femaleSlotClosed",
    );
  }

  function blockFoundGender(gender: string | null | undefined) {
    if (gender !== "MALE" && gender !== "FEMALE") return false;
    if (slotOpen(gender, null)) return false;
    toast.error(slotClosedMessage(gender));
    return true;
  }

  async function runIdentityLookup(
    kind: "nid" | "pass",
    value: string,
  ): Promise<boolean> {
    const key = `${kind}:${value}`;
    if (
      inflight.current?.key === key &&
      inflight.current.seq === lookupSeq.current
    ) {
      return inflight.current.promise;
    }
    const seq = ++lookupSeq.current;
    const promise = (async () => {
      lookingRef.current = true;
      setLooking(true);
      setMissingNationalId((current) =>
        current && current !== value ? null : current,
      );
      try {
        const { data } = await api.post<LookupResponse>(
          "/pilgrims/identity-lookup",
          kind === "nid" ? { nationalId: value } : { passportNumber: value },
        );
        if (seq !== lookupSeq.current) return false;
        if (data.found) {
          if (blockFoundGender(data.user.gender)) {
            if (inflight.current?.key === key) inflight.current = null;
            return false;
          }
          await api.post(`/reservations/${reservationId}/members`, {
            ...(kind === "nid"
              ? { nationalId: value }
              : { passportNumber: value }),
            requestsSimCard: showServiceRequests ? serviceRef.current.sim : false,
            requestsBankCard: showServiceRequests
              ? serviceRef.current.bank
              : false,
          });
          toast.success(
            t(
              isCaravan
                ? "reservations.memberAddedCaravan"
                : "reservations.memberAdded",
            ),
          );
          onAdded();
          return true;
        }
        setMissingNationalId(value);
        return false;
      } catch (error) {
        if (inflight.current?.key === key) inflight.current = null;
        if (seq !== lookupSeq.current) return false;
        toast.error(getApiErrorMessage(error, t("common.error")));
        return false;
      } finally {
        if (seq === lookupSeq.current) {
          lookingRef.current = false;
          setLooking(false);
        }
      }
    })();
    inflight.current = { key, seq, promise };
    return promise;
  }

  useEffect(() => {
    serviceRef.current = { sim: requestsSimCard, bank: requestsBankCard };
  }, [requestsBankCard, requestsSimCard]);

  useEffect(() => {
    return () => {
      lookupSeq.current += 1;
      if (passportTimer.current != null) {
        window.clearTimeout(passportTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (editing) firstNameRef.current?.focus({ preventScroll: true });
      else nationalIdRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [editing]);

  useEffect(() => {
    if (editing || !missingNationalId) return;
    const frame = requestAnimationFrame(() => {
      lastNameRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [missingNationalId, editing]);

  function cancelLookup(prefix: "nid:" | "pass:") {
    if (!inflight.current?.key.startsWith(prefix) && !lookingRef.current) {
      return;
    }
    lookupSeq.current += 1;
    inflight.current = null;
    lookingRef.current = false;
    setLooking(false);
    setMissingNationalId(null);
  }

  function changeNationalId(raw: string) {
    const id = normalizeNationalId(raw);
    setNationalId(isValidIranianNationalId(id) ? id : raw);
    if (editing || iraqi) return;
    if (!isValidIranianNationalId(id)) {
      cancelLookup("nid:");
      if (/^\d{10}$/.test(id)) toast.error(t("users.nationalIdInvalid"));
      return;
    }
    void runIdentityLookup("nid", id);
  }

  function changePassport(raw: string) {
    const passport = normalizePassportNumber(raw);
    setPassportNumber(passport.length >= 5 ? passport : raw);
    if (passportTimer.current != null) {
      window.clearTimeout(passportTimer.current);
      passportTimer.current = null;
    }
    if (editing || !iraqi) return;
    if (passport.length < 5) {
      cancelLookup("pass:");
      return;
    }
    passportTimer.current = window.setTimeout(() => {
      passportTimer.current = null;
      void runIdentityLookup("pass", passport);
    }, 400);
  }

  const save = useMutation({
    mutationFn: async () => {
      const id = iraqi ? "" : normalizeNationalId(nationalId);
      if (!editing && !iraqi) {
        if (!id) throw new Error(t("users.nationalIdRequired"));
        if (!isValidIranianNationalId(id)) {
          throw new Error(t("users.nationalIdInvalid"));
        }
      } else if (id && !isValidIranianNationalId(id)) {
        throw new Error(t("users.nationalIdInvalid"));
      }
      const passport = iraqi
        ? normalizePassportNumber(passportNumber)
        : "";
      if (iraqi) {
        if (!passport || passport.length < 5) {
          throw new Error(t("reservations.passportInvalid"));
        }
      }
      const nextGender = gender === "FEMALE" ? "FEMALE" : "MALE";
      if (!slotOpen(nextGender)) {
        throw new Error(slotClosedMessage(nextGender));
      }
      const payload = {
        nationalId: id || null,
        passportNumber: passport || null,
        firstName: person.firstName,
        lastName: person.lastName,
        gender: nextGender,
        phone: person.phone || null,
        birthDate: birthDate || null,
        requestsSimCard: showServiceRequests ? requestsSimCard : false,
        requestsBankCard: showServiceRequests ? requestsBankCard : false,
      };
      if (editing) {
        await api.patch(
          `/reservations/${reservationId}/members/${editing.id}`,
          payload,
        );
        return;
      }
      await api.post(`/reservations/${reservationId}/members`, payload);
    },
    onSuccess: () => {
      toast.success(
        editing
          ? t(
              isCaravan
                ? "reservations.memberUpdatedCaravan"
                : "reservations.memberUpdated",
            )
          : t(
              isCaravan
                ? "reservations.memberAddedCaravan"
                : "reservations.memberAdded",
            ),
      );
      onAdded();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error &&
        (error.message === t("users.nationalIdInvalid") ||
          error.message === t("users.nationalIdRequired") ||
          error.message === t("reservations.passportInvalid") ||
          error.message === t("reservations.maleSlotClosed") ||
          error.message === t("reservations.femaleSlotClosed"))
          ? error.message
          : getApiErrorMessage(error, t("common.error")),
      ),
  });

  function closeForm() {
    if (save.isPending || lookingRef.current) return;
    onCancelEdit?.();
  }

  async function submitForm() {
    if (save.isPending || lookingRef.current) return;
    if (passportTimer.current != null) {
      window.clearTimeout(passportTimer.current);
      passportTimer.current = null;
    }
    if (!editing) {
      if (iraqi) {
        const passport = normalizePassportNumber(passportNumber);
        if (passport.length >= 5 && missingNationalId !== passport) {
          await runIdentityLookup("pass", passport);
          return;
        }
      } else {
        const id = normalizeNationalId(nationalId);
        if (isValidIranianNationalId(id) && missingNationalId !== id) {
          await runIdentityLookup("nid", id);
          return;
        }
      }
    }
    save.mutate();
  }

  return (
    <AppForm
      autoFocusFirst={false}
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm();
      }}
      className="space-y-4"
    >
      {!editing && missingNationalId ? (
        <NationalIdNotFoundNotice
          nationalId={missingNationalId}
          iraqi={iraqi}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {iraqi ? (
          <FormField
            icon={BookUser}
            label={t("users.passportNumber")}
            htmlFor="companion-passport"
          >
            <input
              id="companion-passport"
              ref={nationalIdRef}
              className={fieldClassName}
              value={passportNumber}
              onChange={(event) => changePassport(event.target.value)}
              autoComplete="off"
              required
            />
            {looking ? (
              <p className="text-xs text-ink-500">{t("reservations.looking")}</p>
            ) : null}
          </FormField>
        ) : (
          <FormField
            icon={IdCard}
            label={t("users.nationalId")}
            htmlFor="companion-nid"
          >
            <input
              id="companion-nid"
              ref={nationalIdRef}
              className={`${fieldClassName} digit-field`}
              value={nationalId}
              onChange={(event) => changeNationalId(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              required={!editing}
            />
            {looking ? (
              <p className="text-xs text-ink-500">{t("reservations.looking")}</p>
            ) : null}
          </FormField>
        )}
        <FormField
          icon={UserRound}
          label={t("users.firstName")}
          htmlFor="c-first"
        >
          <input
            id="c-first"
            ref={firstNameRef}
            className={fieldClassName}
            value={person.firstName ?? ""}
            onChange={(event) =>
              setPerson((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
            required
          />
        </FormField>
        <FormField
          icon={UserRound}
          label={t("users.lastName")}
          htmlFor="c-last"
        >
          <input
            id="c-last"
            ref={lastNameRef}
            className={fieldClassName}
            value={person.lastName ?? ""}
            onChange={(event) =>
              setPerson((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
            required
          />
        </FormField>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField icon={Users} label={t("users.gender")}>
          <div className="space-y-1">
            <ToggleField
              checked={gender !== "FEMALE"}
              disableOn={!maleAllowed}
              disableOff={!femaleAllowed}
              onChange={(male) => {
                const next = male ? "MALE" : "FEMALE";
                if (!slotOpen(next)) {
                  toast.error(slotClosedMessage(next));
                  return;
                }
                setGender(next);
              }}
              onLabel={t("userGenders.MALE")}
              offLabel={t("userGenders.FEMALE")}
            />
            {!maleAllowed ? (
              <p className="text-xs text-ink-500">{t("reservations.maleSlotClosed")}</p>
            ) : null}
            {!femaleAllowed ? (
              <p className="text-xs text-ink-500">{t("reservations.femaleSlotClosed")}</p>
            ) : null}
          </div>
        </FormField>
        <FormField icon={Calendar} label={t("users.birthDate")}>
          <PersianDateField
            value={birthDate}
            onChange={(value) => setBirthDate(value ?? "")}
          />
        </FormField>
        <FormField icon={Phone} label={t("users.phone")} htmlFor="c-phone">
          <input
            id="c-phone"
            className={`${fieldClassName} digit-field`}
            value={person.phone ?? ""}
            onChange={(event) =>
              setPerson((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            inputMode="tel"
            autoComplete="tel"
          />
        </FormField>
      </div>
      {showServiceRequests ? (
        <MemberServiceRequestFields
          requestsSimCard={requestsSimCard}
          requestsBankCard={requestsBankCard}
          onSimChange={setRequestsSimCard}
          onBankChange={setRequestsBankCard}
        />
      ) : null}
      <FormActions
        submitLabel={
          editing
            ? t("reservations.saveMember")
            : t("reservations.addMember")
        }
        cancelLabel={t("common.cancel")}
        submitting={save.isPending || looking}
        onCancel={closeForm}
      />
    </AppForm>
  );
}

function MemberServiceRequestFields({
  requestsSimCard,
  requestsBankCard,
  onSimChange,
  onBankChange,
}: {
  requestsSimCard: boolean;
  requestsBankCard: boolean;
  onSimChange: (checked: boolean) => void;
  onBankChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CheckboxField
        id="member-requests-sim"
        checked={requestsSimCard}
        onChange={onSimChange}
        label={
          <span className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t("reservations.memberRequestsSimCard")}
          </span>
        }
      />
      <CheckboxField
        id="member-requests-bank"
        checked={requestsBankCard}
        onChange={onBankChange}
        label={
          <span className="flex items-center gap-2">
            <CreditCard className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t("reservations.memberRequestsBankCard")}
          </span>
        }
      />
    </div>
  );
}

function NationalIdNotFoundNotice({
  nationalId,
  iraqi = false,
}: {
  nationalId: string;
  iraqi?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <aside
      className="relative overflow-hidden rounded-[22px] border border-gold-100 bg-gradient-to-b from-gold-50 via-white to-cream-50 p-4 shadow-[0_12px_28px_rgba(232,184,58,0.14)]"
      role="status"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-e from-gold-400 via-gold-500 to-teal-400"
        aria-hidden
      />
      <div className="flex items-start gap-3 pt-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
          <SearchX className="size-5" aria-hidden />
        </span>
        <p className="pt-2 text-sm font-semibold leading-7 text-ink-900">
          {t(
            iraqi
              ? "reservations.passportNotFoundBefore"
              : "reservations.nationalIdNotFoundBefore",
          )}
          <span className="mx-1.5 inline-flex items-center rounded-lg bg-white px-2 py-0.5 font-bold tracking-wide text-ink-900 shadow-sm ring-1 ring-gold-100">
            <CopyableDigits value={nationalId} />
          </span>
          {t(
            iraqi
              ? "reservations.passportNotFoundAfter"
              : "reservations.nationalIdNotFoundAfter",
          )}
        </p>
      </div>
    </aside>
  );
}

function MembersList({
  reservationId,
  members,
  isCaravan = false,
  showServiceRequests = false,
  maleNeed,
  femaleNeed,
  onChanged,
  onEdit,
  onAddNew,
  addBlocked = false,
  onImportExcel,
  onImportPrevious,
}: {
  reservationId?: string;
  members: ReservationMember[];
  isCaravan?: boolean;
  showServiceRequests?: boolean;
  maleNeed?: number;
  femaleNeed?: number;
  onChanged?: () => void;
  onEdit?: (member: ReservationMember) => void;
  onAddNew?: () => void;
  addBlocked?: boolean;
  onImportExcel?: () => void;
  onImportPrevious?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const males = members.filter((item) => item.user.gender === "MALE").length;
  const females = members.filter((item) => item.user.gender === "FEMALE").length;
  const canManage = Boolean(reservationId && onChanged);

  function remove(member: ReservationMember) {
    if (!reservationId || !onChanged) return;
    confirmToast({
      title: t(
        isCaravan
          ? "reservations.confirmRemoveMemberCaravan"
          : "reservations.confirmRemoveMember",
      ),
      confirmLabel: t("common.yesDelete"),
      cancelLabel: t("common.cancel"),
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(
            `/reservations/${reservationId}/members/${member.id}`,
          );
          toast.success(
            t(
              isCaravan
                ? "reservations.memberRemovedCaravan"
                : "reservations.memberRemoved",
            ),
          );
          onChanged();
        } catch (error) {
          toast.error(getApiErrorMessage(error, t("common.error")));
        }
      },
    });
  }

  return (
    <section className="rounded-2xl border border-teal-100 bg-gradient-to-b from-cream-50/80 to-white p-4 shadow-[0_8px_20px_rgba(20,40,40,0.05)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon={Users} className="mb-0">
          {t(
            isCaravan
              ? "reservations.membersListTitleCaravan"
              : "reservations.membersListTitle",
          )}
        </SectionTitle>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onAddNew ? (
            <Button
              type="button"
              disabled={addBlocked}
              title={addBlocked ? t("reservations.memberSlotsClosed") : undefined}
              onClick={onAddNew}
            >
              <UserPlus className="size-4" aria-hidden />
              {t("reservations.newMember")}
            </Button>
          ) : null}
          {onImportExcel ? (
            <Button
              type="button"
              variant="soft"
              disabled={addBlocked}
              title={addBlocked ? t("reservations.memberSlotsClosed") : undefined}
              onClick={onImportExcel}
            >
              <FileSpreadsheet className="size-4" aria-hidden />
              {t("reservations.companionTabs.excel")}
            </Button>
          ) : null}
          {onImportPrevious ? (
            <Button
              type="button"
              variant="soft"
              disabled={addBlocked}
              title={addBlocked ? t("reservations.memberSlotsClosed") : undefined}
              onClick={onImportPrevious}
            >
              <History className="size-4" aria-hidden />
              {t("reservations.companionTabs.previousCaravan")}
            </Button>
          ) : null}
          {maleNeed === 0 && males === 0 ? null : (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
              <Mars className="size-3" aria-hidden />
              {n(males)} {t("reservations.male")}
            </span>
          )}
          {females === 0 && femaleNeed === 0 ? null : (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-semibold text-mint-600">
              <Venus className="size-3" aria-hidden />
              {n(females)} {t("reservations.female")}
            </span>
          )}
        </div>
      </div>
      <ReservationMembersGrid
        members={members}
        inputId="companions-member-search"
        showContact
        showServiceRequests={showServiceRequests}
        bareSearch
        isCaravan={isCaravan}
        renderActions={
          canManage
            ? (member) => (
                <div className="flex items-center gap-1">
                  {onEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      icon
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                      onClick={() => onEdit(member)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    icon
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label={t("common.delete")}
                    title={t("common.delete")}
                    onClick={() => remove(member)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              )
            : undefined
        }
      />
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  children,
  className = "mb-2.5",
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`inline-flex items-center gap-2 text-xs font-semibold text-ink-600 ${className}`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {children}
    </h3>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone,
  match,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  match: CountMatch;
}) {
  const { t } = useTranslation();
  const colors = toneClass[tone];
  const complete = match === "ok";
  const wrap = complete
    ? "border-mint-400 bg-mint-50"
    : "border-red-300 bg-red-50";

  return (
    <article
      className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 ${wrap}`}
      aria-label={`${label}: ${value}، ${
        complete
          ? t("reservations.companionsCountComplete")
          : t("reservations.companionsCountIncomplete")
      }`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
          complete
            ? colors.icon
            : "bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.24)]"
        }`}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-start">
        <p className="text-[11px] font-medium leading-none text-ink-500">{label}</p>
        <p className="mt-0.5 text-sm font-bold leading-tight text-ink-900">{value}</p>
      </div>
      {complete ? (
        <Check className="size-4 shrink-0 text-mint-600" strokeWidth={3} aria-hidden />
      ) : (
        <AlertCircle className="size-4 shrink-0 text-red-500" aria-hidden />
      )}
    </article>
  );
}
