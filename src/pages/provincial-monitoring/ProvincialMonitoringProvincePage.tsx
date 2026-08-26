import { CalendarDays, Download, Map, MapPin, Tent, UsersRound } from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  EntityNameSubtitle,
  FormField,
  LoadingState,
  PageHeader,
  cardClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormEmptyHint, FormSectionTitle } from '../../components/ui/FormLayout'
import {
  EntityRowActions,
  SortableTh,
  TableCard,
  nextSortState,
  type SortDir,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import type { ProvincialMonitoringProvinceDetail } from '../../types/app'
import { IranMonitoringMap } from './IranMonitoringMap'
import {
  downloadMonitoringExcel,
  MonitoringBarChart,
  MonitoringStatTiles,
  parseMonitorYear,
  yearQuery,
} from './monitoringShared'

function sortRows<T>(
  rows: T[],
  sortBy: string,
  sortDir: SortDir | '',
  valueOf: (row: T, key: string) => string | number,
) {
  if (!sortBy || !sortDir) return rows
  return [...rows].sort((a, b) => {
    const av = valueOf(a, sortBy)
    const bv = valueOf(b, sortBy)
    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'fa')
    return sortDir === 'asc' ? cmp : -cmp
  })
}

export function ProvincialMonitoringProvincePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { provinceId } = useParams()
  const navigate = useNavigate()
  const { searchParams, setParams } = useListParams()
  const year = parseMonitorYear(searchParams.get('year'), currentPersianYear())
  const [exporting, setExporting] = useState(false)
  const [sortBy, setSortBy] = useState('reservationPilgrims')
  const [sortDir, setSortDir] = useState<SortDir | ''>('desc')

  const query = useQuery({
    queryKey: ['provincial-monitoring', 'province', provinceId, year],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<ProvincialMonitoringProvinceDetail>(
        `/provincial-monitoring/provinces/${provinceId}`,
        { params: { year } },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })

  const data = query.data
  const cities = useMemo(
    () =>
      sortRows(data?.cities ?? [], sortBy, sortDir, (row, key) => {
        if (key === 'nameFa') return row.nameFa
        if (key === 'caravanCount') return row.caravanCount
        if (key === 'groupCount') return row.groupCount
        if (key === 'residentPilgrims') return row.residentPilgrims
        return row.reservationPilgrims.total
      }),
    [data, sortBy, sortDir],
  )
  const chartData = useMemo(
    () =>
      (data?.cities ?? []).map((item) => ({
        id: item.id,
        name: item.nameFa,
        pilgrims: item.reservationPilgrims.total,
      })),
    [data],
  )

  function onSort(column: string) {
    const next = nextSortState(column, sortBy, sortDir)
    setSortBy(next.sortBy ?? '')
    setSortDir(next.sortDir ?? '')
  }

  async function exportExcel() {
    if (!provinceId) return
    setExporting(true)
    try {
      await downloadMonitoringExcel(
        `/provincial-monitoring/provinces/${provinceId}/export?year=${year}`,
        'provincial-monitoring-cities.xlsx',
      )
      toast.success(t('provincialMonitoring.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(false)
    }
  }

  if (!data) {
    return <LoadingState />
  }

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('provincialMonitoring.provinceDetails')}
        subtitle={<EntityNameSubtitle name={data.province.nameFa} icon={Map} />}
        backTo={`/provincial-monitoring?${yearQuery(year)}`}
      />
      <div className="mb-4 space-y-3">
        <div className={`flex max-w-xl flex-wrap items-end gap-3 p-4 ${cardClassName}`}>
          <div className="min-w-56 flex-1">
            <FormField icon={CalendarDays} label={t('provincialMonitoring.year')} htmlFor="pm-province-year">
              <SearchSelect
                id="pm-province-year"
                value={String(year)}
                onChange={(next) => setParams({ year: next || undefined })}
                options={persianYearOptions(locale, year)}
                placeholder={t('provincialMonitoring.year')}
              />
            </FormField>
          </div>
          <Button type="button" variant="ghost" onClick={exportExcel} disabled={exporting}>
            <Download className="size-4" aria-hidden />
            {exporting
              ? t('provincialMonitoring.downloadingExcel')
              : t('provincialMonitoring.downloadExcel')}
          </Button>
        </div>
        <MonitoringStatTiles totals={data.totals} />
        <FormCard icon={Map} title={data.province.nameFa} subtitle={t('provincialMonitoring.mapHint')}>
          <IranMonitoringMap
            provinces={[
              {
                ...data.totals,
                id: data.province.id,
                nameFa: data.province.nameFa,
                nameEn: data.province.nameEn,
                code: data.province.code,
                latitude: data.province.latitude,
                longitude: data.province.longitude,
              },
            ]}
            cities={data.cities.map((city) => ({
              ...city,
              provinceId: data.province.id,
              provinceNameFa: data.province.nameFa,
              isProvinceCapital: false,
            }))}
            metric="pilgrims"
            showCities
            locale={locale}
            focus={{
              latitude: data.province.latitude,
              longitude: data.province.longitude,
              zoom: 8,
            }}
            onProvinceClick={() => undefined}
            onCityClick={(id) =>
              navigate(`/provincial-monitoring/cities/${id}?${yearQuery(year)}`)
            }
          />
        </FormCard>
        <div className={`${cardClassName} p-5 sm:p-6`}>
          <MonitoringBarChart
            title={t('provincialMonitoring.byCity')}
            icon={MapPin}
            data={chartData}
            onItemClick={(item) =>
              navigate(`/provincial-monitoring/cities/${item.key}?${yearQuery(year)}`)
            }
          />
        </div>
        <FormSectionTitle icon={MapPin}>{t('provincialMonitoring.byCity')}</FormSectionTitle>
        <TableCard empty={t('provincialMonitoring.emptyCities')} hasRows={cities.length > 0}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-cream-50 text-ink-600">
                <tr>
                  <SortableTh column="nameFa" label={t('provincialMonitoring.colName')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  <SortableTh column="caravanCount" label={t('provincialMonitoring.caravans')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  <SortableTh column="groupCount" label={t('provincialMonitoring.groups')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  <SortableTh column="reservationPilgrims" label={t('provincialMonitoring.reservationPilgrims')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  <SortableTh column="residentPilgrims" label={t('provincialMonitoring.residentPilgrims')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => (
                  <tr key={city.id} className="border-t border-line">
                    <td className="px-4 py-3 text-start font-medium">{city.nameFa}</td>
                    <td className="px-4 py-3 text-start">{formatNumber(city.caravanCount, locale)}</td>
                    <td className="px-4 py-3 text-start">{formatNumber(city.groupCount, locale)}</td>
                    <td className="px-4 py-3 text-start">{formatNumber(city.reservationPilgrims.total, locale)}</td>
                    <td className="px-4 py-3 text-start">{formatNumber(city.residentPilgrims, locale)}</td>
                    <td className="px-4 py-3 text-start">
                      <EntityRowActions
                        viewTo={`/provincial-monitoring/cities/${city.id}?${yearQuery(year)}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
        <FormSectionTitle icon={Tent}>{t('provincialMonitoring.byCaravan')}</FormSectionTitle>
        {data.caravans.length === 0 ? (
          <FormEmptyHint>{t('provincialMonitoring.emptyCaravans')}</FormEmptyHint>
        ) : (
          <TableCard empty={t('provincialMonitoring.emptyCaravans')} hasRows>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-cream-50 text-ink-600">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.colName')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.colCity')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.capacity')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.reservationPilgrims')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.caravans.map((caravan) => (
                    <tr key={caravan.id} className="border-t border-line">
                      <td className="px-4 py-3 text-start font-medium">{caravan.name}</td>
                      <td className="px-4 py-3 text-start">{caravan.cityNameFa}</td>
                      <td className="px-4 py-3 text-start">{formatNumber(caravan.capacity.total, locale)}</td>
                      <td className="px-4 py-3 text-start">{formatNumber(caravan.reservationPilgrims.total, locale)}</td>
                      <td className="px-4 py-3 text-start">
                        <EntityRowActions viewTo={`/caravans/${caravan.id}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )}
        <FormSectionTitle icon={UsersRound}>{t('provincialMonitoring.byGroup')}</FormSectionTitle>
        {data.groups.length === 0 ? (
          <FormEmptyHint>{t('provincialMonitoring.emptyGroups')}</FormEmptyHint>
        ) : (
          <TableCard empty={t('provincialMonitoring.emptyGroups')} hasRows rowClick={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-cream-50 text-ink-600">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.colName')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.colCity')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.reservationPilgrims')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((group) => (
                    <tr key={group.id} className="border-t border-line">
                      <td className="px-4 py-3 text-start font-medium">{group.name}</td>
                      <td className="px-4 py-3 text-start">{group.cityNameFa}</td>
                      <td className="px-4 py-3 text-start">{formatNumber(group.reservationPilgrims.total, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )}
      </div>
    </div>
  )
}
