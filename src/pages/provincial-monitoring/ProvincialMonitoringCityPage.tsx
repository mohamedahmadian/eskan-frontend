import { CalendarDays, Download, MapPin, Tent, UsersRound } from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
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
import { EntityRowActions, TableCard } from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useListParams } from '../../hooks/useListParams'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, persianYearOptions } from '../../lib/datetime'
import type { ProvincialMonitoringCityDetail } from '../../types/app'
import { IranMonitoringMap } from './IranMonitoringMap'
import {
  downloadMonitoringExcel,
  MonitoringBarChart,
  MonitoringStatTiles,
  parseMonitorYear,
  yearQuery,
} from './monitoringShared'

export function ProvincialMonitoringCityPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { cityId } = useParams()
  const { searchParams, setParams } = useListParams()
  const year = parseMonitorYear(searchParams.get('year'), currentPersianYear())
  const [exporting, setExporting] = useState(false)

  const query = useQuery({
    queryKey: ['provincial-monitoring', 'city', cityId, year],
    enabled: Boolean(cityId),
    queryFn: async () => {
      const { data } = await api.get<ProvincialMonitoringCityDetail>(
        `/provincial-monitoring/cities/${cityId}`,
        { params: { year } },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })

  const data = query.data

  async function exportExcel() {
    if (!cityId) return
    setExporting(true)
    try {
      await downloadMonitoringExcel(
        `/provincial-monitoring/cities/${cityId}/export?year=${year}`,
        'provincial-monitoring-caravans.xlsx',
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
        title={t('provincialMonitoring.cityDetails')}
        subtitle={<EntityNameSubtitle name={data.city.nameFa} icon={MapPin} />}
        backTo={`/provincial-monitoring/provinces/${data.city.province.id}?${yearQuery(year)}`}
      />
      <div className="mb-4 space-y-3">
        <div className={`flex max-w-xl flex-wrap items-end gap-3 p-4 ${cardClassName}`}>
          <div className="min-w-56 flex-1">
            <FormField icon={CalendarDays} label={t('provincialMonitoring.year')} htmlFor="pm-city-year">
              <SearchSelect
                id="pm-city-year"
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
        <FormCard icon={MapPin} title={data.city.nameFa} subtitle={data.city.province.nameFa}>
          <IranMonitoringMap
            provinces={[]}
            cities={[
              {
                ...data.totals,
                id: data.city.id,
                nameFa: data.city.nameFa,
                nameEn: data.city.nameEn,
                code: data.city.code,
                latitude: data.city.latitude,
                longitude: data.city.longitude,
                provinceId: data.city.province.id,
                provinceNameFa: data.city.province.nameFa,
                isProvinceCapital: data.city.isProvinceCapital,
              },
            ]}
            metric="pilgrims"
            showCities
            locale={locale}
            focus={{
              latitude: data.city.latitude,
              longitude: data.city.longitude,
              zoom: 10,
            }}
            onProvinceClick={() => undefined}
            onCityClick={() => undefined}
          />
        </FormCard>
        <div className={`${cardClassName} p-5 sm:p-6`}>
          <MonitoringBarChart
            title={t('provincialMonitoring.byCaravan')}
            icon={Tent}
            data={data.caravans.map((item) => ({
              name: item.name,
              pilgrims: item.reservationPilgrims.total,
            }))}
          />
        </div>
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
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.colActive')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.capacity')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.reservationPilgrims')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.caravans.map((caravan) => (
                    <tr key={caravan.id} className="border-t border-line">
                      <td className="px-4 py-3 text-start font-medium">{caravan.name}</td>
                      <td className="px-4 py-3 text-start">
                        {caravan.active
                          ? t('provincialMonitoring.activeYes')
                          : t('provincialMonitoring.activeNo')}
                      </td>
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
                    <th className="px-4 py-3 text-start font-medium">{t('provincialMonitoring.reservationPilgrims')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((group) => (
                    <tr key={group.id} className="border-t border-line">
                      <td className="px-4 py-3 text-start font-medium">{group.name}</td>
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
