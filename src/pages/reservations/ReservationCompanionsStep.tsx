import {
  AlertCircle,
  Calendar,
  Check,
  FileSpreadsheet,
  History,
  IdCard,
  Mars,
  Pencil,
  Phone,
  Search,
  SearchX,
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
  type FormEvent,
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
import { PersianDateField } from "../../components/ui/PersianDateField";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { api, getApiErrorMessage } from "../../lib/api";
import { formatNumber, localizeDigits } from "../../lib/datetime";
import {
  isValidIranianNationalId,
  normalizeNationalId,
} from "../../lib/national-id";
import type {
  Reservation,
  ReservationMember,
  ReservationPerson,
} from "../../types/app";
import { neighborFlowStep, type ReservationStepCode } from "./reservation-steps";
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

type CompanionTab = "manual" | "excel" | "previousCaravan";
type Tone = "teal" | "mint" | "ink";
type CountMatch = "ok" | "mismatch";

function countMatch(have: number, need: number): CountMatch {
  return have === need ? "ok" : "mismatch";
}

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: "border-teal-100 bg-gradient-to-b from-teal-50 to-white",
    icon: "bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]",
  },
  mint: {
    wrap: "border-mint-100 bg-gradient-to-b from-mint-50 to-white",
    icon: "bg-mint-500 text-white shadow-[0_8px_16px_rgba(95,191,122,0.24)]",
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
  const nextStep = neighborFlowStep(reservation.type, "companions", 1);
  const [tab, setTab] = useState<CompanionTab>("manual");
  const [editingMember, setEditingMember] = useState<ReservationMember | null>(
    null,
  );
  const [showCountIssue, setShowCountIssue] = useState(false);
  const [countIssueTick, setCountIssueTick] = useState(0);
  const countIssueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countsOk) setShowCountIssue(false);
  }, [countsOk]);

  useEffect(() => {
    if (!showCountIssue) return;
    countIssueRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [showCountIssue, countIssueTick]);

  function revealCountIssue() {
    setShowCountIssue(true);
    setCountIssueTick((tick) => tick + 1);
  }

  const complete = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Reservation>(
        `/reservations/${reservation.id}/companions/complete`,
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(t("reservations.companionsCompleted"));
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
      countAlert={
        showCountIssue ? (
          <div ref={countIssueRef}>
            <CompanionsCountIssue
              males={males}
              females={females}
              totalHave={members.length}
              maleNeed={reservation.maleCount}
              femaleNeed={reservation.femaleCount}
              totalNeed={reservation.totalCount}
            />
          </div>
        ) : null
      }
      footer={
        showNav && nextStep ? (
          <ReservationStepNav
            nextPending={complete.isPending}
            onNext={() => {
              if (!countsOk) {
                revealCountIssue();
                return;
              }
              complete.mutate();
            }}
          />
        ) : null
      }
    >
      <CompanionTabNav tab={tab} isCaravan={isCaravan} onChange={setTab} />
      <div className={tab === "manual" ? "" : "hidden"}>
        <MemberLookupForm
          reservationId={reservation.id}
          editing={editingMember}
          onAdded={() => {
            setEditingMember(null);
            onChanged();
          }}
          onCancelEdit={() => setEditingMember(null)}
        />
      </div>
      <div className={tab === "excel" ? "" : "hidden"}>
        <CompanionExcelImport
          reservationId={reservation.id}
          onImported={onChanged}
        />
      </div>
      {isCaravan ? (
        <div className={tab === "previousCaravan" ? "" : "hidden"}>
          <PreviousMembersPanel
            reservation={reservation}
            onImported={onChanged}
          />
        </div>
      ) : null}
      <MembersList
        reservationId={reservation.id}
        members={members}
        onChanged={onChanged}
        onEdit={(member) => {
          setTab("manual");
          setEditingMember(member);
        }}
      />
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
      <MembersList members={members} />
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
  countAlert,
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
  countAlert?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, locale);

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <ReservationSectionHeader
        icon={Users}
        title={t("reservations.steps.companions")}
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
          <SectionTitle icon={Users}>
            {t("reservations.createSteps.count")}
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MetricTile
              icon={Mars}
              label={t("reservations.male")}
              value={t("reservations.countProgress", {
                have: n(males),
                need: n(reservation.maleCount),
              })}
              unit={t("reservations.people")}
              tone="teal"
              match={countMatch(males, reservation.maleCount)}
            />
            <MetricTile
              icon={Venus}
              label={t("reservations.female")}
              value={t("reservations.countProgress", {
                have: n(females),
                need: n(reservation.femaleCount),
              })}
              unit={t("reservations.people")}
              tone="mint"
              match={countMatch(females, reservation.femaleCount)}
            />
            <MetricTile
              icon={Users}
              label={t("reservations.registeredShort")}
              value={t("reservations.countProgress", {
                have: n(members.length),
                need: n(reservation.totalCount),
              })}
              unit={t("reservations.people")}
              tone="ink"
              match={countMatch(members.length, reservation.totalCount)}
            />
          </div>
          {countAlert}
        </section>
        {children}
      </div>
      {footer}
    </section>
  );
}

