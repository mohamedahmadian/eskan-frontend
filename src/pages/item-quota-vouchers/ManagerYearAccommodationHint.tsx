import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Building2, MapPin, Mars, Venus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import type { Accommodation } from '../../types/app'

function CapacityChip({
  icon: Icon,
  label,
  value,
  formatted,
}: {
  icon: typeof Mars
  label: string
  value: number
  formatted: string
}) {
  if (value <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-teal-100">
      <Icon className="size-3.5 text-teal-600" aria-hidden />
      {label}: {formatted}
    </span>
  )
}

export function ManagerYearAccommodationHint({ managerId }: { managerId: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const year = currentPersianYear()
  const query = useQuery({
    queryKey: ['accommodations', 'for-manager', managerId, year],
    enabled: Boolean(managerId),
    queryFn: async () => {
      const { data } = await api.get<Accommodation[]>('/accommodations', {
        params: { year, managerUserId: managerId },
      })
      return data
    },
  })

  if (!managerId || query.isLoading || query.isError) {
    return null
  }

  if (!query.data?.length) {
    return (
      <aside
        className="rounded-[22px] border-2 border-gold-100 bg-gradient-to-b from-gold-50 via-gold-50/80 to-white p-4"
        role="status"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <p className="pt-1.5 text-sm font-medium leading-7 text-ink-900">
            {t('itemQuotaVouchers.noAccommodationThisYear')}
          </p>
        </div>
      </aside>
    )
  }

  return (
    <div className="space-y-2">
      {query.data.map((item) => {
        const male = formatNumber(item.maleCapacity, locale)
        const female = formatNumber(item.femaleCapacity, locale)
        return (
          <aside
            key={item.id}
            className="rounded-[22px] border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white">
                <Building2 className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                {item.maleCapacity > 0 || item.femaleCapacity > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    <CapacityChip
                      icon={Mars}
                      label={t('accommodations.maleCapacity')}
                      value={item.maleCapacity}
                      formatted={male}
                    />
                    <CapacityChip
                      icon={Venus}
                      label={t('accommodations.femaleCapacity')}
                      value={item.femaleCapacity}
                      formatted={female}
                    />
                  </div>
                ) : null}
                {item.address ? (
                  <p className="flex items-start gap-1.5 text-xs leading-6 text-ink-500">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{item.address}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        )
      })}
    </div>
  )
}

export function VoucherManagerCell({
  name,
  accommodationName,
}: {
  name: string
  accommodationName?: string | null
}) {
  return (
    <div>
      <div>{name}</div>
      {accommodationName ? (
        <div className="mt-0.5 text-xs text-ink-500">{accommodationName}</div>
      ) : null}
    </div>
  )
}
