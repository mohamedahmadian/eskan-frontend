import {
  ArrowRightLeft,
  Building2,
  Check,
  Hourglass,
  Info,
  LayoutGrid,
  MapPin,
  MapPinned,
  Mars,
  Navigation,
  Phone,
  Route,
  Share2,
  Smartphone,
  UserRoundCog,
  Venus,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { OsmMapPicker } from "../../components/ui/OsmMapPicker";
import { Button, cardClassName } from "../../components/ui/Form";
import { CopyableDigits } from "../../components/ui/CopyableDigits";
import { hasMenuAccess } from "../../routes/RequireMenuAccess";
import {
  FormCard,
  FormCardHeaderDecor,
  FormFactTile,
  formCardBodyClassName,
} from "../../components/ui/FormLayout";
import { formatNumber } from "../../lib/datetime";
import type {
  Reservation,
  ReservationAllocationSummary,
  ReservationStayAccommodation,
  UserGender,
} from "../../types/app";
import { showMashhadPlacement, showRoutePlacement, workingHeadcount } from "./reservation-steps";
import { ReservationRoutePlacementPanel } from "./ReservationRoutePlacementPanel";
import { PlacementStatusBadge } from "./ReservationStatusBadge";

type StayTone = "teal" | "mint";

const genderTone: Record<UserGender, StayTone> = {
  MALE: "teal",
  FEMALE: "mint",
};

function stayManager(
  accommodation: ReservationStayAccommodation | undefined,
  year: number,
) {
  const managers = accommodation?.managers ?? [];
  if (!managers.length) return null;
  const ranked = [...managers].sort((a, b) => {
    if (a.year === year && b.year !== year) return -1;
    if (b.year === year && a.year !== year) return 1;
    return Number(b.isPrimary) - Number(a.isPrimary);
  });
  const user = ranked[0]?.user;
  const name = user?.fullName?.trim() || null;
  const phone = user?.phone?.trim() || null;
  if (!name && !phone) return null;
  return { name, phone };
}

function asHref(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function TextOrLink({ value }: { value: string | null | undefined }) {
  const text = value?.trim() || "";
  if (!text) return null;
  const href = asHref(text);
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        dir="ltr"
        className="break-all text-teal-800 underline-offset-4 hover:underline"
      >
        {text}
      </a>
    );
  }
  return <span className="break-words">{text}</span>;
}

