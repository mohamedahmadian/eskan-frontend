import {
  BadgeCheck,
  Ban,
  Clock3,
  Footprints,
  LoaderCircle,
  MapPin,
  Mars,
  ScrollText,
  Shield,
  UserRound,
  UserRoundCog,
  Users,
  Venus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cardClassName } from "../../components/ui/Form";
import { formatNumber } from "../../lib/datetime";
import {
  reservationStatuses,
  reservationTypes,
  type ReceptionCapacitySlice,
  type ReceptionDashboard,
  type ReservationStatus,
  type ReservationType,
} from "../../types/app";
import {
  CAPACITY_WARNING_RATIO,
  capacityKey,
  inProgressFilter,
  inProgressStatuses,
} from "./reservation-steps";

const typeOrder: ReservationType[] = [
  reservationTypes.INDIVIDUAL,
  reservationTypes.GROUP,
  reservationTypes.CARAVAN,
];

const typeVisual: Record<
  ReservationType,
  { icon: LucideIcon; tone: string; accent: string }
> = {
  INDIVIDUAL: {
    icon: UserRound,
    tone: "bg-teal-50 text-teal-700",
    accent: "border-s-teal-400",
  },
  GROUP: {
    icon: Users,
    tone: "bg-mint-50 text-mint-600",
    accent: "border-s-mint-400",
  },
  CARAVAN: {
    icon: Footprints,
    tone: "bg-gold-50 text-gold-600",
    accent: "border-s-gold-400",
  },
};