function CompanionTabNav({
  tab,
  isCaravan,
  onChange,
}: {
  tab: CompanionTab;
  isCaravan: boolean;
  onChange: (tab: CompanionTab) => void;
}) {
  const { t } = useTranslation();
  const tabs: { id: CompanionTab; icon: LucideIcon }[] = [
    { id: "manual", icon: UserPlus },
    { id: "excel", icon: FileSpreadsheet },
    ...(isCaravan ? [{ id: "previousCaravan" as const, icon: History }] : []),
  ];

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border border-teal-100 bg-gradient-to-l from-mint-50 via-white to-teal-50 p-1.5"
      role="tablist"
      aria-label={t("reservations.steps.companions")}
    >
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]"
                : "bg-white/80 text-ink-700 hover:bg-white"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {t(`reservations.companionTabs.${item.id}`)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function CompanionFormModal({
  title,
  icon: Icon,
  busy,
  onClose,
  children,
}: {
  title: string;
  icon: LucideIcon;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
        className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[22px] sm:max-w-3xl sm:rounded-[22px] ${cardClassName}`}
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
  onAdded,
  editing,
  onCancelEdit,
}: {
  reservationId: string;
  onAdded: () => void;
  editing?: ReservationMember | null;
  onCancelEdit?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const lookupRef = useRef<HTMLInputElement>(null);
  const nationalRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [lookupNationalId, setLookupNationalId] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [status, setStatus] = useState<"idle" | "found" | "new" | "edit">(
    "idle",
  );
  const [looking, setLooking] = useState(false);
  const [missingNationalId, setMissingNationalId] = useState<string | null>(null);
  const [person, setPerson] = useState<Partial<ReservationPerson>>({});
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const showForm = status === "found" || status === "new" || status === "edit";
  const editingFields = status === "new" || status === "edit";

  function resetForm() {
    setLookupNationalId("");
    setNationalId("");
    setPerson({});
    setGender("");
    setBirthDate("");
    setMissingNationalId(null);
    setStatus("idle");
  }

  useEffect(() => {
    if (!editing) return;
    setLookupNationalId("");
    setNationalId(editing.user.nationalId ?? "");
    setPerson({
      firstName: editing.user.firstName,
      lastName: editing.user.lastName,
      phone: editing.user.phone ?? "",
      fullName: editing.user.fullName,
    });
    setGender(editing.user.gender ?? "MALE");
    setBirthDate(editing.user.birthDate ?? "");
    setMissingNationalId(null);
    setStatus("edit");
    requestAnimationFrame(() => {
      if (editing.user.nationalId) firstNameRef.current?.focus();
      else nationalRef.current?.focus();
    });
  }, [editing]);

  useEffect(() => {
    if (status === "idle") {
      lookupRef.current?.focus();
      return;
    }
    if (!editingFields) return;
    if (nationalRef.current?.value.trim()) {
      firstNameRef.current?.focus();
      return;
    }
    nationalRef.current?.focus();
  }, [status, editingFields]);

  async function lookup(event?: FormEvent) {
    event?.preventDefault();
    const id = normalizeNationalId(lookupNationalId);
    if (!isValidIranianNationalId(id)) {
      toast.error(t("users.nationalIdInvalid"));
      return;
    }
    setLooking(true);
    try {
      const { data } = await api.post<LookupResponse>(
        "/pilgrims/identity-lookup",
        {
          nationalId: id,
        },
      );
      if (data.found) {
        setMissingNationalId(null);
        setNationalId(id);
        setPerson(data.user);
        setGender(data.user.gender ?? "");
        setBirthDate(data.user.birthDate ?? "");
        setStatus("found");
        return;
      }
      setPerson({});
      setGender("MALE");
      setBirthDate("");
      setNationalId(id);
      setMissingNationalId(id);
      setStatus("new");
    } catch (error) {
      if (status !== "new") {
        setStatus("idle");
        setMissingNationalId(null);
      }
      toast.error(getApiErrorMessage(error, t("common.error")));
    } finally {
      setLooking(false);
    }
  }

  function openNewMember() {
    setMissingNationalId(null);
    setPerson({});
    setGender("MALE");
    setBirthDate("");
    setNationalId("");
    setStatus("new");
  }

  const save = useMutation({
    mutationFn: async () => {
      const id = normalizeNationalId(nationalId);
      if (!isValidIranianNationalId(id)) {
        throw new Error(t("users.nationalIdInvalid"));
      }
      const payload = {
        nationalId: id,
        firstName: person.firstName,
        lastName: person.lastName,
        gender: editing
          ? gender === "FEMALE"
            ? "FEMALE"
            : "MALE"
          : gender || undefined,
        phone: person.phone || null,
        birthDate: birthDate || null,
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
          ? t("reservations.memberUpdated")
          : t("reservations.memberAdded"),
      );
      resetForm();
      onAdded();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === t("users.nationalIdInvalid")
          ? error.message
          : getApiErrorMessage(error, t("common.error")),
      ),
  });

  function closeForm() {
    if (save.isPending) return;
    resetForm();
    onCancelEdit?.();
  }

  const formTitle =
    status === "found"
      ? t("reservations.found", {
          name:
            person.fullName?.trim() ||
            `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim(),
        })
      : t(
          status === "edit"
            ? "reservations.editMemberTitle"
            : "reservations.newPilgrimTitle",
        );
  const FormIcon =
    status === "edit" ? Pencil : status === "found" ? UserRound : UserPlus;

  return (
    <>
      <article className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white p-4 shadow-[0_8px_20px_rgba(20,40,40,0.05)]">
        <SectionTitle icon={UserPlus} className="mb-3">
          {t("reservations.manualAdd")}
        </SectionTitle>
        <AppForm
          autoFocusFirst={false}
          onSubmit={(event) => {
            event.preventDefault();
            void lookup();
          }}
        >
          <FormField
            icon={IdCard}
            label={t("users.nationalId")}
            htmlFor="companion-nid"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="companion-nid"
                ref={lookupRef}
                className={`min-w-0 flex-1 ${fieldClassName}`}
                value={lookupNationalId}
                onChange={(event) => setLookupNationalId(event.target.value)}
                inputMode="numeric"
              />
              <div className="flex shrink-0 gap-2">
                <Button
                  type="submit"
                  className="flex-1 sm:flex-none"
                  disabled={looking || showForm}
                >
                  <Search className="size-4" aria-hidden />
                  {looking ? t("reservations.looking") : t("reservations.lookup")}
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  className="flex-1 sm:flex-none"
                  disabled={looking || showForm}
                  data-enter-ignore
                  onClick={openNewMember}
                >
                  <UserPlus className="size-4" aria-hidden />
                  {t("reservations.newMember")}
                </Button>
              </div>
            </div>
          </FormField>
        </AppForm>
      </article>
      {showForm ? (
        <CompanionFormModal
          title={formTitle}
          icon={FormIcon}
          busy={save.isPending}
          onClose={closeForm}
        >
          <AppForm
            autoFocusFirst={false}
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            {status === "new" && missingNationalId ? (
              <NationalIdNotFoundNotice
                nationalId={missingNationalId}
                locale={locale}
              />
            ) : null}
            {editingFields ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  icon={IdCard}
                  label={t("users.nationalId")}
                  htmlFor="companion-nid-new"
                >
                  <input
                    id="companion-nid-new"
                    ref={nationalRef}
                    className={fieldClassName}
                    value={nationalId}
                    onChange={(event) => setNationalId(event.target.value)}
                    inputMode="numeric"
                    required
                  />
                </FormField>
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
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
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
                    required={editingFields}
                    disabled={status === "found"}
                  />
                </FormField>
                <FormField
                  icon={UserRound}
                  label={t("users.lastName")}
                  htmlFor="c-last"
                >
                  <input
                    id="c-last"
                    className={fieldClassName}
                    value={person.lastName ?? ""}
                    onChange={(event) =>
                      setPerson((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    required={editingFields}
                    disabled={status === "found"}
                  />
                </FormField>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField icon={Phone} label={t("users.phone")} htmlFor="c-phone">
                <input
                  id="c-phone"
                  className={fieldClassName}
                  value={person.phone ?? ""}
                  onChange={(event) =>
                    setPerson((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField icon={Users} label={t("users.gender")}>
                {editingFields ? (
                  <ToggleField
                    checked={gender !== "FEMALE"}
                    onChange={(male) => setGender(male ? "MALE" : "FEMALE")}
                    onLabel={t("userGenders.MALE")}
                    offLabel={t("userGenders.FEMALE")}
                  />
                ) : (
                  <SearchSelect
                    value={gender}
                    onChange={setGender}
                    placeholder={t("users.selectOptional")}
                    options={[
                      { value: "MALE", label: t("userGenders.MALE") },
                      { value: "FEMALE", label: t("userGenders.FEMALE") },
                    ]}
                    disabled={Boolean(gender)}
                  />
                )}
              </FormField>
              <FormField icon={Calendar} label={t("users.birthDate")}>
                <PersianDateField
                  value={birthDate}
                  onChange={(value) => setBirthDate(value ?? "")}
                />
              </FormField>
            </div>
            <FormActions
              submitLabel={
                status === "edit"
                  ? t("reservations.saveMember")
                  : t("reservations.addMember")
              }
              cancelLabel={t("common.cancel")}
              submitting={save.isPending}
              onCancel={closeForm}
            />
          </AppForm>
        </CompanionFormModal>
      ) : null}
    </>
  );
}

function NationalIdNotFoundNotice({
  nationalId,
  locale,
}: {
  nationalId: string;
  locale: string;
}) {
  const { t } = useTranslation();
  return (
    <aside
      className="relative overflow-hidden rounded-[22px] border border-gold-100 bg-gradient-to-b from-gold-50 via-white to-cream-50 p-4 shadow-[0_12px_28px_rgba(232,184,58,0.14)]"
      role="status"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold-400 via-gold-500 to-teal-400"
        aria-hidden
      />
      <div className="flex items-start gap-3 pt-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
          <SearchX className="size-5" aria-hidden />
        </span>
        <p className="pt-2 text-sm font-semibold leading-7 text-ink-900">
          {t("reservations.nationalIdNotFoundBefore")}
          <span
            dir="ltr"
            className="mx-1.5 inline-flex items-center rounded-lg bg-white px-2 py-0.5 font-bold tracking-wide text-ink-900 shadow-sm ring-1 ring-gold-100"
          >
            {localizeDigits(nationalId, locale)}
          </span>
          {t("reservations.nationalIdNotFoundAfter")}
        </p>
      </div>
    </aside>
  );
}

function MembersList({
  reservationId,
  members,
  onChanged,
  onEdit,
}: {
  reservationId?: string;
  members: ReservationMember[];
  onChanged?: () => void;
  onEdit?: (member: ReservationMember) => void;
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
      title: t("reservations.confirmRemoveMember"),
      confirmLabel: t("common.yesDelete"),
      cancelLabel: t("common.cancel"),
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(
            `/reservations/${reservationId}/members/${member.id}`,
          );
          toast.success(t("reservations.memberRemoved"));
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
          {t("reservations.membersListTitle")}
        </SectionTitle>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
            <Mars className="size-3" aria-hidden />
            {n(males)} {t("reservations.male")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-semibold text-mint-600">
            <Venus className="size-3" aria-hidden />
            {n(females)} {t("reservations.female")}
          </span>
        </div>
      </div>
      <ReservationMembersGrid
        members={members}
        inputId="companions-member-search"
        showContact
        bareSearch
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
  unit,
  tone,
  match,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  tone: Tone;
  match: CountMatch;
}) {
  const { t } = useTranslation();
  const colors = toneClass[tone];
  const complete = match === "ok";
  const wrap = complete
    ? "border-2 border-mint-500 bg-gradient-to-b from-mint-50 to-white shadow-[0_8px_18px_rgba(95,191,122,0.18)]"
    : "border-2 border-red-400 bg-gradient-to-b from-red-50 to-white shadow-[0_8px_18px_rgba(239,68,68,0.14)]";

  return (
    <article
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 pt-4 text-center ${wrap}`}
      aria-label={`${label}: ${value}، ${
        complete
          ? t("reservations.companionsCountComplete")
          : t("reservations.companionsCountIncomplete")
      }`}
    >
      {complete ? (
        <span className="absolute top-1.5 end-1.5 flex size-6 items-center justify-center rounded-full bg-mint-500 text-white shadow-sm">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${
          complete
            ? colors.icon
            : "bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.24)]"
        }`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
      <p className="text-[10px] text-ink-400">{unit}</p>
    </article>
  );
}

function CompanionsCountIssue({
  males,
  females,
  totalHave,
  maleNeed,
  femaleNeed,
  totalNeed,
}: {
  males: number;
  females: number;
  totalHave: number;
  maleNeed: number;
  femaleNeed: number;
  totalNeed: number;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const maleOk = males === maleNeed;
  const femaleOk = females === femaleNeed;
  const totalOk = totalHave === totalNeed;
  const lines: string[] = [];

  if (!totalOk && maleOk && femaleOk) {
    lines.push(
      t("reservations.companionsCountIssueTotal", {
        need: n(totalNeed),
        have: n(totalHave),
      }),
    );
  } else if (!maleOk && !femaleOk && !totalOk) {
    lines.push(
      t("reservations.companionsCountIssueTotal", {
        need: n(totalNeed),
        have: n(totalHave),
      }),
    );
  } else {
    if (!maleOk) {
      lines.push(
        t("reservations.companionsCountIssueMale", {
          need: n(maleNeed),
          have: n(males),
        }),
      );
    }
    if (!femaleOk) {
      lines.push(
        t("reservations.companionsCountIssueFemale", {
          need: n(femaleNeed),
          have: n(females),
        }),
      );
    }
  }

  return (
    <aside
      className="relative mt-3 overflow-hidden rounded-[22px] border-2 border-red-200 bg-gradient-to-b from-red-50 via-white to-white p-4 shadow-[0_12px_28px_rgba(185,28,28,0.14)]"
      role="alert"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-red-400 via-red-500 to-red-400"
        aria-hidden
      />
      <div className="flex items-start gap-3 pt-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white shadow-[0_8px_16px_rgba(185,28,28,0.28)]">
          <AlertCircle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1 pt-1">
          <p className="text-sm font-bold text-red-800">
            {t("reservations.companionsCountIssueTitle")}
          </p>
          {lines.map((line) => (
            <p key={line} className="text-sm leading-7 text-ink-800">
              {line}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
}
