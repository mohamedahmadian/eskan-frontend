import { Filter, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { PaginationBar, SearchBar, TableCard, EntityRowActions, FilterPair } from '../../components/ui/ListControls'
import {
  Button,
  FormField,
  PageHeader,
  listShellClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatRoles } from '../../lib/roles'
import { useGeoName } from '../../lib/geo'
import type { City, ManagedUser, Paginated, Province, RoleOption } from '../../types/app'
import type { RoleUserScope } from './user-scopes'

export function RoleUsersListPage({ scope }: { scope: RoleUserScope }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user: actor } = useAuth()
  const { confirmDelete } = useConfirmDelete()
  const geoName = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } = useListParams()
  const roleCode = scope.showRoleFilter ? (searchParams.get('roleCode') ?? '') : ''
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
  const query = useQuery({
    queryKey: [scope.queryKey, q, page, roleCode, provinceId, cityId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ManagedUser>>(scope.apiBase, {
        params: {
          q: q || undefined,
          page,
          roleCode: roleCode || undefined,
          provinceId: provinceId || undefined,
          cityId: cityId || undefined,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const filtered = Boolean(q || roleCode || provinceId || cityId)
  const hasExtraFilters = Boolean(scope.showHeadquartersAreas || scope.showRoleFilter)

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
        filtersActive={Boolean(roleCode || provinceId || cityId)}
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
                <FormField icon={Filter} label={t('users.filterRoles')} htmlFor="user-role-filter">
                  <SearchSelect
                    id="user-role-filter"
                    value={roleCode}
                    placeholder={t('users.allRoles')}
                    onChange={(next) =>
                      setParams({ roleCode: next || undefined }, { resetPage: true })
                    }
                    options={[
                      { value: '', label: t('users.allRoles') },
                      ...(roles.data ?? []).map((role) => ({
                        value: role.code,
                        label: t(role.nameKey),
                      })),
                    ]}
                  />
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
              <th className="px-4 py-3 text-start font-medium">{t('users.fullName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('users.username')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('users.phone')}</th>
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
                <th className="px-4 py-3 text-start font-medium">{t('geo.city')}</th>
              )}
              <th className="px-4 py-3 text-start font-medium">{t('users.roles')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('users.status')}</th>
              {scope.showAccommodations ? (
                <th className="px-4 py-3 text-start font-medium">
                  {t('accommodationManagers.accommodationCount')}
                </th>
              ) : null}
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-4 py-3">{user.fullName}</td>
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">{user.phone ?? '—'}</td>
                {scope.showHeadquartersAreas ? (
                  <>
                    <td className="px-4 py-3">{joinNames(user.representedProvinces)}</td>
                    <td className="px-4 py-3">{joinNames(user.representedCities)}</td>
                  </>
                ) : (
                  <td className="px-4 py-3">{user.city ? geoName(user.city) : '—'}</td>
                )}
                <td className="px-4 py-3">{formatRoles(user.roles, t)}</td>
                <td className="px-4 py-3">{t(`userStatuses.${user.status}`)}</td>
                {scope.showAccommodations ? (
                  <td className="px-4 py-3">
                    {formatNumber(user.accommodationCount ?? 0, locale)}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`${scope.listPath}/${user.id}`}
                    editTo={`${scope.listPath}/${user.id}/edit`}
                    canDelete={actor?.id !== user.id}
                    onDelete={() =>
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
