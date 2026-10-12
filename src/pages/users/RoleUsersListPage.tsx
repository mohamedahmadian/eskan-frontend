import { FileText, Filter, Flag, MapPin, MapPinned, Mars, Plus, Shield, Tent, ToggleRight, Users, Venus } from 'lucide-react'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  PaginationBar,
  SearchBar,
  TableCard,
  EntityRowActions,
  FilterPair,
  SortableTh,
} from '../../components/ui/ListControls'
import {
  Button,
  FormField,
  PageHeader,
  fieldClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { HoverTooltip } from '../../components/ui/HoverTooltip'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { formatRoles } from '../../lib/roles'
import { useGeoName } from '../../lib/geo'
import {
  userGenders,
  userStatuses,
  type City,
  type Country,
  type ManagedCaravan,
  type ManagedUser,
  type Paginated,
  type Province,
  type RoleOption,
  type UserGender,
  type UserStatus,
} from '../../types/app'
import type { RoleUserScope } from './user-scopes'

const LIST_CARAVAN_BADGE_LIMIT = 2

function caravanBadgeClass(active: boolean) {
  return active
    ? 'bg-teal-50 text-teal-800 ring-teal-100'
    : 'bg-cream-100 text-ink-500 ring-line'
}

function CaravanNameBadges({
  caravans,
  locale,
}: {
  caravans: Pick<ManagedCaravan, 'id' | 'name' | 'isActive'>[]
  locale: string
}) {
  const { t } = useTranslation()
  if (!caravans.length) return <span>—</span>

  const shown = caravans.slice(0, LIST_CARAVAN_BADGE_LIMIT)
  const hidden = caravans.slice(LIST_CARAVAN_BADGE_LIMIT)

  return (
    <div className="flex max-w-[15rem] flex-wrap items-center gap-1">
      {shown.map((item) => (
        <span
          key={item.id}
          className={`inline-flex max-w-[8.5rem] truncate rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${caravanBadgeClass(item.isActive)}`}
        >
          {item.name}
        </span>
      ))}
      {hidden.length ? (
        <HoverTooltip
          label={t('caravanManagers.moreCaravans')}
          content={
            <div className="min-w-[12.5rem]">
              <div className="flex items-center gap-2 border-b border-teal-50 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-white shadow-[0_6px_12px_rgba(46,189,182,0.28)]">
                  <Tent className="size-3.5" aria-hidden />
                </span>
                <p className="text-[11px] font-semibold text-ink-800">
                  {t('caravanManagers.moreCaravans')}
                </p>
              </div>
              <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto p-2.5">
                {hidden.map((item) => (
                  <li key={item.id}>
                    <span
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${caravanBadgeClass(item.isActive)}`}
                    >
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${
                          item.isActive ? 'bg-teal-500' : 'bg-ink-400'
                        }`}
                        aria-hidden
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <button
            type="button"
            className="inline-flex shrink-0 rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-semibold text-mint-600 ring-1 ring-mint-100 hover:bg-mint-100"
          >
            +{formatNumber(hidden.length, locale)}
          </button>
        </HoverTooltip>
      ) : null}
    </div>
  )
}

function parseRoleCodes(searchParams: URLSearchParams) {
  const fromList = (searchParams.get('roleCodes') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (fromList.length) {
    return [...new Set(fromList)]
  }
  const legacy = searchParams.get('roleCode')?.trim()
  return legacy ? [legacy] : []
}

export function RoleUsersListPage({ scope }: { scope: RoleUserScope }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user: actor } = useAuth()
  const { confirmDelete } = useConfirmDelete()
  const geoName = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const personFilters = Boolean(scope.showPersonFilters)
  const notesRef = useRef<HTMLInputElement>(null)
  const roleCodes = scope.showRoleFilter ? parseRoleCodes(searchParams) : []
  const countryId = personFilters ? (searchParams.get('countryId') ?? '') : ''
  const provinceId =
    personFilters || scope.showHeadquartersAreas ? (searchParams.get('provinceId') ?? '') : ''
  const cityId =
    personFilters || scope.showHeadquartersAreas ? (searchParams.get('cityId') ?? '') : ''
  const status = personFilters ? ((searchParams.get('status') ?? '') as UserStatus | '') : ''
  const gender = personFilters ? ((searchParams.get('gender') ?? '') as UserGender | '') : ''
  const notesParam = personFilters ? (searchParams.get('notes') ?? '') : ''
  const keys = scope.i18nPrefix
  const roles = useQuery({
    queryKey: ['roles'],
    enabled: Boolean(scope.showRoleFilter),
    queryFn: async () => {
      const { data } = await api.get<RoleOption[]>('/roles')
      return data
    },
  })
  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    enabled: personFilters,
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })
  const provinces = useQuery({
    queryKey: personFilters ? ['provinces', 'lookup', countryId] : ['provinces', 'lookup'],
    enabled: personFilters ? Boolean(countryId) : Boolean(scope.showHeadquartersAreas),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: personFilters ? { countryId } : undefined,
      })
      return data
    },
  })
  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean((personFilters || scope.showHeadquartersAreas) && provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', { params: { provinceId } })
      return data
    },
  })
  const roleCodesKey = roleCodes.join(',')
  const query = useQuery({
    queryKey: [
      scope.queryKey,
      q,
      page,
      roleCodesKey,
      countryId,
      provinceId,
      cityId,
      status,
      gender,
      notesParam,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>(scope.apiBase, {
        params: {
          q: q || undefined,
          page,
          roleCodes: roleCodesKey || undefined,
          countryId: countryId || undefined,
          provinceId: provinceId || undefined,
          cityId: cityId || undefined,
          status: status || undefined,
          gender: gender || undefined,
          notes: notesParam || undefined,
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(
    roleCodes.length || countryId || provinceId || cityId || status || gender || notesParam,
  )
  const filtered = Boolean(q || filtersActive)
  const hasExtraFilters = Boolean(
    scope.showHeadquartersAreas || scope.showRoleFilter || personFilters,
  )

  function currentNotes() {
    return notesRef.current?.value.trim() ?? notesParam
  }

  function toggleRole(code: string, on: boolean) {
    const next = on
      ? [...new Set([...roleCodes, code])]
      : roleCodes.filter((item) => item !== code)
    setParams(
      {
        roleCodes: next.length ? next.join(',') : undefined,
        roleCode: undefined,
      },
      { resetPage: true },
    )
  }

  function joinNames(items?: { nameFa: string; nameEn: string }[]) {
    if (!items?.length) return '—'
    return items.map((item) => geoName(item)).join('، ')
  }

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Users}
        title={t(scope.listTitleKey)}
        subtitle={t(`${keys}.subtitle`)}
        action={
          <Link to={`${scope.listPath}/new`}>
            <Button>
              <Plus className="size-4" />
              {t(`${keys}.create`)}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId={`${scope.queryKey}-search`}
        term={term}
        onTermChange={setTerm}
        onSubmit={() =>
          personFilters
            ? setParams(
                {
                  q: term.trim() || undefined,
                  notes: currentNotes() || undefined,
                },
                { resetPage: true },
              )
            : applySearch()
        }
        label={t('common.search')}
        placeholder={t(`${keys}.searchPlaceholder`)}
        filtersActive={filtersActive}
        extraClassName={
          scope.showRoleFilter && !scope.showHeadquartersAreas && !personFilters
            ? 'sm:grid-cols-1'
            : 'sm:grid-cols-2'
        }
        extra={
          hasExtraFilters ? (
            <>
              {personFilters ? (
                <>
                  <FilterPair>
                    <FormField icon={ToggleRight} label={t('users.status')} htmlFor={`${scope.queryKey}-status`}>
                      <SearchSelect
                        id={`${scope.queryKey}-status`}
                        value={status}
                        placeholder={t('users.allStatuses')}
                        onChange={(next) =>
                          setParams({ status: next || undefined }, { resetPage: true })
                        }
                        options={[
                          { value: '', label: t('users.allStatuses') },
                          ...Object.values(userStatuses).map((item) => ({
                            value: item,
                            label: t(`userStatuses.${item}`),
                          })),
                        ]}
                      />
                    </FormField>
                    <FormField
                      icon={gender === 'FEMALE' ? Venus : Mars}
                      label={t('users.gender')}
                      htmlFor={`${scope.queryKey}-gender`}
                    >
                      <SearchSelect
                        id={`${scope.queryKey}-gender`}
                        value={gender}
                        placeholder={t('users.allGenders')}
                        onChange={(next) =>
                          setParams({ gender: next || undefined }, { resetPage: true })
                        }
                        options={[
                          { value: '', label: t('users.allGenders') },
                          ...Object.values(userGenders).map((item) => ({
                            value: item,
                            label: t(`userGenders.${item}`),
                          })),
                        ]}
                      />
                    </FormField>
                  </FilterPair>
                  <FilterPair columns={3}>
                    <FormField icon={Flag} label={t('geo.country')} htmlFor={`${scope.queryKey}-country`}>
                      <SearchSelect
                        id={`${scope.queryKey}-country`}
                        value={countryId}
                        placeholder={t('geo.allCountries')}
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
                          { value: '', label: t('geo.allCountries') },
                          ...(countries.data ?? []).map((country) => ({
                            value: country.id,
                            label: geoName(country),
                          })),
                        ]}
                      />
                    </FormField>
                    <FormField icon={MapPinned} label={t('geo.province')} htmlFor={`${scope.queryKey}-province`}>
                      <SearchSelect
                        id={`${scope.queryKey}-province`}
                        value={provinceId}
                        disabled={!countryId}
                        placeholder={t('geo.allProvinces')}
                        onChange={(next) =>
                          setParams(
                            { provinceId: next || undefined, cityId: undefined },
                            { resetPage: true },
                          )
                        }
                        options={[
                          { value: '', label: t('geo.allProvinces') },
                          ...(provinces.data ?? []).map((province) => ({
                            value: province.id,
                            label: geoName(province),
                          })),
                        ]}
                      />
                    </FormField>
                    <FormField icon={MapPin} label={t('geo.city')} htmlFor={`${scope.queryKey}-city`}>
                      <SearchSelect
                        id={`${scope.queryKey}-city`}
                        value={cityId}
                        disabled={!provinceId}
                        placeholder={t('geo.allCities')}
                        onChange={(next) =>
                          setParams({ cityId: next || undefined }, { resetPage: true })
                        }
                        options={[
                          { value: '', label: t('geo.allCities') },
                          ...(cities.data ?? []).map((city) => ({
                            value: city.id,
                            label: geoName(city),
                          })),
                          { value: 'none', label: t('geo.noCity') },
                        ]}
                      />
                    </FormField>
                  </FilterPair>
                  <div className="sm:col-span-2">
                    <FormField icon={FileText} label={t('users.notes')} htmlFor={`${scope.queryKey}-notes`}>
                      <input
                        id={`${scope.queryKey}-notes`}
                        key={notesParam}
                        ref={notesRef}
                        className={fieldClassName}
                        defaultValue={notesParam}
                        placeholder={t('users.notesFilterPlaceholder')}
                      />
                    </FormField>
                  </div>
                </>
              ) : null}
              {scope.showHeadquartersAreas ? (
                <FilterPair>
                  <FormField icon={Filter} label={t('geo.province')} htmlFor="hq-list-province">
                    <SearchSelect
                      id="hq-list-province"
                      value={provinceId}
                      placeholder={t('geo.allProvinces')}
                      onChange={(next) =>
                        setParams(
                          { provinceId: next || undefined, cityId: undefined },
                          { resetPage: true },
                        )
                      }
                      options={[
                        { value: '', label: t('geo.allProvinces') },
                        ...(provinces.data ?? []).map((province) => ({
                          value: province.id,
                          label: geoName(province),
                        })),
                      ]}
                    />
                  </FormField>
                  <FormField icon={Filter} label={t('geo.city')} htmlFor="hq-list-city">
                    <SearchSelect
                      id="hq-list-city"
                      value={cityId}
                      disabled={!provinceId}
                      placeholder={t('geo.allCities')}
                      onChange={(next) => setParams({ cityId: next || undefined }, { resetPage: true })}
                      options={[
                        { value: '', label: t('geo.allCities') },
                        ...(cities.data ?? []).map((city) => ({
                          value: city.id,
                          label: geoName(city),
                        })),
                      ]}
                    />
                  </FormField>
                </FilterPair>
              ) : null}
              {scope.showRoleFilter ? (
                <FormField icon={Shield} label={t('users.filterRoles')}>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(roles.data ?? []).map((role) => (
                      <CheckboxField
                        key={role.code}
                        checked={roleCodes.includes(role.code)}
                        onChange={(on) => toggleRole(role.code, on)}
                        label={t(role.nameKey)}
                      />
                    ))}
                  </div>
                </FormField>
              ) : null}
            </>
          ) : undefined
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={filtered ? t(`${keys}.noResults`) : t(`${keys}.empty`)}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="fullName"
                label={t('users.fullName')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              {scope.hideUsername ? null : (
                <SortableTh
                  column="username"
                  label={t('users.username')}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              )}
              <SortableTh
                column="phone"
                label={t('users.phone')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              {scope.showHeadquartersAreas ? (
                <>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('headquartersRepresentatives.provinces')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('headquartersRepresentatives.cities')}
                  </th>
                </>
              ) : (
                <SortableTh
                  column="city"
                  label={t('geo.city')}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              )}
              {scope.hideListRoles ? null : (
                <th className="px-4 py-3 text-start font-medium">{t('users.roles')}</th>
              )}
              {scope.hideStatus ? null : (
                <SortableTh
                  column="status"
                  label={t('users.status')}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              )}
              {scope.showAccommodations ? (
                <SortableTh
                  column="accommodationCount"
                  label={t('accommodationManagers.accommodationCount')}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              ) : null}
              {scope.showCaravans ? (
                <SortableTh
                  column="caravanCount"
                  label={t('caravanManagers.caravans')}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={onSort}
                />
              ) : null}
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-4 py-3">{user.fullName}</td>
                {scope.hideUsername ? null : (
                  <td className="px-4 py-3">{localizeDigits(user.username, locale)}</td>
                )}
                <td className="px-4 py-3">
                  {user.phone ? localizeDigits(user.phone, locale) : '—'}
                </td>
                {scope.showHeadquartersAreas ? (
                  <>
                    <td className="px-4 py-3">{joinNames(user.representedProvinces)}</td>
                    <td className="px-4 py-3">{joinNames(user.representedCities)}</td>
                  </>
                ) : (
                  <td className="px-4 py-3">{user.city ? geoName(user.city) : '—'}</td>
                )}
                {scope.hideListRoles ? null : (
                  <td className="px-4 py-3">{formatRoles(user.roles, t)}</td>
                )}
                {scope.hideStatus ? null : (
                  <td className="px-4 py-3">{t(`userStatuses.${user.status}`)}</td>
                )}
                {scope.showAccommodations ? (
                  <td className="px-4 py-3">
                    {formatNumber(user.accommodationCount ?? 0, locale)}
                  </td>
                ) : null}
                {scope.showCaravans ? (
                  <td className="px-4 py-3 align-middle">
                    <CaravanNameBadges caravans={user.caravans ?? []} locale={locale} />
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`${scope.listPath}/${user.id}`}
                    editTo={`${scope.listPath}/${user.id}/edit`}
                    canDelete={!scope.hideDelete && actor?.id !== user.id}
                    onDelete={
                      scope.hideDelete
                        ? undefined
                        : () =>
                            confirmDelete({
                              message: t(`${keys}.confirmDelete`),
                              successMessage: t(`${keys}.deleted`),
                              path: `${scope.apiBase}/${user.id}`,
                              queryKey: [scope.queryKey],
                            })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}
