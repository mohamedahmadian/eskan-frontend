import {
  CalendarDays,
  Filter,
  Flag,
  Footprints,
  IdCard,
  MapPin,
  Phone,
  Plus,
  Tent,
  Trash2,
  UserRound,
} from "lucide-react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from "../../components/ui/ListControls";
import {
  Button,
  FormField,
  PageHeader,
  listShellClassName,
} from "../../components/ui/Form";
import { confirmToast } from "../../components/ui/confirmToast";
import { FormMetaChip } from "../../components/ui/FormLayout";
import { PersianDateField } from "../../components/ui/PersianDateField";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useListParams } from "../../hooks/useListParams";
import { useListSort } from "../../hooks/useListSort";
import { api, getApiErrorMessage } from "../../lib/api";
import {
  addDaysIso,
  currentPersianYear,
  endOfIranWeekIso,
  formatNumber,
  localizeDigits,
  persianYearOptions,
  startOfIranWeekIso,
  todayIsoDate,
} from "../../lib/datetime";
import { useGeoName } from "../../lib/geo";
import {
  reservationStatuses,
  reservationTypes,
  type Caravan,
  type City,
  type Country,
  type ManagedUser,
  type Paginated,
  type Province,
  type ReceptionDashboard,
  type ReservationListItem,
  type ReservationType,
  type WalkingRoute,
} from "../../types/app";
import { HeadcountPills } from "./HeadcountPills";
import { inProgressFilter, listHeadcount, listStepProgress } from "./reservation-steps";
import { ReservationApplicantPickerModal } from "./ReservationApplicantPickerModal";
import { ReservationCodeBadge } from "./ReservationCodeBadge";
import { ReservationDashboardStats } from "./ReservationDashboardStats";
import { ReservationReviewActions } from "./ReservationReviewModal";
import { ReservationStatusBadge, ReservationTypeBadge } from "./ReservationStatusBadge";

const typeOrder: ReservationType[] = [
  reservationTypes.INDIVIDUAL,
  reservationTypes.GROUP,
  reservationTypes.CARAVAN,
];

