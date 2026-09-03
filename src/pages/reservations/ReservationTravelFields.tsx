import {
  Accessibility,
  Building2,
  Bus,
  Calendar,
  CreditCard,
  Footprints,
  Info,
  MapPin,
  MoonStar,
  Route,
  Shield,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthProvider";
import { CheckboxField } from "../../components/ui/CheckboxField";
import { DateText, HijriDateText } from "../../components/ui/DateText";
import { FormField, fieldClassName } from "../../components/ui/Form";
import { FormFactTile, FormSectionTitle } from "../../components/ui/FormLayout";
import { OsmMapPicker, type MapOverlayMarker, type MapOverlays } from "../../components/ui/OsmMapPicker";
import { PersianDateField } from "../../components/ui/PersianDateField";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { api, getApiErrorMessage } from "../../lib/api";
import {
  currentPersianYear,
  formatGregorianDate,
  formatHijriDate,
  formatNumber,
  todayIsoDate,
} from "../../lib/datetime";
import { stageCoordinates, useGeoName } from "../../lib/geo";
import type {
  City,
  Country,
  Paginated,
  Province,
  ReceptionSettings,
  ReservationType,
  WalkingRoute,
  WalkingRouteStage,
} from "../../types/app";
import { stageKey, stageTitle } from "../walking-routes/StationInfoCard";
import { ReservationCountFields } from "./ReservationCountFields";
import {
  createReservationParty,
  emptyPartyDraft,
  partyDraftError,
  ReservationPartyFields,
  type PartyDraft,
  type PartyItemSnapshot,
  type PartyKind,
} from "./ReservationPartyFields";
import type { TravelSubStep } from "./travel-sub-steps";
import {
  RESERVATION_DATE_OVERLAP_CHECK_ENABLED,
  findOverlappingReservation,
  type ReservationDateSpan,
} from "./reservation-date-overlap";

function walkingStartFromStage(stage: WalkingRouteStage) {
  return {
    provinceId: stage.city.provinceId,
    originCityId: stage.cityId,
  };
}

function firstWalkingStage(route: WalkingRoute | undefined) {
  return [...(route?.stages ?? [])].sort((a, b) => a.stageNumber - b.stageNumber)[0];
}

export function walkingRouteOriginError(
  route: WalkingRoute | null | undefined,
  pilgrimCountryId: string | null | undefined,
  t: (key: string, options?: Record<string, string>) => string,
  nameOf: (item: { nameFa: string; nameEn?: string | null }) => string,
): string | null {
  if (!route?.originCountries?.length || !pilgrimCountryId) return null;
  if (route.originCountries.some((country) => country.id === pilgrimCountryId)) {
    return null;
  }
  const countries = [...route.originCountries]
    .map((country) => nameOf(country))
    .join("، ");
  return t("reservations.walkingRouteOriginOnly", { countries });
}

export function travelDatesError(
  values: Pick<
    TravelValues,
    "walkingStartDate" | "stayStartDate" | "stayEndDate" | "walkingRouteId"
  >,
  t: (key: string, options?: Record<string, string>) => string,
  overlap?: { others: ReservationDateSpan[]; excludeId?: string },
) {
  if (!values.walkingRouteId) {
    return t("reservations.walkingRouteRequired");
  }
  if (!values.walkingStartDate) {
    return t("reservations.walkingStartRequired");
  }
  if (!values.stayStartDate) {
    return t("reservations.stayStartRequired");
  }
  if (!values.stayEndDate) {
    return t("reservations.stayEndRequired");
  }
  if (
    values.stayStartDate &&
    values.walkingStartDate &&
    values.stayStartDate <= values.walkingStartDate
  ) {
    return t("reservations.walkingRangeInvalid");
  }
  if (
    values.stayEndDate &&
    values.stayStartDate &&
    values.stayEndDate < values.stayStartDate
  ) {
    return t("reservations.stayRangeInvalid");
  }
  if (overlap && RESERVATION_DATE_OVERLAP_CHECK_ENABLED) {
    const conflict = findOverlappingReservation(
      values,
      overlap.others,
      overlap.excludeId,
    );
    if (conflict) {
      return t("reservations.datesOverlap", { code: conflict.code });
    }
  }
  return null;
}

export type TravelValues = {
  provinceId: string;
  originCityId: string;
  walkingRouteId: string;
  stayStartDate: string;
  stayEndDate: string;
  walkingStartDate: string;
  maleCount: string;
  femaleCount: string;
  requestedMaleCount: string;
  requestedFemaleCount: string;
  caravanId: string;
  groupId: string;
  requestsAccommodation: boolean;
  requestsBus: boolean;
  requestsSimCard: boolean;
  requestsBankCard: boolean;
  specialServices: string;
};

export function ReservationTravelFields({
  values,
  onChange,
  type,
  locked,
  countryId,
  activeSubStep,
  dualCounts,
  selectedParty,
  subjectUser,
  reservationId,
  datesError,
  simCardRequestCount,
  bankCardRequestCount,
}: {
  values: TravelValues;
  onChange: (patch: Partial<TravelValues>) => void;
  type: ReservationType;
  locked?: boolean;
  countryId?: string;
  activeSubStep: TravelSubStep;
  dualCounts?: boolean;
  selectedParty?: PartyItemSnapshot | null;
  subjectUser?: {
    id?: string;
    fullName?: string;
    nationalId?: string | null;
    phone?: string | null;
    countryId?: string | null;
    provinceId?: string | null;
    cityId?: string | null;
    roles?: { code: string }[];
  } | null;
  reservationId?: string;
  datesError?: string | null;
  simCardRequestCount?: number;
  bankCardRequestCount?: number;
}) {
  if (activeSubStep === "count") {
    return (
      <ReservationCountFields
        values={values}
        onChange={onChange}
        type={type}
        locked={locked}
        dual={dualCounts && type !== "INDIVIDUAL"}
        reservationId={dualCounts ? reservationId : undefined}
      />
    );
  }
  if (activeSubStep === "party" && (type === "GROUP" || type === "CARAVAN")) {
    return (
      <ReservationTravelPartyField
        values={values}
        onChange={onChange}
        type={type}
        locked={locked}
        selectedParty={selectedParty}
        subjectUser={subjectUser}
      />
    );
  }
  if (activeSubStep === "dates" || activeSubStep === "optional") {
    return (
      <ReservationTravelInfoFields
        values={values}
        onChange={onChange}
        locked={locked}
        countryId={countryId}
        error={datesError}
      />
    );
  }
  if (activeSubStep === "services") {
    return (
      <ReservationApplicantFields
        values={values}
        onChange={onChange}
        locked={locked}
        reservationType={type}
        simCardRequestCount={simCardRequestCount}
        bankCardRequestCount={bankCardRequestCount}
      />
    );
  }
  return null;
}

export function ReservationTravelInfoFields({
  values,
  onChange,
  locked,
  countryId,
  showOccasionHint = true,
  error,
}: {
  values: TravelValues;
  onChange: (patch: Partial<TravelValues>) => void;
  locked?: boolean;
  countryId?: string;
  showOccasionHint?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <section>
        <FormSectionTitle icon={Calendar}>
          {t("reservations.travelDatesSection")}
        </FormSectionTitle>
        <ReservationDateFields
          values={values}
          onChange={onChange}
          locked={locked}
          showOccasionHint={showOccasionHint}
          error={error}
        />
      </section>
      <section>
        <FormSectionTitle icon={MapPin}>
          {t("reservations.travelOriginSection")}
        </FormSectionTitle>
        <ReservationOptionalGeoFields
          values={values}
          onChange={onChange}
          locked={locked}
          countryId={countryId}
        />
      </section>
    </div>
  );
}

export function ReservationApplicantFields({
  values,
  onChange,
  locked,
  reservationType,
  simCardRequestCount = 0,
  bankCardRequestCount = 0,
}: {
  values: Pick<
    TravelValues,
    | "requestsAccommodation"
    | "requestsBus"
    | "requestsSimCard"
    | "requestsBankCard"
    | "specialServices"
  >;
  onChange: (patch: Partial<TravelValues>) => void;
  locked?: boolean;
  reservationType?: ReservationType | "";
  simCardRequestCount?: number;
  bankCardRequestCount?: number;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const perMemberServices =
    reservationType === "GROUP" || reservationType === "CARAVAN";
  return (
    <div className="grid gap-3">
      <CheckboxField
        id="requestsInsurance"
        checked
        readOnly
        onChange={() => {}}
        label={
          <span className="flex items-center gap-2">
            <Shield className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t("reservations.requestsInsurance")}
          </span>
        }
      />
      <CheckboxField
        id="requestsAccommodation"
        checked={values.requestsAccommodation}
        disabled={locked}
        onChange={(checked) => onChange({ requestsAccommodation: checked })}
        label={
          <span className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t("reservations.requestsAccommodation")}
          </span>
        }
      />
      <CheckboxField
        id="requestsBus"
        checked={values.requestsBus}
        disabled={locked}
        onChange={(checked) => onChange({ requestsBus: checked })}
        label={
          <span className="flex items-center gap-2">
            <Bus className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t("reservations.requestsBus")}
          </span>
        }
      />
      {perMemberServices ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Smartphone}
              label={t("reservations.simCardRequestCount")}
              value={formatNumber(simCardRequestCount, locale)}
              tone="teal"
            />
            <FormFactTile
              icon={CreditCard}
              label={t("reservations.bankCardRequestCount")}
              value={formatNumber(bankCardRequestCount, locale)}
              tone="mint"
            />
          </div>
          <p className="text-xs text-ink-500">
            {t("reservations.serviceRequestsFromMembersHint")}
          </p>
        </>
      ) : (
        <>
          <CheckboxField
            id="requestsSimCard"
            checked={values.requestsSimCard}
            disabled={locked}
            onChange={(checked) => onChange({ requestsSimCard: checked })}
            label={
              <span className="flex items-center gap-2">
                <Smartphone className="size-4 shrink-0 text-teal-600" aria-hidden />
                {t("reservations.requestsSimCard")}
              </span>
            }
          />
          <CheckboxField
            id="requestsBankCard"
            checked={values.requestsBankCard}
            disabled={locked}
            onChange={(checked) => onChange({ requestsBankCard: checked })}
            label={
              <span className="flex items-center gap-2">
                <CreditCard className="size-4 shrink-0 text-teal-600" aria-hidden />
                {t("reservations.requestsBankCard")}
              </span>
            }
          />
        </>
      )}
      <FormField
        icon={Accessibility}
        label={t("reservations.specialServices")}
        htmlFor="specialServices"
      >
        {locked ? (
          <p className="text-sm text-ink-800">
            {values.specialServices.trim() || t("reservations.notEntered")}
          </p>
        ) : (
          <textarea
            id="specialServices"
            rows={3}
            maxLength={500}
            className={fieldClassName}
            value={values.specialServices}
            placeholder={t("reservations.specialServicesPlaceholder")}
            onChange={(event) =>
              onChange({ specialServices: event.target.value })
            }
          />
        )}
      </FormField>
    </div>
  );
}

