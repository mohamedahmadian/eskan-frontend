import { Filter, Plus, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PaginationBar, TableCard, EntityRowActions } from '../../components/ui/ListControls'
import {
  AppForm,
  Button,
  FormField,
  PageHeader,
  cardClassName,
  fieldClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { City, Country, Paginated, Province, WalkingRoute } from '../../types/app'

export function WalkingRoutesListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const originCountryId = searchParams.get('originCountryId') ?? ''
  const provinceId = searchParams.get('provinceId') ?? ''
  const cityId = searchParams.get('cityId') ?? ''

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries')
      return data
    },
  })

  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', iranId],
    enabled: Boolean(iranId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: iranId },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId },
      })
      return data
    },
  })

  const query = useQuery({
    queryKey: ['walking-routes', 'list', q, originCountryId, provinceId, cityId, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(originCountryId ? { originCountryId } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
        },
      })
      return data
    },
  })

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const hasFilter = Boolean(q || originCountryId || provinceId || cityId)
  const emptyMessage = hasFilter ? t('walkingRoutes.noResults') : t('walkingRoutes.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.walkingRoutes')}
        subtitle={t('walkingRoutes.subtitle')}
        action={
          <Link to="/base-info/walking-routes/new">
            <Button>
              <Plus className="size-4" />
              {t('walkingRoutes.create')}
            </Button>
          </Link>
        }
      />
      <AppForm onSubmit={onSearch} className={`mb-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 ${cardClassName}`}>
        <FormField icon={Filter} label={t('walkingRoutes.originCountry')} htmlFor="route-origin">
          <SearchSelect
            id="route-origin"
            value={originCountryId}
            placeholder={t('walkingRoutes.allOriginCountries')}
            onChange={(next) =>
              setParams({ originCountryId: next || undefined }, { resetPage: true })
            }
            options={[
              { value: '', label: t('walkingRoutes.allOriginCountries') },
              ...(countries.data ?? []).map((country) => ({
                value: country.id,
                label: name(country),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Filter} label={t('geo.province')} htmlFor="route-province">
          <SearchSelect
            id="route-province"
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
                label: name(province),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Filter} label={t('geo.city')} htmlFor="route-city">
          <SearchSelect
            id="route-city"
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
                label: name(city),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Search} label={t('walkingRoutes.search')} htmlFor="route-search">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="route-search"
              className={fieldClassName}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('walkingRoutes.searchPlaceholder')}
            />
            <Button type="submit" className="sm:min-w-28">
              <Search className="size-4" />
              {t('common.search')}
            </Button>
          </div>
        </FormField>
      </AppForm>
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.entryBorder')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.originCountries')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.distanceToMashhadKm')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('walkingRoutes.stageCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{name(item.entryBorderCity)}</td>
                <td className="px-4 py-3">
                  {item.originCountries.map((country) => name(country)).join('، ') || '—'}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(item.distanceToMashhadKm, locale)} {t('walkingRoutes.km')}
                </td>
                <td className="px-4 py-3">{formatNumber(item.stages.length, locale)}</td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/base-info/walking-routes/${item.id}`}
                    editTo={`/base-info/walking-routes/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('walkingRoutes.confirmDelete'),
                        successMessage: t('walkingRoutes.deleted'),
                        path: `/walking-routes/${item.id}`,
                        queryKey: ['walking-routes'],
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