export function ReservationsAdminListPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [purging, setPurging] = useState(false);
  const n = (value: number) => formatNumber(value, locale);
  const nameOf = useGeoName();
  const {
    q,
    page,
    term,
    setTerm,
    applySearch,
    setPage,
    searchParams,
    setParams,
  } = useListParams();
  const { sortBy, sortDir, sortParams, onSort } = useListSort(
    searchParams,
    setParams,
  );

  function purgeAllReservations() {
    confirmToast({
      title: t("reservations.confirmPurgeAll"),
      confirmLabel: t("common.yesDelete"),
      cancelLabel: t("common.cancel"),
      confirmVariant: "danger",
      onConfirm: async () => {
        setPurging(true);
        try {
          const { data } = await api.delete<{ deleted: number }>(
            "/reservations/purge-all",
          );
          toast.success(
            t("reservations.purgedAll", {
              count: formatNumber(data.deleted, locale),
            }),
          );
          void queryClient.invalidateQueries({ queryKey: ["reservations"] });
        } catch (error) {
          toast.error(getApiErrorMessage(error, t("common.error")));
        } finally {
          setPurging(false);
        }
      },
    });
  }

  const currentYear = String(currentPersianYear());
  const year = searchParams.get("year") || currentYear;
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const countryId = searchParams.get("countryId") ?? "";
  const provinceId = searchParams.get("provinceId") ?? "";
  const originCityId = searchParams.get("originCityId") ?? "";
  const walkingRouteId = searchParams.get("walkingRouteId") ?? "";
  const caravanId = searchParams.get("caravanId") ?? "";
  const caravanManagerId = searchParams.get("caravanManagerId") ?? "";
  const createdFrom = searchParams.get("createdFrom") ?? "";
  const createdTo = searchParams.get("createdTo") ?? "";

  const countries = useQuery({
    queryKey: ["countries", "lookup"],
    queryFn: async () => {
      const { data } = await api.get<Country[]>("/countries", {
        params: { activeOnly: true },
      });
      return data;
    },
  });
  const iranId = countries.data?.find((item) => item.iso2 === "IR")?.id ?? "";

  const provinceCountryId = countryId || iranId;
  const provinces = useQuery({
    queryKey: ["provinces", "lookup", provinceCountryId],
    enabled: Boolean(provinceCountryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>("/provinces", {
        params: { countryId: provinceCountryId, activeOnly: true },
      });
      return data;
    },
  });

  const cities = useQuery({
    queryKey: ["cities", "lookup", provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>("/cities", {
        params: { provinceId, activeOnly: true },
      });
      return data;
    },
  });

  const routes = useQuery({
    queryKey: ["walking-routes", "lookup"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>(
        "/walking-routes",
        {
          params: { pageSize: 100 },
        },
      );
      return data.items;
    },
  });

  const managers = useQuery({
    queryKey: ["caravan-managers", "lookup"],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>("/caravan-managers");
      return data;
    },
  });

  const caravans = useQuery({
    queryKey: ["caravans", "lookup"],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>("/caravans", {
        params: { pageSize: 100 },
      });
      return data.items;
    },
  });

  const dashboard = useQuery({
    queryKey: ["reservations", "dashboard", currentYear],
    queryFn: async () => {
      const { data } = await api.get<ReceptionDashboard>(
        "/reservations/dashboard",
        {
          params: { year: Number(currentYear) },
        },
      );
      return data;
    },
  });

  const listParams = {
    q: q || undefined,
    page,
    year: Number(year),
    type: type || undefined,
    status: status || undefined,
    countryId: countryId || undefined,
    originCityId: originCityId || undefined,
    walkingRouteId: walkingRouteId || undefined,
    caravanId: caravanId || undefined,
    caravanManagerId: caravanManagerId || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    ...sortParams,
  };

  const query = useQuery({
    queryKey: ["reservations", "admin", listParams],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReservationListItem>>(
        "/reservations",
        {
          params: listParams,
        },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const rows = query.data?.items ?? [];
  const filtersActive = Boolean(
    searchParams.get("year") ||
    type ||
    status ||
    countryId ||
    provinceId ||
    originCityId ||
    walkingRouteId ||
    caravanId ||
    caravanManagerId ||
    createdFrom ||
    createdTo,
  );

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t("menus.reservationsAdmin")}
        subtitle={t("reservations.adminSubtitle")}
        className="mb-3 sm:gap-2"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" aria-hidden />
              {t("reservations.createYear", {
                year: formatNumber(currentPersianYear(), locale),
              })}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={purging}
              onClick={purgeAllReservations}
            >
              <Trash2 className="size-4" aria-hidden />
              {t("reservations.purgeAllTemp")}
            </Button>
          </div>
        }
      />
      {pickerOpen ? (
        <ReservationApplicantPickerModal
          onClose={() => setPickerOpen(false)}
          onSelect={(user: ManagedUser) => {
            setPickerOpen(false);
            navigate(`/reservations/new?forUser=${encodeURIComponent(user.id)}`);
          }}
        />
      ) : null}
      {dashboard.data ? (
        <div className="mb-4">
          <ReservationDashboardStats
            compact
            data={dashboard.data}
            status={status}
            onStatusFilter={(next) =>
              setParams(
                { status: next && next !== status ? next : undefined },
                { resetPage: true },
              )
            }
          />
        </div>
      ) : null}

      <SearchBar
        inputId="reservations-admin-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t("common.search")}
        placeholder={t("reservations.searchAdminPlaceholder")}
        filtersActive={filtersActive}
        extra={
          <>
            <FormField
              icon={CalendarDays}
              label={t("reservations.year")}
              htmlFor="reservations-admin-year"
            >
              <SearchSelect
                id="reservations-admin-year"
                value={year}
                onChange={(next) =>
                  setParams(
                    {
                      year:
                        next && next !== currentYear ? next : undefined,
                    },
                    { resetPage: true },
                  )
                }
                options={persianYearOptions(locale, Number(year))}
                placeholder={t("reservations.year")}
              />
            </FormField>
            <FormField icon={Filter} label={t("reservations.type")}>
              <SearchSelect
                value={type}
                onChange={(next) =>
                  setParams({ type: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: "", label: t("reservations.type") },
                  ...typeOrder.map((item) => ({
                    value: item,
                    label: t(`reservations.types.${item}`),
                  })),
                ]}
                placeholder={t("reservations.type")}
              />
            </FormField>
            <FormField icon={Filter} label={t("reservations.status")}>
              <SearchSelect
                value={status}
                onChange={(next) =>
                  setParams({ status: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: "", label: t("reservations.status") },
                  {
                    value: inProgressFilter,
                    label: t("reservations.statusInProgress"),
                  },
                  ...Object.values(reservationStatuses).map((item) => ({
                    value: item,
                    label: t(`reservations.statuses.${item}`),
                  })),
                ]}
                placeholder={t("reservations.status")}
              />
            </FormField>
            <FormField icon={Flag} label={t("geo.country")}>
              <SearchSelect
                value={countryId}
                onChange={(next) =>
                  setParams(
                    {
                      countryId: next || undefined,
                      provinceId: undefined,
                      originCityId: undefined,
                    },
                    { resetPage: true },
                  )
                }
                options={[
                  { value: "", label: t("geo.allCountries") },
                  ...(countries.data ?? []).map((item) => ({
                    value: item.id,
                    label: nameOf(item),
                  })),
                ]}
                placeholder={t("geo.allCountries")}
              />
            </FormField>
            <FormField
              icon={Footprints}
              label={t("reservations.filterWalkingRoute")}
            >
              <SearchSelect
                value={walkingRouteId}
                onChange={(next) =>
                  setParams(
                    { walkingRouteId: next || undefined },
                    { resetPage: true },
                  )
                }
                options={[
                  { value: "", label: t("reservations.filterWalkingRoute") },
                  ...(routes.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                placeholder={t("reservations.filterWalkingRoute")}
              />
            </FormField>
            <FilterPair>
              <FormField icon={MapPin} label={t("reservations.province")}>
                <SearchSelect
                  value={provinceId}
                  onChange={(next) =>
                    setParams(
                      {
                        provinceId: next || undefined,
                        originCityId: undefined,
                      },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("reservations.province") },
                    ...(provinces.data ?? []).map((item) => ({
                      value: item.id,
                      label: nameOf(item),
                    })),
                  ]}
                  placeholder={t("reservations.province")}
                />
              </FormField>
              <FormField icon={MapPin} label={t("reservations.originCity")}>
                <SearchSelect
                  value={originCityId}
                  disabled={!provinceId}
                  onChange={(next) =>
                    setParams(
                      { originCityId: next || undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("reservations.originCity") },
                    ...(cities.data ?? []).map((item) => ({
                      value: item.id,
                      label: nameOf(item),
                    })),
                  ]}
                  placeholder={t("reservations.originCity")}
                />
              </FormField>
            </FilterPair>
            <FilterPair>
              <FormField
                icon={UserRound}
                label={t("reservations.caravanManager")}
              >
                <SearchSelect
                  value={caravanManagerId}
                  onChange={(next) =>
                    setParams(
                      { caravanManagerId: next || undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("reservations.caravanManager") },
                    ...(managers.data ?? []).map((item) => ({
                      value: item.id,
                      label: item.nationalId
                        ? `${item.fullName} · ${localizeDigits(item.nationalId, locale)}`
                        : item.fullName,
                    })),
                  ]}
                  placeholder={t("reservations.caravanManager")}
                />
              </FormField>
              <FormField icon={Tent} label={t("reservations.caravan")}>
                <SearchSelect
                  value={caravanId}
                  onChange={(next) =>
                    setParams(
                      { caravanId: next || undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("reservations.caravan") },
                    ...(caravans.data ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    })),
                  ]}
                  placeholder={t("reservations.caravan")}
                />
              </FormField>
            </FilterPair>
            <FilterPair>
              <FormField
                icon={CalendarDays}
                label={t("reservations.filterCreatedFrom")}
                htmlFor="created-from"
              >
                <PersianDateField
                  id="created-from"
                  value={createdFrom || undefined}
                  onChange={(value) =>
                    setParams(
                      { createdFrom: value || undefined },
                      { resetPage: true },
                    )
                  }
                />
              </FormField>
              <FormField
                icon={CalendarDays}
                label={t("reservations.filterCreatedTo")}
                htmlFor="created-to"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <PersianDateField
                      id="created-to"
                      value={createdTo || undefined}
                      onChange={(value) =>
                        setParams(
                          { createdTo: value || undefined },
                          { resetPage: true },
                        )
                      }
                    />
                  </div>
                  <CreatedRangePreset
                    createdFrom={createdFrom}
                    createdTo={createdTo}
                    onSelect={(from, to) =>
                      setParams(
                        {
                          createdFrom: from || undefined,
                          createdTo: to || undefined,
                        },
                        { resetPage: true },
                      )
                    }
                  />
                </div>
              </FormField>
            </FilterPair>
          </>
        }
      />

      <TableCard
        loading={query.isLoading}
        empty={
          q || filtersActive
            ? t("reservations.noResults")
            : t("reservations.adminEmpty")
        }
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="code"
                label={t("reservations.code")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="createdBy"
                label={t("reservations.applicant")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="caravan"
                label={t("reservations.partyName")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="originCity"
                label={t("reservations.originCity")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="type"
                label={t("reservations.admission")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="status"
                label={t("reservations.status")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-center font-medium">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const step = listStepProgress(row.status, row.type, row)
              const headcount = listHeadcount(row);
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <ReservationCodeBadge code={row.code} size="md" />
                  </td>
                  <td className="px-4 py-3">
                    {row.createdBy?.fullName ? (
                      <div className="flex flex-col items-start gap-1.5">
                        <span>{row.createdBy.fullName}</span>
                        {row.createdBy.nationalId || row.createdBy.phone ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.createdBy.nationalId ? (
                              <FormMetaChip
                                icon={IdCard}
                                copyValue={row.createdBy.nationalId}
                              />
                            ) : null}
                            {row.createdBy.phone ? (
                              <FormMetaChip
                                icon={Phone}
                                copyValue={row.createdBy.phone}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{row.caravan?.name ?? row.group?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.originCity ? nameOf(row.originCity) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <ReservationTypeBadge type={row.type} />
                      <HeadcountPills
                        type={row.type}
                        male={headcount.male}
                        female={headcount.female}
                        total={headcount.total}
                        format={n}
                        maleLabel={t("reservations.countMale")}
                        femaleLabel={t("reservations.countFemale")}
                        totalLabel={t("reservations.countTotal")}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <ReservationStatusBadge status={row.status} />
                      {step.showRemaining ? (
                        <span className="text-xs text-ink-500">
                          {t("reservations.stepsUntilComplete", {
                            count: formatNumber(step.remaining, locale),
                          })}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <ReviewRowActions
                        reservation={row}
                        canReview={
                          row.status ===
                          reservationStatuses.PENDING_MANAGEMENT_REVIEW
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

function ReviewRowActions({
  reservation,
  canReview,
}: {
  reservation: ReservationListItem;
  canReview: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  function refreshLists() {
    void queryClient.invalidateQueries({ queryKey: ["reservations", "admin"] });
    void queryClient.invalidateQueries({ queryKey: ["reservations", "dashboard"] });
  }

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 whitespace-nowrap">
      <Link to={`/reservations/${reservation.id}`} data-row-view className="sr-only">
        {t("common.view")}
      </Link>
      {canReview ? (
        <ReservationReviewActions
          reservation={reservation}
          onChanged={refreshLists}
          compact
          requireRejectReason
        />
      ) : null}
    </div>
  );
}

type CreatedRangeKey = "today" | "yesterday" | "week";

function createdRangeValue(key: CreatedRangeKey) {
  const today = todayIsoDate();
  if (key === "today") return { from: today, to: today };
  if (key === "yesterday") {
    const yesterday = addDaysIso(today, -1);
    return { from: yesterday, to: yesterday };
  }
  return { from: startOfIranWeekIso(today), to: endOfIranWeekIso(today) };
}

function CreatedRangePreset({
  createdFrom,
  createdTo,
  onSelect,
}: {
  createdFrom: string;
  createdTo: string;
  onSelect: (from: string, to: string) => void;
}) {
  const { t } = useTranslation();
  const options: Array<{ key: CreatedRangeKey; label: string }> = [
    { key: "today", label: t("reservations.createdToday") },
    { key: "yesterday", label: t("reservations.createdYesterday") },
    { key: "week", label: t("reservations.createdThisWeek") },
  ];
  const active = options.find((item) => {
    const range = createdRangeValue(item.key);
    return createdFrom === range.from && createdTo === range.to;
  })?.key;

  return (
    <div
      className="flex shrink-0 overflow-hidden rounded-2xl border border-line bg-cream-50"
      role="group"
    >
      {options.map((item) => {
        const selected = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={selected}
            className={`px-2.5 py-2 text-xs font-medium transition ${
              selected
                ? "bg-teal-500 text-white"
                : "text-ink-700 hover:bg-white"
            }`}
            onClick={() => {
              if (selected) {
                onSelect("", "");
                return;
              }
              const range = createdRangeValue(item.key);
              onSelect(range.from, range.to);
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