export function OccasionStayHint() {
  const { t } = useTranslation();
  const year = currentPersianYear();
  const settings = useQuery({
    queryKey: ["reception-settings", year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(
        `/reception-settings/${year}`,
      );
      return data;
    },
  });
  const prophetDate = settings.data?.prophetDemiseDate;
  const imamDate = settings.data?.imamRezaMartyrdomDate;
  if (!prophetDate && !imamDate) return null;

  return (
    <aside
      className="relative overflow-hidden rounded-[22px] border border-gold-100 bg-gradient-to-b from-gold-50 via-white to-cream-50 p-4 shadow-[0_12px_28px_rgba(232,184,58,0.14)]"
      role="note"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-e from-gold-400 via-gold-500 to-teal-400"
        aria-hidden
      />
      <div className="flex items-start gap-3 pt-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
          <MoonStar className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-semibold text-ink-900">
            {t("reservations.occasionStayTitle")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {prophetDate ? (
              <OccasionDateChip
                label={t("reservations.occasionProphetLabel")}
                value={prophetDate}
              />
            ) : null}
            {imamDate ? (
              <OccasionDateChip
                label={t("reservations.occasionImamRezaLabel")}
                value={imamDate}
              />
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

function OccasionDateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold-100 bg-white/90 px-3 py-2.5 shadow-[0_4px_12px_rgba(196,146,26,0.06)]">
      <p className="text-[11px] leading-5 text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">
        <DateText value={value} />
      </p>
      <HijriDateText value={value} />
    </div>
  );
}

export function ReservationDateFields({
  values,
  onChange,
  locked,
  showOccasionHint = true,
  error,
}: {
  values: TravelValues;
  onChange: (patch: Partial<TravelValues>) => void;
  locked?: boolean;
  showOccasionHint?: boolean;
  error?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const n = (value: number) => formatNumber(value, locale);
  const todayIso = todayIsoDate();
  const stayDays = (() => {
    if (!values.stayStartDate || !values.stayEndDate) return 0;
    const toUtc = (iso: string) => {
      const [year, month, day] = iso.split("-").map(Number);
      return Date.UTC(year, month - 1, day);
    };
    const diffDays = Math.round(
      (toUtc(values.stayEndDate) - toUtc(values.stayStartDate)) / 86_400_000,
    );
    if (diffDays < 0) return 0;
    return diffDays + 1; // include both start and end dates
  })();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DateValueField
          id="stayStartDate"
          icon={Calendar}
          label={t("reservations.stayStartDate")}
          value={values.stayStartDate}
          locked={locked}
          required
          minDate={todayIso}
          showEquivalentsBadges
          onChange={(stayStartDate) => {
            const patch: Partial<TravelValues> = { stayStartDate };
            if (stayStartDate && values.stayEndDate && values.stayEndDate < stayStartDate) {
              patch.stayEndDate = stayStartDate;
            }
            onChange(patch);
          }}
        />
        <DateValueField
          id="stayEndDate"
          icon={Calendar}
          label={t("reservations.stayEndDate")}
          value={values.stayEndDate}
          locked={locked}
          required
          minDate={values.stayStartDate || todayIso}
          showEquivalentsBadges
          onChange={(stayEndDate) => onChange({ stayEndDate })}
        />
      </div>
      {stayDays > 0 ? (
        <div className="rounded-[22px] border border-teal-100 bg-gradient-to-e from-teal-50 via-white to-teal-50 px-4 py-3 shadow-[0_6px_16px_rgba(20,40,40,0.04)]">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800">
            <Calendar className="size-4" aria-hidden />
            {t("reservations.stayDays", { count: n(stayDays) })}
          </p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {showOccasionHint ? <OccasionStayHint /> : null}
    </div>
  );
}

export function ReservationOptionalGeoFields({
  values,
  onChange,
  locked,
  countryId,
}: {
  values: TravelValues;
  onChange: (patch: Partial<TravelValues>) => void;
  locked?: boolean;
  countryId?: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const nameOf = useGeoName();

  const countries = useQuery({
    queryKey: ["countries", "lookup"],
    queryFn: async () => {
      const { data } = await api.get<Country[]>("/countries", {
        params: { activeOnly: true },
      });
      return data;
    },
  });
  const iranId = countries.data?.find((country) => country.iso2 === "IR")?.id || "";

  const routes = useQuery({
    queryKey: ["walking-routes", "lookup", countryId || "all"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>(
        "/walking-routes",
        {
          params: {
            pageSize: 100,
            originCountryId: countryId || undefined,
          },
        },
      );
      return data.items;
    },
  });

  const selectedRouteQuery = useQuery({
    queryKey: ["walking-route", values.walkingRouteId],
    enabled:
      Boolean(values.walkingRouteId) &&
      !(routes.data ?? []).some((item) => item.id === values.walkingRouteId),
    queryFn: async () => {
      const { data } = await api.get<WalkingRoute>(
        `/walking-routes/${values.walkingRouteId}`,
      );
      return data;
    },
  });
  const selectedRoute =
    (routes.data ?? []).find((item) => item.id === values.walkingRouteId) ??
    selectedRouteQuery.data;
  const stages = useMemo(
    () =>
      [...(selectedRoute?.stages ?? [])].sort(
        (a, b) => a.stageNumber - b.stageNumber,
      ),
    [selectedRoute?.stages],
  );
  const selectedStage =
    stages.find((stage) => stage.cityId === values.originCityId) ?? null;
  const geoCountryId =
    selectedStage?.city.province.countryId ||
    firstWalkingStage(selectedRoute)?.city.province.countryId ||
    countryId ||
    iranId;

  const provinces = useQuery({
    queryKey: ["provinces", "lookup", geoCountryId],
    enabled: Boolean(geoCountryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>("/provinces", {
        params: { countryId: geoCountryId, activeOnly: true },
      });
      return data;
    },
  });

  const cities = useQuery({
    queryKey: ["cities", "lookup", values.provinceId],
    enabled: Boolean(values.provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>("/cities", {
        params: { provinceId: values.provinceId, activeOnly: true },
      });
      return data;
    },
  });

  useEffect(() => {
    if (!values.walkingRouteId || values.originCityId || locked) return;
    const start = firstWalkingStage(selectedRoute);
    if (!start) return;
    onChange(walkingStartFromStage(start));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, selectedRoute, values.originCityId, values.walkingRouteId]);

  const routeOriginError = walkingRouteOriginError(
    selectedRoute,
    countryId,
    t,
    nameOf,
  );

  const overlays = useMemo<MapOverlays | null>(() => {
    if (!stages.length) return null;
    const path: { lat: number; lng: number }[] = [];
    const markers: MapOverlayMarker[] = [];
    for (const stage of stages) {
      const coords = stageCoordinates(stage);
      if (!coords) continue;
      path.push(coords);
      const id = stageKey(stage);
      const numberLabel = formatNumber(stage.stageNumber, locale);
      markers.push({
        id,
        lat: coords.lat,
        lng: coords.lng,
        kind: stage.cityId === values.originCityId ? "current" : "station",
        badge: numberLabel,
        title: stageTitle(
          stage,
          locale,
          `${t("walkingRoutes.stage")} ${numberLabel}`,
        ),
      });
    }
    if (!markers.length && path.length < 2) return null;
    return {
      markers,
      path: path.length >= 2 ? path : undefined,
      fit: true,
      fitMaxZoom: 16,
    };
  }, [locale, stages, t, values.originCityId]);

  function applyRoute(walkingRouteId: string) {
    if (!walkingRouteId) {
      onChange({ walkingRouteId: "", provinceId: "", originCityId: "" });
      return;
    }
    const route = (routes.data ?? []).find((item) => item.id === walkingRouteId);
    const currentOnRoute = route?.stages.some(
      (stage) => stage.cityId === values.originCityId,
    );
    if (currentOnRoute) {
      onChange({ walkingRouteId });
      return;
    }
    const start = firstWalkingStage(route);
    onChange({
      walkingRouteId,
      ...(start ? walkingStartFromStage(start) : { provinceId: "", originCityId: "" }),
    });
  }

  function applyStation(stageId: string) {
    const stage = stages.find((item) => stageKey(item) === stageId);
    if (!stage) return;
    onChange(walkingStartFromStage(stage));
  }

  return (
    <div className="space-y-4">
      <DateValueField
        id="walkingStartDate"
        icon={Footprints}
        label={t("reservations.walkingStartDate")}
        value={values.walkingStartDate}
        locked={locked}
        required
        onChange={(walkingStartDate) => onChange({ walkingStartDate })}
      />
      <FormField
        icon={Route}
        label={`${t("reservations.walkingRouteSelectTitle")} *`}
      >
        <SearchSelect
          value={values.walkingRouteId}
          onChange={applyRoute}
          options={(
            selectedRoute &&
            !(routes.data ?? []).some((item) => item.id === selectedRoute.id)
              ? [selectedRoute, ...(routes.data ?? [])]
              : (routes.data ?? [])
          ).map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          placeholder={t("reservations.walkingRoute")}
          disabled={locked}
        />
        {routeOriginError ? (
          <p className="mt-2 text-sm text-red-700">{routeOriginError}</p>
        ) : null}
      </FormField>
      {values.walkingRouteId ? (
        overlays ? (
          <div className="overflow-hidden rounded-[22px] border border-teal-100 bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]">
            <OsmMapPicker
              latitude=""
              longitude=""
              onChange={() => undefined}
              variant="always"
              readOnly
              overlays={overlays}
              heightClass="h-72"
              onMarkerClick={locked ? undefined : applyStation}
            />
          </div>
        ) : (
          <p className="text-sm text-ink-500">{t("walkingRoutes.stationsNoMap")}</p>
        )
      ) : null}
      {values.walkingRouteId ? (
        <aside
          className="relative overflow-hidden rounded-[22px] border-2 border-teal-200 bg-gradient-to-b from-teal-50 via-white to-mint-50 p-4 shadow-[0_12px_28px_rgba(46,189,182,0.16)]"
          role="note"
        >
          <div
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-e from-teal-400 via-mint-400 to-teal-500"
            aria-hidden
          />
          <div className="flex items-start gap-3 pt-1">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
              <Info className="size-5" aria-hidden />
            </span>
            <p className="pt-1.5 text-sm font-medium leading-7 text-ink-800">
              {t("reservations.walkingRouteStationHint")}
            </p>
          </div>
        </aside>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={Building2} label={t("reservations.walkingStartProvince")}>
          <SearchSelect
            value={values.provinceId}
            onChange={(provinceId) =>
              onChange({ provinceId, originCityId: "" })
            }
            options={(provinces.data ?? []).map((item) => ({
              value: item.id,
              label: nameOf(item),
            }))}
            placeholder={t("reservations.walkingStartProvince")}
            disabled={locked}
          />
        </FormField>
        <FormField icon={MapPin} label={t("reservations.walkingStartCity")}>
          <SearchSelect
            value={values.originCityId}
            onChange={(originCityId) => onChange({ originCityId })}
            options={(cities.data ?? []).map((item) => ({
              value: item.id,
              label: nameOf(item),
            }))}
            placeholder={t("reservations.walkingStartCity")}
            disabled={locked || !values.provinceId}
          />
        </FormField>
      </div>
    </div>
  );
}

export function ReservationTravelPartyField({
  values,
  onChange,
  type,
  locked,
  selectedParty,
  subjectUser,
}: {
  values: TravelValues;
  onChange: (patch: Partial<TravelValues>) => void;
  type: PartyKind;
  locked?: boolean;
  selectedParty?: PartyItemSnapshot | null;
  subjectUser?: {
    id?: string;
    fullName?: string;
    nationalId?: string | null;
    phone?: string | null;
    countryId?: string | null;
    provinceId?: string | null;
    cityId?: string | null;
    roles?: { code: string }[];
  } | null;
}) {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const draftUser = subjectUser ?? user;
  const [draft, setDraft] = useState<PartyDraft>(() =>
    emptyPartyDraft(draftUser),
  );
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const selectedId = type === "CARAVAN" ? values.caravanId : values.groupId;
  const needsCity = !draftUser?.cityId;

  async function createParty() {
    const error = partyDraftError(draft, type, t, needsCity);
    if (error) {
      toast.error(error);
      return;
    }
    setCreating(true);
    try {
      const created = await createReservationParty(type, draft);
      onChange({
        caravanId: type === "CARAVAN" ? created.id : "",
        groupId: type === "GROUP" ? created.id : "",
        walkingRouteId: draft.walkingRouteId || "",
      });
      setDraft(emptyPartyDraft(draftUser));
      await queryClient.invalidateQueries({
        queryKey:
          type === "CARAVAN"
            ? ["caravans", "mine", "lookup"]
            : ["groups", "mine", "lookup"],
      });
      toast.success(
        t(type === "CARAVAN" ? "caravans.created" : "groups.created"),
      );
      await refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
    } finally {
      setCreating(false);
    }
  }

  return (
    <ReservationPartyFields
      type={type}
      selectedId={selectedId}
      knownSelected={selectedParty}
      locked={locked}
      draft={draft}
      subjectUser={subjectUser}
      onDraftChange={(patch) =>
        setDraft((current) => ({ ...current, ...patch }))
      }
      onSelect={(item) =>
        onChange({
          caravanId: type === "CARAVAN" ? item.id : "",
          groupId: type === "GROUP" ? item.id : "",
        })
      }
      showCreateAction={!locked}
      creating={creating}
      onCreate={() => {
        void createParty();
      }}
    />
  );
}

function DateValueField({
  id,
  icon: Icon,
  label,
  value,
  locked,
  required,
  minDate,
  maxDate,
  showEquivalentsBadges,
  onChange,
}: {
  id: string;
  icon: typeof Calendar;
  label: string;
  value: string;
  locked?: boolean;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  showEquivalentsBadges?: boolean;
  onChange: (value: string) => void;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";

  function EquivalentsBadges({ value }: { value?: string | null }) {
    if (!value) return null;
    return (
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-100" dir="ltr">
          {formatGregorianDate(value, locale)}
        </span>
        <span className="inline-flex items-center rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-semibold text-mint-700 ring-1 ring-mint-100" dir="rtl" lang="ar">
          {formatHijriDate(value, locale)}
        </span>
      </div>
    );
  }

  return (
    <FormField icon={Icon} label={required ? `${label} *` : label} htmlFor={id}>
      {locked ? (
        <div className="space-y-1.5">
          <p className="text-sm text-ink-800">
            {value ? <DateText value={value} /> : "—"}
          </p>
          {showEquivalentsBadges ? <EquivalentsBadges value={value} /> : <HijriDateText value={value} />}
        </div>
      ) : (
        <div className="space-y-1.5">
          <PersianDateField
            id={id}
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            showHijri={!showEquivalentsBadges}
            onChange={(next) => onChange(next ?? "")}
          />
          {showEquivalentsBadges ? <EquivalentsBadges value={value} /> : null}
        </div>
      )}
    </FormField>
  );
}
