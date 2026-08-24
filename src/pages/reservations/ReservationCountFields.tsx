import {
  Check,
  Mars,
  Minus,
  Plus,
  UserRound,
  Users,
  Venus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "../../components/ui/Form";
import { formatNumber } from "../../lib/datetime";
import type { ReservationType } from "../../types/app";
import { GROUP_MAX_SIZE } from "./reservation-steps";
import { PreviousApprovedCountsHint } from "./PreviousApprovedCountsHint";

export type CountValues = {
  maleCount: string;
  femaleCount: string;
  requestedMaleCount?: string;
  requestedFemaleCount?: string;
};

export function ReservationCountFields({
  values,
  onChange,
  type,
  locked,
  idPrefix = "",
  dual = false,
  reservationId,
}: {
  values: CountValues;
  onChange: (patch: Partial<CountValues>) => void;
  type: ReservationType;
  locked?: boolean;
  idPrefix?: string;
  /** Admin: edit suggested + approved headcounts separately. */
  dual?: boolean;
  /** When dual, show last approved counts for this applicant. */
  reservationId?: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const male = Number(values.maleCount) || 0;
  const female = Number(values.femaleCount) || 0;
  const individualMale = type === "INDIVIDUAL" && male === 1 && female === 0;
  const individualFemale = type === "INDIVIDUAL" && female === 1 && male === 0;
  const maleId = `${idPrefix}maleCount`;
  const femaleId = `${idPrefix}femaleCount`;

  if (type === "INDIVIDUAL") {
    return (
      <FormField icon={UserRound} label={t("reservations.selectMyGender")}>
        <div className="relative">
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label={t("reservations.selectMyGender")}
          >
            <GenderChoiceCard
              selected={individualMale}
              disabled={locked}
              icon={Mars}
              label={t("reservations.iAmMale")}
              tone="teal"
              onSelect={() => onChange({ maleCount: "1", femaleCount: "0" })}
            />
            <GenderChoiceCard
              selected={individualFemale}
              disabled={locked}
              icon={Venus}
              label={t("reservations.iAmFemale")}
              tone="mint"
              onSelect={() => onChange({ maleCount: "0", femaleCount: "1" })}
            />
          </div>
          {!locked ? (
            <RequiredHidden
              value={individualMale || individualFemale ? "1" : ""}
            />
          ) : null}
        </div>
      </FormField>
    );
  }

  if (dual) {
    const requestedMale = Number(values.requestedMaleCount) || 0;
    const requestedFemale = Number(values.requestedFemaleCount) || 0;
    const maxTotal = type === "GROUP" ? GROUP_MAX_SIZE : undefined;
    return (
      <div className="space-y-4">
        <CountPairSection
          title={t("reservations.requestedCounts")}
          maleId={`${idPrefix}requestedMaleCount`}
          femaleId={`${idPrefix}requestedFemaleCount`}
          maleValue={values.requestedMaleCount ?? "0"}
          femaleValue={values.requestedFemaleCount ?? "0"}
          male={requestedMale}
          female={requestedFemale}
          maxTotal={maxTotal}
          locked={locked}
          locale={locale}
          onMaleChange={(requestedMaleCount) =>
            onChange({ requestedMaleCount })
          }
          onFemaleChange={(requestedFemaleCount) =>
            onChange({ requestedFemaleCount })
          }
        />
        <CountPairSection
          title={t("reservations.approvedCounts")}
          maleId={`${idPrefix}maleCount`}
          femaleId={`${idPrefix}femaleCount`}
          maleValue={values.maleCount}
          femaleValue={values.femaleCount}
          male={male}
          female={female}
          maxTotal={maxTotal}
          locked={locked}
          locale={locale}
          onMaleChange={(maleCount) => onChange({ maleCount })}
          onFemaleChange={(femaleCount) => onChange({ femaleCount })}
        />
        {reservationId ? (
          <PreviousApprovedCountsHint reservationId={reservationId} />
        ) : null}
        {type === "GROUP" ? <GroupMaxHint locale={locale} /> : null}
      </div>
    );
  }

  const maxTotal = type === "GROUP" ? GROUP_MAX_SIZE : undefined;
  const maleMax = maxTotal == null ? undefined : Math.max(0, maxTotal - female);
  const femaleMax = maxTotal == null ? undefined : Math.max(0, maxTotal - male);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <CountMetricTile
          id={maleId}
          icon={Mars}
          label={t("reservations.male")}
          value={values.maleCount}
          displayValue={formatNumber(male, locale)}
          unit={t("reservations.people")}
          tone="teal"
          locked={locked}
          min={0}
          max={maleMax}
          increaseLabel={t("reservations.increaseCount")}
          decreaseLabel={t("reservations.decreaseCount")}
          onChange={(maleCount) => onChange({ maleCount })}
        />
        <CountMetricTile
          id={femaleId}
          icon={Venus}
          label={t("reservations.female")}
          value={values.femaleCount}
          displayValue={formatNumber(female, locale)}
          unit={t("reservations.people")}
          tone="mint"
          locked={locked}
          min={0}
          max={femaleMax}
          increaseLabel={t("reservations.increaseCount")}
          decreaseLabel={t("reservations.decreaseCount")}
          onChange={(femaleCount) => onChange({ femaleCount })}
        />
        <CountMetricTile
          icon={Users}
          label={t("reservations.totalCount")}
          displayValue={formatNumber(male + female, locale)}
          unit={t("reservations.people")}
          tone="ink"
          locked
        />
      </div>
      {type === "GROUP" ? <GroupMaxHint locale={locale} /> : null}
    </>
  );
}

function CountPairSection({
  title,
  maleId,
  femaleId,
  maleValue,
  femaleValue,
  male,
  female,
  maxTotal,
  locked,
  locale,
  onMaleChange,
  onFemaleChange,
}: {
  title: string;
  maleId: string;
  femaleId: string;
  maleValue: string;
  femaleValue: string;
  male: number;
  female: number;
  maxTotal?: number;
  locked?: boolean;
  locale: string;
  onMaleChange: (value: string) => void;
  onFemaleChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const maleMax = maxTotal == null ? undefined : Math.max(0, maxTotal - female);
  const femaleMax = maxTotal == null ? undefined : Math.max(0, maxTotal - male);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <CountMetricTile
          id={maleId}
          icon={Mars}
          label={t("reservations.male")}
          value={maleValue}
          displayValue={formatNumber(male, locale)}
          unit={t("reservations.people")}
          tone="teal"
          locked={locked}
          min={0}
          max={maleMax}
          increaseLabel={t("reservations.increaseCount")}
          decreaseLabel={t("reservations.decreaseCount")}
          onChange={onMaleChange}
        />
        <CountMetricTile
          id={femaleId}
          icon={Venus}
          label={t("reservations.female")}
          value={femaleValue}
          displayValue={formatNumber(female, locale)}
          unit={t("reservations.people")}
          tone="mint"
          locked={locked}
          min={0}
          max={femaleMax}
          increaseLabel={t("reservations.increaseCount")}
          decreaseLabel={t("reservations.decreaseCount")}
          onChange={onFemaleChange}
        />
        <CountMetricTile
          icon={Users}
          label={t("reservations.totalCount")}
          displayValue={formatNumber(male + female, locale)}
          unit={t("reservations.people")}
          tone="ink"
          locked
        />
      </div>
    </div>
  );
}

function GroupMaxHint({ locale }: { locale: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-teal-100 bg-gradient-to-l from-mint-50 via-white to-teal-50 px-3 py-2.5 shadow-[0_6px_16px_rgba(20,40,40,0.04)]">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
        <Users className="size-3.5" aria-hidden />
      </span>
      <p className="text-sm font-bold text-ink-800">
        {t("reservations.groupMaxHint", {
          count: formatNumber(GROUP_MAX_SIZE, locale),
        })}
      </p>
    </div>
  );
}

const countToneClass = {
  teal: {
    wrap: "border-teal-100 bg-gradient-to-b from-teal-50 to-white",
    icon: "bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]",
    btn: "bg-teal-500 text-white hover:bg-teal-600 disabled:bg-teal-300",
  },
  mint: {
    wrap: "border-mint-100 bg-gradient-to-b from-mint-50 to-white",
    icon: "bg-mint-500 text-white shadow-[0_8px_16px_rgba(95,191,122,0.24)]",
    btn: "bg-mint-500 text-white hover:bg-mint-600 disabled:bg-mint-300",
  },
  ink: {
    wrap: "border-line bg-gradient-to-b from-cream-50 to-white",
    icon: "bg-ink-700 text-white",
    btn: "",
  },
} as const;

function CountMetricTile({
  id,
  icon: Icon,
  label,
  value,
  displayValue,
  unit,
  tone,
  locked,
  min = 0,
  max,
  increaseLabel,
  decreaseLabel,
  onChange,
}: {
  id?: string;
  icon: typeof Users;
  label: string;
  value?: string;
  displayValue: string;
  unit: string;
  tone: keyof typeof countToneClass;
  locked?: boolean;
  min?: number;
  max?: number;
  increaseLabel?: string;
  decreaseLabel?: string;
  onChange?: (value: string) => void;
}) {
  const colors = countToneClass[tone];
  const editable = Boolean(id && onChange && !locked);
  const current = Number(value) || 0;
  const atMin = current <= min;
  const atMax = max != null && current >= max;

  function clampInput(raw: string) {
    if (raw === "") return raw;
    const next = Number(raw);
    if (!Number.isFinite(next)) return String(min);
    return String(Math.max(min, max == null ? next : Math.min(max, next)));
  }

  function step(delta: number) {
    if (!onChange) return;
    onChange(clampInput(String(current + delta)));
  }

  return (
    <article
      className={`flex h-full flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-center ${colors.wrap}`}
    >
      <span
        className={`flex size-8 items-center justify-center rounded-xl ${colors.icon}`}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      {id ? (
        <label htmlFor={id} className="text-[11px] font-medium text-ink-500">
          {label}
        </label>
      ) : (
        <p className="text-[11px] font-medium text-ink-500">{label}</p>
      )}
      {editable ? (
        <div dir="ltr" className="flex w-full items-center gap-1">
          <button
            type="button"
            data-enter-ignore=""
            aria-label={decreaseLabel}
            disabled={atMin}
            onClick={() => step(-1)}
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition ${colors.btn} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            required
            className="h-7 min-w-0 flex-1 rounded-lg border border-line bg-white px-1 text-center text-sm font-bold leading-none text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={value}
            onChange={(event) => {
              const next = clampInput(event.target.value);
              event.target.value = next;
              onChange?.(next);
            }}
          />
          <button
            type="button"
            data-enter-ignore=""
            aria-label={increaseLabel}
            disabled={atMax}
            onClick={() => step(1)}
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition ${colors.btn} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <p className="text-lg font-bold leading-none text-ink-900">
          {displayValue}
        </p>
      )}
      <p className="mt-auto text-[10px] text-ink-400">{unit}</p>
    </article>
  );
}

function RequiredHidden({ value }: { value: string }) {
  return (
    <input
      tabIndex={-1}
      required
      value={value}
      onChange={() => undefined}
      aria-hidden
      className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
    />
  );
}

function GenderChoiceCard({
  selected,
  disabled,
  icon: Icon,
  label,
  tone,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  icon: typeof Mars;
  label: string;
  tone: "teal" | "mint";
  onSelect: () => void;
}) {
  const idle =
    tone === "teal"
      ? "border-line bg-white hover:border-teal-200"
      : "border-line bg-white hover:border-mint-300";
  const active =
    tone === "teal"
      ? "border-teal-500 bg-teal-50 shadow-[0_8px_18px_rgba(46,189,182,0.2)]"
      : "border-mint-400 bg-mint-50 shadow-[0_8px_18px_rgba(95,191,122,0.18)]";
  const iconWrap =
    tone === "teal" ? "bg-teal-500 text-white" : "bg-mint-500 text-white";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      data-enter-ignore=""
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-start shadow-[0_4px_12px_rgba(20,40,40,0.04)] transition-[box-shadow,transform,border-color,background-color] duration-200 ${
        selected ? active : idle
      } ${
        disabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-teal-400"
      }`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-xs font-semibold text-ink-900">
        {label}
      </span>
      {selected ? (
        <Check
          className={`size-3.5 shrink-0 ${tone === "teal" ? "text-teal-700" : "text-mint-600"}`}
          aria-hidden
        />
      ) : null}
    </button>
  );
}
