import {
  Download,
  FileText,
  Flag,
  IdCard,
  KeyRound,
  MapPin,
  MapPinned,
  Mars,
  MessageSquare,
  Plus,
  Upload,
  Venus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  FilterPair,
  SortableTh,
} from "../../components/ui/ListControls";
import {
  Button,
  FormField,
  PageHeader,
  fieldClassName,
  listShellClassName,
} from "../../components/ui/Form";
import { RoleBadges } from "../../components/ui/RoleBadges";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useListParams } from "../../hooks/useListParams";
import { useListSort } from "../../hooks/useListSort";
import { api, getApiErrorMessage } from "../../lib/api";
import { localizeDigits } from "../../lib/datetime";
import { useGeoName } from "../../lib/geo";
import {
  userGenders,
  type City,
  type Country,
  type ManagedUser,
  type Paginated,
  type Province,
  type UserGender,
} from "../../types/app";

export function PilgrimsListPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.split("-")[0] ?? "fa";
  const geoName = useGeoName();
  const { q, page, term, setTerm, setPage, searchParams, setParams } =
    useListParams();
  const { sortBy, sortDir, sortParams, onSort } = useListSort(
    searchParams,
    setParams,
  );
  const [exporting, setExporting] = useState(false);
  const notesRef = useRef<HTMLInputElement>(null);
  const countryId = searchParams.get("countryId") ?? "";
  const provinceId = searchParams.get("provinceId") ?? "";
  const cityId = searchParams.get("cityId") ?? "";
  const gender = (searchParams.get("gender") ?? "") as UserGender | "";
  const notesParam = searchParams.get("notes") ?? "";

  const countries = useQuery({
    queryKey: ["countries", "lookup"],
    queryFn: async () => {
      const { data } = await api.get<Country[]>("/countries");
      return data;
    },
  });

  const provinces = useQuery({
    queryKey: ["provinces", "lookup", countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>("/provinces", {
        params: { countryId },
      });
      return data;
    },
  });

  const cities = useQuery({
    queryKey: ["cities", "lookup", provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>("/cities", {
        params: { provinceId },
      });
      return data;
    },
  });

  const filterParams = {
    ...(q ? { q } : {}),
    ...(countryId ? { countryId } : {}),
    ...(provinceId ? { provinceId } : {}),
    ...(cityId ? { cityId } : {}),
    ...(gender ? { gender } : {}),
    ...(notesParam ? { notes: notesParam } : {}),
    ...sortParams,
  };

  const query = useQuery({
    queryKey: [
      "pilgrims",
      q,
      page,
      countryId,
      provinceId,
      cityId,
      gender,
      notesParam,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>("/pilgrims", {
        params: { page, ...filterParams },
      });
      return data;
    },
  });

  function currentNotes() {
    return notesRef.current?.value.trim() || notesParam;
  }

  function onSearch() {
    setParams(
      {
        q: term.trim() || undefined,
        notes: currentNotes() || undefined,
      },
      { resetPage: true },
    );
  }

  async function downloadExcel() {
    setExporting(true);
    try {
      const notes = currentNotes();
      const { data } = await api.get<Blob>("/pilgrims/export", {
        params: {
          ...(term.trim() || q ? { q: term.trim() || q } : {}),
          ...(countryId ? { countryId } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
          ...(gender ? { gender } : {}),
          ...(notes ? { notes } : {}),
          ...sortParams,
        },
        responseType: "blob",
      });
      const blob = data instanceof Blob ? data : new Blob([data]);
      if (blob.type.includes("json")) {
        const text = await blob.text();
        const parsed = JSON.parse(text) as { message?: string };
        toast.error(parsed.message || t("common.error"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pilgrims.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t("pilgrims.excelDownloaded"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
    } finally {
      setExporting(false);
    }
  }

  const rows = query.data?.items ?? [];
  const filtersActive = Boolean(
    countryId || provinceId || cityId || gender || notesParam,
  );
  const emptyMessage =
    q || filtersActive ? t("pilgrims.noResults") : t("pilgrims.empty");

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t("menus.pilgrimsList")}
        subtitle={t("pilgrims.subtitle")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/pilgrims/import">
              <Button type="button" variant="soft">
                <Upload className="size-4" />
                {t("pilgrims.import")}
              </Button>
            </Link>
            <Link to="/pilgrims/new">
              <Button>
                <Plus className="size-4" />
                {t("pilgrims.create")}
              </Button>
            </Link>
          </div>
        }
      />
      <SearchBar
        inputId="pilgrims-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t("common.search")}
        placeholder={t("pilgrims.searchPlaceholder")}
        autoFocus
        filtersActive={filtersActive}
        extra={
          <>
            <FilterPair columns={3}>
              <FormField
                icon={Flag}
                label={t("geo.country")}
                htmlFor="pilgrim-country"
              >
                <SearchSelect
                  id="pilgrim-country"
                  value={countryId}
                  placeholder={t("geo.allCountries")}
                  onChange={(next) =>
                    setParams(
                      {
                        countryId: next || undefined,
                        provinceId: undefined,
                        cityId: undefined,
                      },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("geo.allCountries") },
                    ...(countries.data ?? []).map((country) => ({
                      value: country.id,
                      label: geoName(country),
                    })),
                  ]}
                />
              </FormField>
              <FormField
                icon={MapPinned}
                label={t("geo.province")}
                htmlFor="pilgrim-province"
              >
                <SearchSelect
                  id="pilgrim-province"
                  value={provinceId}
                  disabled={!countryId}
                  placeholder={t("geo.allProvinces")}
                  onChange={(next) =>
                    setParams(
                      { provinceId: next || undefined, cityId: undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("geo.allProvinces") },
                    ...(provinces.data ?? []).map((province) => ({
                      value: province.id,
                      label: geoName(province),
                    })),
                  ]}
                />
              </FormField>
              <FormField
                icon={MapPin}
                label={t("geo.city")}
                htmlFor="pilgrim-city"
              >
                <SearchSelect
                  id="pilgrim-city"
                  value={cityId}
                  disabled={!provinceId}
                  placeholder={t("geo.allCities")}
                  onChange={(next) =>
                    setParams(
                      { cityId: next || undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("geo.allCities") },
                    ...(cities.data ?? []).map((city) => ({
                      value: city.id,
                      label: geoName(city),
                    })),
                    { value: "none", label: t("geo.noCity") },
                  ]}
                />
              </FormField>
            </FilterPair>
            <FilterPair>
              <FormField
                icon={gender === "FEMALE" ? Venus : Mars}
                label={t("users.gender")}
                htmlFor="pilgrim-gender"
              >
                <SearchSelect
                  id="pilgrim-gender"
                  value={gender}
                  placeholder={t("pilgrims.allGenders")}
                  onChange={(next) =>
                    setParams(
                      { gender: next || undefined },
                      { resetPage: true },
                    )
                  }
                  options={[
                    { value: "", label: t("pilgrims.allGenders") },
                    ...Object.values(userGenders).map((item) => ({
                      value: item,
                      label: t(`userGenders.${item}`),
                    })),
                  ]}
                />
              </FormField>
              <FormField
                icon={FileText}
                label={t("users.notes")}
                htmlFor="pilgrim-notes"
              >
                <input
                  id="pilgrim-notes"
                  key={notesParam}
                  ref={notesRef}
                  className={fieldClassName}
                  defaultValue={notesParam}
                  placeholder={t("pilgrims.notesFilterPlaceholder")}
                />
              </FormField>
            </FilterPair>
          </>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={emptyMessage}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="fullName"
                label={t("users.fullName")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="username"
                label={t("users.username")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="nationalId"
                label={t("users.nationalId")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="phone"
                label={t("users.phone")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t("geo.city")}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div>
                    <div>{user.fullName}</div>
                    <RoleBadges roles={user.roles} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  {localizeDigits(user.username, locale)}
                </td>
                <td className="px-4 py-3">
                  {user.nationalId
                    ? localizeDigits(user.nationalId, locale)
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {user.phone ? localizeDigits(user.phone, locale) : "—"}
                </td>
                <td className="px-4 py-3">
                  {user.city ? geoName(user.city) : "—"}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/pilgrims/${user.id}`}
                    showView={false}
                    extra={
                      <>
                        <Link
                          to={`/pilgrims/${user.id}/sms`}
                          aria-label={t("pilgrims.sendSms")}
                          title={t("pilgrims.sendSms")}
                        >
                          <Button type="button" variant="ghost" icon>
                            <MessageSquare className="size-4" aria-hidden />
                          </Button>
                        </Link>
                        <Link
                          to={`/pilgrims/${user.id}/card`}
                          aria-label={t("pilgrims.card")}
                          title={t("pilgrims.card")}
                        >
                          <Button type="button" variant="ghost" icon>
                            <IdCard className="size-4" aria-hidden />
                          </Button>
                        </Link>
                        <Link
                          to={`/pilgrims/${user.id}/password`}
                          aria-label={t("pilgrims.setPassword")}
                          title={t("pilgrims.setPassword")}
                        >
                          <Button type="button" variant="ghost" icon>
                            <KeyRound className="size-4" aria-hidden />
                          </Button>
                        </Link>
                      </>
                    }
                    editTo={`/pilgrims/${user.id}/edit`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        startExtra={
          <Button
            type="button"
            variant="ghost"
            onClick={() => void downloadExcel()}
            disabled={exporting}
          >
            <Download className="size-4" />
            {exporting
              ? t("pilgrims.downloadingExcel")
              : t("pilgrims.downloadExcel")}
          </Button>
        }
      />
    </div>
  );
}
