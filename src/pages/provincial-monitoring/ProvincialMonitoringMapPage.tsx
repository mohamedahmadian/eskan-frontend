import { CalendarDays, ChartColumn, Download, Map, MapPin, Search } from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  FormField,
  PageHeader,
  ToggleField,
  cardClassName,
  listShellClassName,
  LoadingState,
} from '../../components/ui/Form'
import { FormCard } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { useAuth } from '../../auth/AuthProvider'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, persianYearOptions } from '../../lib/datetime'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import type { ProvincialMonitoringMap } from '../../types/app'
import { IranMonitoringMap, type MapMetric } from './IranMonitoringMap'
import {
  downloadMonitoringExcel,
  MonitoringBarChart,
  MonitoringStatTiles,
  parseMonitorYear,
  yearQuery,
} from './monitoringShared'

export function ProvincialMonitoringMapPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const { user } = useAuth()
  const canNational = hasMenuAccess('/national-monitoring', user?.modules ?? [])
  const { searchParams, setParams } = useListParams()
  const currentYear = currentPersianYear()
  const yearFromUrl = searchParams.get('year')
  const year = parseMonitorYear(yearFromUrl, currentYear)
  const [metric, setMetric] = useState<MapMetric>('pilgrims')
  const [showCities, setShowCities] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (yearFromUrl) return
    setParams({ year: String(currentYear) })
  }, [currentYear, setParams, yearFromUrl])

  const query = useQuery({
    queryKey: ['provincial-monitoring', year],
    queryFn: async () => {
      const { data } = await api.get<ProvincialMonitoringMap>(
        '/provincial-monitoring',
        { params: { year } },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })

  const data = query.data
  const provinceOptions = useMemo(
    () =>
      (data?.lookup.provinces ?? []).map((item) => ({
        value: item.id,
        label: item.nameFa,
      })),
    [data],
  )
  const cityOptions = useMemo(
    () =>
      (data?.lookup.cities ?? []).map((item) => ({
        value: item.id,
        label: `${item.nameFa} — ${item.provinceNameFa}`,
      })),
    [data],
  )
  const chartData = useMemo(
    () =>
      (data?.provinces ?? [])
        .filter(
          (item) => item.reservationPilgrims.total > 0 || item.caravanCount > 0,
        )
        .slice(0, 20)
        .map((item) => ({
          id: item.id,
          name: item.nameFa,
          pilgrims: item.reservationPilgrims.total,
        })),
    [data],
  )

  async function exportExcel() {
    setExporting(true)
    try {
      await downloadMonitoringExcel(
        `/provincial-monitoring/export?year=${year}`,
        'provincial-monitoring.xlsx',
      )
      toast.success(t('provincialMonitoring.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('menus.provincialMonitoring')}
        subtitle={t('provincialMonitoring.subtitle')}
      />
      <div className="space-y-6">
        <div className={`space-y-4 p-4 ${cardClassName}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField icon={CalendarDays} label={t('provincialMonitoring.year')} htmlFor="pm-year">
            <SearchSelect
              id="pm-year"
              value={String(year)}
              onChange={(next) => setParams({ year: next || undefined })}
              options={persianYearOptions(locale, year)}
              placeholder={t('provincialMonitoring.year')}
            />
          </FormField>
          <FormField icon={Map} label={t('provincialMonitoring.selectProvince')} htmlFor="pm-province">
            <SearchSelect
              id="pm-province"
              value=""
              onChange={(next) => {
                if (!next) return
                navigate(`/provincial-monitoring/provinces/${next}?${yearQuery(year)}`)
              }}
              options={provinceOptions}
              placeholder={t('provincialMonitoring.selectProvince')}
            />
          </FormField>
          <FormField icon={MapPin} label={t('provincialMonitoring.selectCity')} htmlFor="pm-city">
            <SearchSelect
              id="pm-city"
              value=""
              onChange={(next) => {
                if (!next) return
                navigate(`/provincial-monitoring/cities/${next}?${yearQuery(year)}`)
              }}
              options={cityOptions}
              placeholder={t('provincialMonitoring.selectCity')}
            />
          </FormField>
          <FormField icon={Search} label={t('provincialMonitoring.mapMetric')}>
            <SearchSelect
              id="pm-metric"
              value={metric}
              onChange={(next) => setMetric((next as MapMetric) || 'pilgrims')}
              options={[
                { value: 'pilgrims', label: t('provincialMonitoring.reservationPilgrims') },
                { value: 'caravans', label: t('provincialMonitoring.caravans') },
                { value: 'residents', label: t('provincialMonitoring.residentPilgrims') },
              ]}
              placeholder={t('provincialMonitoring.mapMetric')}
            />
          </FormField>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canNational ? (
              <Link to={`/national-monitoring?${yearQuery(year)}`}>
                <Button type="button" variant="soft">
                  <ChartColumn className="size-4" aria-hidden />
                  {t('provincialMonitoring.openNational')}
                </Button>
              </Link>
            ) : null}
            <Button type="button" variant="ghost" onClick={exportExcel} disabled={exporting}>
              <Download className="size-4" aria-hidden />
              {exporting
                ? t('provincialMonitoring.downloadingExcel')
                : t('provincialMonitoring.downloadExcel')}
            </Button>
          </div>
        </div>
        {query.isLoading ? (
          <LoadingState />
        ) : data ? (
          <>
            <MonitoringStatTiles totals={data.totals} />
            <FormCard
              icon={Map}
              title={t('provincialMonitoring.mapTitle')}
              subtitle={t('provincialMonitoring.mapHint')}
              action={
                <ToggleField
                  checked={showCities}
                  onChange={setShowCities}
                  onLabel={t('provincialMonitoring.citiesOn')}
                  offLabel={t('provincialMonitoring.citiesOff')}
                />
              }
            >
              <IranMonitoringMap
                provinces={data.provinces}
                cities={data.cities}
                metric={metric}
                showCities={showCities}
                locale={locale}
                onProvinceClick={(id) =>
                  navigate(`/provincial-monitoring/provinces/${id}?${yearQuery(year)}`)
                }
                onCityClick={(id) =>
                  navigate(`/provincial-monitoring/cities/${id}?${yearQuery(year)}`)
                }
              />
            </FormCard>
            <div className={`${cardClassName} p-5 sm:p-6`}>
              <MonitoringBarChart
                title={t('provincialMonitoring.byProvince')}
                icon={Map}
                data={chartData}
                onItemClick={(item) =>
                  navigate(`/provincial-monitoring/provinces/${item.key}?${yearQuery(year)}`)
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
