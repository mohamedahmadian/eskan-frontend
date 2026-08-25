import { Filter, Plus, Shield, Tent } from 'lucide-react'
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
import type {
  City,
  ManagedCaravan,
  ManagedUser,
  Paginated,
  Province,
  RoleOption,
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
              <div className="flex items-center gap-2 border-b border-teal-50 bg-gradient-to-l from-mint-50 via-white to-teal-50 px-3 py-2">
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
  const roleCodes = scope.showRoleFilter ? parseRoleCodes(searchParams) : []
  const provinceId = scope.showHeadquartersAreas ? (searchParams.get('provinceId') ?? '') : ''
  const cityId = scope.showHeadquartersAreas ? (searchParams.get('cityId') ?? '') : ''
  const keys = scope.i18nPrefix
  const roles = useQuery({
    queryKey: ['roles'],
    enabled: Boolean(scope.showRoleFilter),
    queryFn: async () => {
      const { data } = await api.get<RoleOption[]>('/roles')
      return data
    },
  })
  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    enabled: Boolean(scope.showHeadquartersAreas),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces')
      return data
    },
  })
  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(scope.showHeadquartersAreas && provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', { params: { provinceId } })
      return data
    },
  })
  const roleCodesKey = roleCodes.join(',')
  const query = useQuery({
    queryKey: [scope.queryKey, q, page, roleCodesKey, provinceId, cityId, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>(scope.apiBase, {
        params: {
          q: q || undefined,
          page,
          roleCodes: roleCodesKey || undefined,
          provinceId: provinceId || undefined,
          cityId: cityId || undefined,
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtered = Boolean(q || roleCodes.length || provinceId || cityId)
  const hasExtraFilters = Boolean(scope.showHeadquartersAreas || scope.showRoleFilter)

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
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t(`${keys}.searchPlaceholder`)}
        filtersActive={Boolean(roleCodes.length || provinceId || cityId)}
        extraClassName={
          scope.showRoleFilter && !scope.showHeadquartersAreas
            ? 'sm:grid-cols-1'
            : 'sm:grid-cols-2'
        }
        extra={
          hasExtraFilters ? (
            <>
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