export function ReservationDashboardStats({
  data,
  status,
  onStatusFilter,
  compact = false,
  highlightActive = true,
  showExtras = false,
}: {
  data: ReceptionDashboard;
  status: string;
  onStatusFilter: (next?: string) => void;
  compact?: boolean;
  highlightActive?: boolean;
  showExtras?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const yearLabel = n(data.year);
  const totals: Array<{
    key: string;
    value: number;
    filter: string;
    icon: LucideIcon;
    tone: string;
    accent: string;
    wash: string;
  }> = [
    {
      key: "dashboardAll",
      value: data.totals.all,
      filter: "",
      icon: ScrollText,
      tone: "bg-teal-50 text-teal-700",
      accent: "border-s-teal-400",
      wash: "from-teal-50/90 to-white",
    },
    {
      key: "dashboardRejected",
      value: data.totals.rejected,
      filter: reservationStatuses.REJECTED,
      icon: XCircle,
      tone: "bg-red-50 text-red-600",
      accent: "border-s-red-400",
      wash: "from-red-50/80 to-white",
    },
    {
      key: "dashboardCancelled",
      value: data.totals.cancelled,
      filter: reservationStatuses.CANCELLED,
      icon: Ban,
      tone: "bg-cream-100 text-ink-500",
      accent: "border-s-ink-300",
      wash: "from-cream-50 to-white",
    },
    {
      key: "dashboardPending",
      value: data.totals.pendingReview,
      filter: reservationStatuses.PENDING_MANAGEMENT_REVIEW,
      icon: Clock3,
      tone: "bg-gold-50 text-gold-600",
      accent: "border-s-gold-400",
      wash: "from-gold-50/80 to-white",
    },
    {
      key: "dashboardInProgress",
      value: data.totals.inProgress,
      filter: inProgressFilter,
      icon: LoaderCircle,
      tone: "bg-amber-50 text-amber-700",
      accent: "border-s-amber-400",
      wash: "from-amber-50/80 to-white",
    },
    {
      key: "dashboardCompleted",
      value: data.totals.completed,
      filter: reservationStatuses.COMPLETED,
      icon: BadgeCheck,
      tone: "bg-mint-50 text-mint-600",
      accent: "border-s-mint-400",
      wash: "from-mint-50/90 to-white",
    },
  ];
  const inProgressActive =
    status === inProgressFilter ||
    inProgressStatuses.includes(status as ReservationStatus);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      <p
        className={
          compact
            ? "text-xs font-medium text-ink-700"
            : "text-sm font-medium text-ink-700"
        }
      >
        {t("reservations.statsForYear", { year: yearLabel })}
      </p>
      <div className={`grid sm:grid-cols-3 ${compact ? "gap-1.5" : "gap-2.5"}`}>
        {totals.map((item) => {
          const Icon = item.icon;
          const active =
            highlightActive &&
            (item.filter
              ? status === item.filter ||
                (item.key === "dashboardInProgress" && inProgressActive)
              : !status);
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusFilter(item.filter || undefined)}
              className={`${cardClassName} flex items-center border-s-4 bg-gradient-to-b text-start transition hover:-translate-y-0.5 ${item.accent} ${item.wash} ${
                compact
                  ? "min-h-[2.625rem] gap-2 px-3 py-2"
                  : "min-h-[5.25rem] gap-3 px-4 py-4"
              } ${
                active
                  ? "ring-2 ring-teal-400 shadow-[0_10px_28px_rgba(46,189,182,0.16)]"
                  : ""
              }`}
            >
              <span
                className={`flex shrink-0 items-center justify-center ${item.tone} ${
                  compact ? "size-7 rounded-xl" : "size-12 rounded-2xl"
                }`}
              >
                <Icon
                  className={compact ? "size-3.5" : "size-5"}
                  aria-hidden
                />
              </span>
              <span className="min-w-0">
                <span
                  className={`block truncate font-medium text-ink-600 ${
                    compact ? "text-[11px]" : "text-sm"
                  }`}
                >
                  {t(`reservations.${item.key}`)}
                </span>
                <span
                  className={`mt-0.5 block font-semibold leading-none text-ink-900 ${
                    compact ? "text-lg" : "text-2xl"
                  }`}
                >
                  {n(item.value)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {showExtras ? (
        <>
          <ProgressPipeline
            data={data}
            status={status}
            locale={locale}
            highlightActive={highlightActive}
            onStatusFilter={onStatusFilter}
          />
          <div className="grid gap-2.5 lg:grid-cols-3">
            {typeOrder.map((type) => (
              <TypeCapacityCard
                key={type}
                type={type}
                yearLabel={yearLabel}
                stats={data.types[capacityKey(type)]}
                slice={data.capacity[capacityKey(type)]}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ProgressPipeline({
  data,
  status,
  locale,
  highlightActive,
  onStatusFilter,
}: {
  data: ReceptionDashboard;
  status: string;
  locale: string;
  highlightActive: boolean;
  onStatusFilter: (next?: string) => void;
}) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, locale);
  const steps: Array<{
    status: ReservationStatus;
    icon: LucideIcon;
    step: "travel" | "companions" | "contacts" | "insurance";
    count: number;
    tone: string;
  }> = [
    {
      status: reservationStatuses.DRAFT,
      icon: MapPin,
      step: "travel",
      count: data.progress?.draft ?? 0,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      status: reservationStatuses.COMPANIONS,
      icon: Users,
      step: "companions",
      count: data.progress?.companions ?? 0,
      tone: "bg-mint-50 text-mint-600",
    },
    {
      status: reservationStatuses.CARAVAN_CONTACTS,
      icon: UserRoundCog,
      step: "contacts",
      count: data.progress?.contacts ?? 0,
      tone: "bg-gold-50 text-gold-600",
    },
    {
      status: reservationStatuses.INSURANCE,
      icon: Shield,
      step: "insurance",
      count: data.progress?.insurance ?? 0,
      tone: "bg-teal-50 text-teal-700",
    },
  ];

  return (
    <section className={`${cardClassName} px-3 py-2`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="shrink-0 text-xs font-medium text-ink-700">
          {t("reservations.inProgressPipeline")}
        </p>
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon;
            const active = highlightActive && status === item.status;
            return (
              <button
                key={item.status}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusFilter(item.status)}
                className={`flex items-center gap-2 rounded-xl px-2 py-1 text-start transition hover:bg-cream-50 ${item.tone} ${
                  active ? "ring-2 ring-teal-400" : ""
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/80">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-ink-700">
                    {t(`reservations.steps.${item.step}`)}
                  </span>
                  <span className="text-lg font-semibold leading-none text-ink-900">
                    {n(item.count)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TypeCapacityCard({
  type,
  yearLabel,
  stats,
  slice,
}: {
  type: ReservationType;
  yearLabel: string;
  stats: ReceptionDashboard["types"]["individual"];
  slice: ReceptionCapacitySlice;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const visual = typeVisual[type];
  const TypeIcon = visual.icon;
  const genders = [
    {
      key: "male",
      icon: Mars,
      label: t("reservations.male"),
      used: slice.maleUsed,
      capacity: slice.maleCapacity,
      remain: slice.maleRemaining,
      tile: "bg-gold-50 text-gold-600",
      bar: "bg-gold-400",
    },
    {
      key: "female",
      icon: Venus,
      label: t("reservations.female"),
      used: slice.femaleUsed,
      capacity: slice.femaleCapacity,
      remain: slice.femaleRemaining,
      tile: "bg-teal-50 text-teal-700",
      bar: "bg-teal-400",
    },
  ] as const;

  return (
    <article
      className={`${cardClassName} space-y-2 border-s-4 p-3 ${visual.accent}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${visual.tone}`}
        >
          <TypeIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900">
            {t(`reservations.types.${type}`)} · {yearLabel}
          </p>
          <p className="text-[11px] text-ink-500">
            {n(stats.reservations)} {t("reservations.reservationCount")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {genders.map(({ key, ...item }) => (
          <GenderCapacityTile key={key} {...item} locale={locale} />
        ))}
      </div>
    </article>
  );
}

function GenderCapacityTile({
  icon: Icon,
  label,
  used,
  capacity,
  remain,
  tile,
  bar,
  locale,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  capacity: number;
  remain: number;
  tile: string;
  bar: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, locale);
  const ratio = capacity > 0 ? used / capacity : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const warning = ratio >= CAPACITY_WARNING_RATIO;

  return (
    <div
      className={`rounded-xl px-2.5 py-2 ${tile} ${warning ? "ring-1 ring-amber-300" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/80">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="text-[11px] font-medium">{label}</span>
        <span className="ms-auto text-lg font-semibold leading-none text-ink-900">
          {n(used)}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-ink-500">
        {t("reservations.ofCapacity", { capacity: n(capacity) })} ·{" "}
        {t("reservations.capacityRemain")} {n(remain)}
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/70">
        <div
          className={`h-full rounded-full ${warning ? "bg-amber-500" : bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {warning ? (
        <p className="mt-1 text-[10px] font-medium text-amber-800">
          {t("reservations.capacityLow")}
        </p>
      ) : null}
    </div>
  );
}
