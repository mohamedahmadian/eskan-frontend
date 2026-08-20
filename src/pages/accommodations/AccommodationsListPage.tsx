import { BadgeCheck, CalendarDays, Download, MapPin, MapPinned, Mars, Plus, UserRound, Users, Venus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PaginationBar, SearchBar, TableCard, EntityRowActions, FilterPair } from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, persianYearOptions } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import {
  genderTypes,
  managementTypes,
  type Accommodation,
  type City,
  type GenderType,
  type ManagementType,
  type Paginated,
  type Province,
} from '../../types/app'

export function AccommodationsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { confirmDelete } = useConfirmDelete()
  const [exporting, setExporting] = useState(false)
  const genderType = (searchParams.get('genderType') ?? '') as GenderType | ''
  const managementType = (searchParams.get('managementType') ?? '') as ManagementType | ''
  const provinceId = searchParams.get('provinceId') ?? ''
  const cityId = searchParams.get('cityId') ?? ''
  const year = searchParams.get('year') ?? ''
  const hasManagerThisYear = searchParams.get('hasManagerThisYear') ?? ''

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces')
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

  const listParams = {
    page,
    ...(q ? { q } : {}),
    ...(genderType ? { genderType } : {}),
    ...(managementType ? { managementType } : {}),
    ...(provinceId ? { provinceId } : {}),
    ...(cityId ? { cityId } : {}),
    ...(year ? { year } : {}),
    ...(hasManagerThisYear ? { hasManagerThisYear } : {}),
  }

  const query = useQuery({
    queryKey: ['accommodations', q, genderType, managementType, provinceId, cityId, year, hasManagerThisYear, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Accommodation>>('/accommodations', {
        params: listParams,
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  async function downloadExcel() {
    setExporting(true)
    try {
      const { data } = await api.get<Blob>('/accommodations/export', {
        params: {
          ...(term.trim() || q ? { q: term.trim() || q } : {}),
          ...(genderType ? { genderType } : {}),
          ...(managementType ? { managementType } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(cityId ? { cityId } : {}),
          ...(year ? { year } : {}),
          ...(hasManagerThisYear ? { hasManagerThisYear } : {}),
        },
        responseType: 'blob',
      })
      const blob = data instanceof Blob ? data : new Blob([data])
      if (blob.type.includes('json')) {
        const text = await blob.text()
        const parsed = JSON.parse(text) as { message?: string }
        toast.error(parsed.message || t('common.error'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'accommodations.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('accommodations.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(false)
    }
  }

  const rows = query.data?.items ?? []
  const emptyMessage =
    q || genderType || managementType || provinceId || cityId || year || hasManagerThisYear
      ? t('accommodations.noResults')
      : t('accommodations.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.accommodations')}
        subtitle={t('accommodations.subtitle')}
        action={
          <Link to="/accommodations/new">
            <Button>
              <Plus className="size-4" />
              {t('accommodations.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="accommodation-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('common.search')}
        placeholder={t('accommodations.searchPlaceholder')}
        filtersActive={Boolean(genderType || managementType || provinceId || cityId || year || hasManagerThisYear)}
        extra={
          <>
            <FilterPair columns={3}>
              <FormField icon={CalendarDays} label={t('accommodations.year')} htmlFor="accommodation-year">
                <SearchSelect
                  id="accommodation-year"
                  value={year}
                  placeholder={t('accommodations.allYears')}
                  onChange={(next) => setParams({ year: next || undefined }, { resetPage: true })}
                  options={[
                    { value: '', label: t('accommodations.allYears') },
                    ...persianYearOptions(locale, year ? Number(year) : undefined),
                  ]}
                />
              </FormField>
              <FormField icon={MapPinned} label={t('geo.province')} htmlFor="accommodation-province">
                <SearchSelect
                  id="accommodation-province"
                  value={provinceId}
                  placeholder={t('geo.allProvinces')}
                  onChange={(next) =>
                    setParams({ provinceId: next || undefined, cityId: undefined }, { resetPage: true })
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
              <FormField icon={MapPin} label={t('geo.city')} htmlFor="accommodation-city">
                <SearchSelect
                  id="accommodation-city"
                  value={cityId}
                  disabled={!provinceId}
                  placeholder={t('geo.allCities')}
                  onChange={(next) => setParams({ cityId: next || undefined }, { resetPage: true })}
                  options={[
                    { value: '', label: t('geo.allCities') },
                    ...(cities.data ?? []).map((city) => ({
                      value: city.id,
                      label: name(city),
                    })),
                  ]}
                />
              </FormField>
            </FilterPair>
            <FilterPair columns={3}>
              <FormField icon={Users} label={t('accommodations.genderType')} htmlFor="accommodation-gender-type">
                <SearchSelect
                  id="accommodation-gender-type"
                  value={genderType}
                  placeholder={t('accommodations.allGenderTypes')}
                  onChange={(next) => setParams({ genderType: next || undefined }, { resetPage: true })}
                  options={[
                    { value: '', label: t('accommodations.allGenderTypes') },
                    ...Object.values(genderTypes).map((type) => ({
                      value: type,
                      label: t(`genderTypes.${type}`),
                    })),
                  ]}
                />
              </FormField>
              <FormField
                icon={UserRound}
                label={t('accommodations.currentYearManager')}
                htmlFor="accommodation-current-year-manager"
              >
                <SearchSelect
                  id="accommodation-current-year-manager"
                  value={hasManagerThisYear}
                  placeholder={t('accommodations.allManagerStatuses')}
                  onChange={(next) =>
                    setParams({ hasManagerThisYear: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('accommodations.allManagerStatuses') },
                    { value: 'true', label: t('accommodations.hasManager') },
                    { value: 'false', label: t('accommodations.noManager') },
                  ]}
                />
              </FormField>
              <FormField icon={BadgeCheck} label={t('accommodations.managementType')} htmlFor="accommodation-management-type">
                <SearchSelect
                  id="accommodation-management-type"
                  value={managementType}
                  placeholder={t('accommodations.allManagementTypes')}
                  onChange={(next) =>
                    setParams({ managementType: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('accommodations.allManagementTypes') },
                    ...Object.values(managementTypes).map((type) => ({
                      value: type,
                      label: t(`managementTypes.${type}`),
                    })),
                  ]}
                />
              </FormField>
            </FilterPair>
          </>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.type')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.managementType')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.genderType')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{t(`accommodationTypes.${item.type}`)}</td>
                <td className="px-4 py-3">{t(`managementTypes.${item.managementType}`)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span>{t(`genderTypes.${item.genderType}`)}</span>
                    <span className="flex flex-wrap items-center gap-3">
                      {item.genderType !== 'FEMALE' ? (
                        <span className="inline-flex items-center gap-1 text-ink-700">
                          <Mars className="size-4 text-sky-400" aria-hidden />
                          <span>{formatNumber(item.maleCapacity, locale)}</span>
                        </span>
                      ) : null}
                      {item.genderType !== 'MALE' ? (
                        <span className="inline-flex items-center gap-1 text-ink-700">
                          <Venus className="size-4 text-pink-400" aria-hidden />
                          <span>{formatNumber(item.femaleCapacity, locale)}</span>
                        </span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/accommodations/${item.id}`}
                    editTo={`/accommodations/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('accommodations.confirmDelete'),
                        successMessage: t('accommodations.deleted'),
                        path: `/accommodations/${item.id}`,
                        queryKey: ['accommodations'],
                      })
                    }
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
          <Button type="button" variant="ghost" onClick={() => void downloadExcel()} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? t('accommodations.downloadingExcel') : t('accommodations.downloadExcel')}
          </Button>
        }
      />
    </div>
  )
}