export function ReservationPlacementPanel({
  reservation,
  footer,
}: {
  reservation: Reservation;
  footer?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const counts = workingHeadcount(reservation);
  const individual = reservation.type === "INDIVIDUAL";
  const allocations = reservation.allocations ?? [];
  const status = reservation.placementStatus;
  const placed = status === "PLACED";
  const partial = status === "PARTIAL";
  const manageTo = hasMenuAccess("/placements", user?.modules ?? [])
    ? `/placements/${reservation.id}`
    : null;

  const maleAllocations = allocations.filter((item) => item.gender === "MALE");
  const femaleAllocations = allocations.filter(
    (item) => item.gender === "FEMALE",
  );
  const individualGender: UserGender = counts.male >= 1 ? "MALE" : "FEMALE";
  const individualAllocation =
    allocations.find((item) => item.gender === individualGender) ??
    allocations[0] ??
    null;

  const statusLabel = placed
    ? t("placements.statuses.PLACED")
    : partial
      ? t("placements.statuses.PARTIAL")
      : t("reservations.placementUnassigned");
  const hint = partial
    ? t("reservations.completedBodyPartial")
    : t("reservations.placementPendingHint");

  return (
    <FormCard
      icon={LayoutGrid}
      title={t("reservations.placementPanelTitle")}
      chips={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ${
            placed
              ? "text-teal-800 ring-teal-100"
              : partial
                ? "text-mint-800 ring-mint-100"
                : "text-ink-700 ring-line"
          }`}
        >
          {placed ? (
            <Check className="size-3 shrink-0 text-teal-600" aria-hidden />
          ) : (
            <Hourglass className="size-3 shrink-0 text-teal-600" aria-hidden />
          )}
          <span>{t("reservations.placementStatusLabel")}</span>
          <span>{statusLabel}</span>
        </span>
      }
    >
      <div className={formCardBodyClassName}>
        {placed ? null : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                <span>{t("reservations.placementStatusLabel")}</span>
                <PlacementStatusBadge status={status} />
              </p>
              {manageTo ? (
                <Link to={manageTo} className="ms-auto shrink-0">
                  <Button type="button">
                    <Building2 className="size-4" aria-hidden />
                    {t("placements.allocateManual")}
                  </Button>
                </Link>
              ) : null}
            </div>
            <div
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_8px_20px_rgba(20,40,40,0.05)] ${
                partial
                  ? "border-mint-100 bg-gradient-to-e from-mint-50 via-white to-teal-50/40"
                  : "border-teal-100 bg-gradient-to-e from-teal-50 via-white to-mint-50/40"
              }`}
            >
              <span
                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl text-white ${
                  partial
                    ? "bg-mint-500 shadow-[0_8px_16px_rgba(63,214,190),0.24)]"
                    : "bg-teal-500 shadow-[0_8px_16px_rgba(46,189,182,0.28)]"
                }`}
              >
                <Info className="size-4" aria-hidden />
              </span>
              <p className="pt-1.5 text-sm leading-7 text-ink-700">{hint}</p>
            </div>
          </div>
        )}

        {individual ? (
          <StayCard
            title={t("reservations.placementStayTitle")}
            gender={individualGender}
            needed={1}
            allocation={individualAllocation}
            year={reservation.year}
            locale={locale}
            formatCount={n}
            manageTo={manageTo}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <GenderStayColumn
              gender="MALE"
              title={t("reservations.placementStayMale")}
              needed={counts.male}
              allocations={maleAllocations}
              year={reservation.year}
              locale={locale}
              formatCount={n}
              manageTo={manageTo}
            />
            <GenderStayColumn
              gender="FEMALE"
              title={t("reservations.placementStayFemale")}
              needed={counts.female}
              allocations={femaleAllocations}
              year={reservation.year}
              locale={locale}
              formatCount={n}
              manageTo={manageTo}
            />
          </div>
        )}
      </div>
      {footer ? (
        <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div>
      ) : null}
    </FormCard>
  );
}

function GenderStayColumn({
  gender,
  title,
  needed,
  allocations,
  year,
  locale,
  formatCount,
  manageTo,
}: {
  gender: UserGender;
  title: string;
  needed: number;
  allocations: ReservationAllocationSummary[];
  year: number;
  locale: string;
  formatCount: (value: number) => string;
  manageTo: string | null;
}) {
  const cards = allocations.length ? allocations : [null];
  return (
    <div className="space-y-3">
      {cards.map((allocation, index) => (
        <StayCard
          key={allocation?.id ?? `${gender}-empty`}
          title={title}
          gender={gender}
          needed={needed}
          allocation={allocation}
          year={year}
          locale={locale}
          formatCount={formatCount}
          stackedIndex={allocations.length > 1 ? index + 1 : undefined}
          stackedTotal={allocations.length > 1 ? allocations.length : undefined}
          manageTo={manageTo}
        />
      ))}
    </div>
  );
}

function StayCard({
  title,
  gender,
  needed,
  allocation,
  year,
  locale,
  formatCount,
  stackedIndex,
  stackedTotal,
  manageTo,
}: {
  title: string;
  gender: UserGender;
  needed: number;
  allocation: ReservationAllocationSummary | null;
  year: number;
  locale: string;
  formatCount: (value: number) => string;
  stackedIndex?: number;
  stackedTotal?: number;
  manageTo: string | null;
}) {
  const { t } = useTranslation();
  const tone = genderTone[gender];
  const assigned = Boolean(allocation);
  const place = allocation?.accommodation;
  const GenderIcon = gender === "MALE" ? Mars : Venus;
  const header = assigned && place?.name ? place.name : title;
  const statusText = assigned
    ? t("placements.statuses.PLACED")
    : t("reservations.placementUnassigned");
  const people =
    allocation != null
      ? t("accommodations.peopleCount", {
          count: formatCount(allocation.headcount),
        })
      : needed > 0
        ? t("accommodations.peopleCount", { count: formatCount(needed) })
        : null;
  const manager = stayManager(place, year);
  const lat = place?.latitude;
  const lng = place?.longitude;
  const hasPoint =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const distance =
    place?.distanceToShrineKm != null
      ? `${formatNumber(place.distanceToShrineKm, locale)} ${t("accommodations.km")}`
      : "";

  return (
    <article
      className={`${cardClassName} overflow-hidden ${
        tone === "teal" ? "ring-1 ring-teal-100/80" : "ring-1 ring-mint-100/80"
      }`}
    >
      <header
        className={`relative overflow-hidden px-5 py-4 sm:px-5 ${
          tone === "teal"
            ? "bg-gradient-to-e from-teal-50 via-white to-mint-50/40"
            : "bg-gradient-to-e from-mint-50 via-white to-teal-50/40"
        }`}
      >
        <FormCardHeaderDecor />
        <div className="relative flex items-start gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-white ${
              tone === "teal"
                ? "bg-teal-500 shadow-[0_10px_22px_rgba(46,189,182,0.32)]"
                : "bg-mint-500 shadow-[0_10px_22px_rgba(63,214,190),0.28)]"
            }`}
          >
            <GenderIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-ink-900">{header}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  assigned
                    ? "bg-teal-500 text-white"
                    : "bg-white text-ink-600 ring-1 ring-line"
                }`}
              >
                {assigned ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  <Hourglass className="size-3" aria-hidden />
                )}
                {statusText}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-ink-500">
              {assigned ? title : t("reservations.placementStatusLabel")}
              {stackedIndex && stackedTotal
                ? ` · ${formatCount(stackedIndex)} / ${formatCount(stackedTotal)}`
                : null}
              {people ? ` · ${people}` : null}
            </p>
          </div>
          {assigned && manageTo ? (
            <Link to={manageTo} className="ms-auto shrink-0">
              <Button type="button" variant="soft">
                <ArrowRightLeft className="size-4" aria-hidden />
                {t("reservations.changeAccommodation")}
              </Button>
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:gap-3 sm:p-5">
        <FormFactTile
          icon={Building2}
          label={t("accommodations.name")}
          value={place?.name || ""}
          empty={!place?.name}
          tone={tone}
          className="sm:col-span-2"
        />
        <FormFactTile
          icon={MapPin}
          label={t("accommodations.address")}
          value={<TextOrLink value={place?.address} />}
          empty={!place?.address?.trim()}
          tone={tone === "teal" ? "mint" : "teal"}
          className="sm:col-span-2"
        />
        <FormFactTile
          icon={Navigation}
          label={t("accommodations.neshanAddress")}
          value={<TextOrLink value={place?.neshanAddress} />}
          empty={!place?.neshanAddress?.trim()}
          tone={tone}
          className="sm:col-span-2"
        />
        <FormFactTile
          icon={Route}
          label={t("reservations.placementDistanceToShrine")}
          value={distance}
          empty={!distance}
          tone={tone === "teal" ? "mint" : "teal"}
        />
        <FormFactTile
          icon={UserRoundCog}
          label={t("reservations.placementManager")}
          value={manager?.name || ""}
          empty={!manager?.name}
          tone={tone}
        />
        <FormFactTile
          icon={Smartphone}
          label={t("reservations.placementManagerPhone")}
          value={
            manager?.phone ? (
              <CopyableDigits value={manager.phone} empty="" />
            ) : (
              ""
            )
          }
          empty={!manager?.phone}
          tone={tone === "teal" ? "mint" : "teal"}
        />
        <FormFactTile
          icon={Phone}
          label={t("reservations.placementPhone")}
          value={
            place?.phone ? <CopyableDigits value={place.phone} empty="" /> : ""
          }
          empty={!place?.phone}
          tone={tone}
        />
        <SocialTile
          eitaa={place?.eitaa}
          bale={place?.bale}
          otherSocial={place?.otherSocial}
          tone={tone}
        />
      </div>

      <StayMap
        latitude={hasPoint ? String(lat) : ""}
        longitude={hasPoint ? String(lng) : ""}
        pendingLabel={t("reservations.placementMapPending")}
      />
    </article>
  );
}

function StayMap({
  latitude,
  longitude,
  pendingLabel,
}: {
  latitude: string;
  longitude: string;
  pendingLabel: string;
}) {
  if (!latitude || !longitude) {
    return (
      <div className="border-t border-line bg-gradient-to-b from-cream-50 to-teal-50/30 px-4 py-5 sm:px-5">
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-200/80 bg-white/70 text-center sm:h-56">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <MapPinned className="size-6" aria-hidden />
          </span>
          <p className="max-w-xs px-3 text-xs leading-6 text-ink-500">
            {pendingLabel}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-line bg-cream-50/60 p-4 sm:p-5">
      <OsmMapPicker
        latitude={latitude}
        longitude={longitude}
        onChange={() => undefined}
        variant="always"
        readOnly
        heightClass="h-48 sm:h-56"
      />
    </div>
  );
}

function SocialTile({
  eitaa,
  bale,
  otherSocial,
  tone,
}: {
  eitaa?: string | null;
  bale?: string | null;
  otherSocial?: string | null;
  tone: StayTone;
}) {
  const { t } = useTranslation();
  const rows = [
    { label: t("accommodations.eitaa"), value: eitaa },
    { label: t("accommodations.bale"), value: bale },
    { label: t("accommodations.otherSocial"), value: otherSocial },
  ];

  return (
    <article
      className={`rounded-2xl border px-3 py-3 sm:col-span-2 ${
        tone === "teal"
          ? "border-teal-100 bg-gradient-to-b from-teal-50 to-white"
          : "border-mint-100 bg-gradient-to-b from-mint-50 to-white"
      }`}
    >
      <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
        <Share2 className="size-3.5 text-teal-600" aria-hidden />
        {t("reservations.placementSocial")}
      </p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-[11px] font-medium text-ink-500">
              {row.label}:
            </span>
            <span
              className={`min-w-0 flex-1 font-semibold ${
                row.value?.trim() ? "text-ink-900" : "text-ink-400"
              }`}
            >
              <TextOrLink value={row.value} />
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ReservationPlacementStep({
  reservation,
  footer,
}: {
  reservation: Reservation;
  footer?: ReactNode;
}) {
  const mashhad = showMashhadPlacement(reservation);
  const route = showRoutePlacement(reservation);
  return (
    <div className="space-y-4">
      {mashhad ? <ReservationPlacementPanel reservation={reservation} /> : null}
      {route ? <ReservationRoutePlacementPanel reservation={reservation} /> : null}
      {footer}
    </div>
  );
}
