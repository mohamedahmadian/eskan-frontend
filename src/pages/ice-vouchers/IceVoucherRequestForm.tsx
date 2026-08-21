import { AlignLeft, Building2, CalendarDays, Coins, Hash } from 'lucide-react'
import { DateObject } from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, cardClassName, fieldClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, formatNumber, toIsoDateOnly } from '../../lib/datetime'
import type {
  IceVoucher,
  IceVoucherAccommodationOption,
  IceVoucherQuota,
  IceVoucherSettings,
} from '../../types/app'

export type IceVoucherRequestPayload = {
  accommodationId: string
  requestedAt: string
  moldCount: number
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function todayIso() {
  return toIsoDateOnly(new DateObject({ calendar: gregorian }))
}

function clampIsoDate(value: string, min?: string | null, max?: string | null) {
  if (min && value < min) return min
  if (max && value > max) return max
  return value
}

export function IceVoucherRequestForm({
  accommodations,
  initial,
  onSubmit,
}: {
  accommodations: IceVoucherAccommodationOption[]
  initial?: IceVoucher
  onSubmit: (payload: IceVoucherRequestPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    accommodationId:
      initial?.accommodationId ?? (accommodations.length === 1 ? accommodations[0].id : ''),
    requestedAt: initial?.requestedAt ?? todayIso(),
    moldCount: initial ? String(initial.moldCount) : '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const settings = useQuery({
    queryKey: ['ice-vouchers', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherSettings>('/ice-vouchers/settings')
      return data
    },
  })

  const activityStartDate = settings.data?.activityStartDate ?? null
  const activityEndDate = settings.data?.activityEndDate ?? null

  useEffect(() => {
    setValues((current) => {
      const next = clampIsoDate(current.requestedAt, activityStartDate, activityEndDate)
      return next === current.requestedAt ? current : { ...current, requestedAt: next }
    })
  }, [activityStartDate, activityEndDate])

  const quota = useQuery({
    queryKey: ['ice-vouchers', 'quota', values.accommodationId],
    enabled: Boolean(values.accommodationId),
    queryFn: async () => {
      const { data } = await api.get<IceVoucherQuota>('/ice-vouchers/quota', {
        params: { accommodationId: values.accommodationId },
      })
      return data
    },
  })

  const moldCount = Number(values.moldCount)
  const costPerMold = initial?.costPerMold ?? quota.data?.costPerMold
  const estimatedCost =
    costPerMold != null && Number.isFinite(moldCount) && moldCount > 0
      ? moldCount * costPerMold
      : null

  const accommodationOptions = useMemo(() => {
    const extras =
      initial && !accommodations.some((item) => item.id === initial.accommodationId)
        ? [
            {
              id: initial.accommodationId,
              name: initial.accommodation.name,
              managerName: initial.accommodationManager.fullName,
            },
          ]
        : []
    const items = [
      ...extras,
      ...accommodations.map((item) => ({
        id: item.id,
        name: item.name,
        managerName: item.managerName,
      })),
    ]
    return [
      { value: '', label: t('iceVouchers.selectAccommodation') },
      ...items.map((item) => ({
        value: item.id,
        label: item.managerName ? `${item.name} - ${item.managerName}` : item.name,
      })),
    ]
  }, [accommodations, initial, t])

  function notifyOverMax(max: number) {
    toast.error(t('iceVouchers.maxMoldHint', { max: formatNumber(max, locale) }), {
      id: 'ice-voucher-max-mold',
    })
  }

  function onMoldCountChange(next: string) {
    set('moldCount', next)
    if (quota.data && Number(next) > quota.data.maxMoldCount) {
      notifyOverMax(quota.data.maxMoldCount)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.requestedAt) {
      toast.error(t('iceVouchers.requestedAtRequired'))
      return
    }
    if (
      (activityStartDate && values.requestedAt < activityStartDate) ||
      (activityEndDate && values.requestedAt > activityEndDate)
    ) {
      toast.error(t('iceVouchers.requestedAtOutOfRange'))
      return
    }
    if (quota.data && Number(values.moldCount) > quota.data.maxMoldCount) {
      notifyOverMax(quota.data.maxMoldCount)
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        accommodationId: values.accommodationId,
        requestedAt: values.requestedAt,
        moldCount: Number(values.moldCount),
        description: emptyToNull(values.description),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppForm onSubmit={submit} className={`space-y-4 p-6 ${cardClassName}`}>
      <FormField icon={Building2} label={t('iceVouchers.accommodation')} htmlFor="accommodationId">
        <SearchSelect
          id="accommodationId"
          value={values.accommodationId}
          required
          onChange={(next) => set('accommodationId', next)}
          placeholder={t('iceVouchers.selectAccommodation')}
          options={accommodationOptions}
        />
      </FormField>
      <FormField icon={CalendarDays} label={t('iceVouchers.requestedAt')} htmlFor="requestedAt">
        <PersianDateField
          id="requestedAt"
          value={values.requestedAt || undefined}
          onChange={(iso) => set('requestedAt', iso ?? '')}
          minDate={activityStartDate ?? undefined}
          maxDate={activityEndDate ?? undefined}
        />
      </FormField>
      {quota.data ? (
        <div className="rounded-2xl border border-line bg-cream-50 px-4 py-3 text-sm text-ink-700">
          <p>
            {t('iceVouchers.capacity')}: {formatNumber(quota.data.capacity, locale)}
          </p>
          <p className="mt-1">
            {t('iceVouchers.maxMoldCount')}: {formatNumber(quota.data.maxMoldCount, locale)}
          </p>
          <p className="mt-1">
            {t('iceVouchers.unitCostPreview')}:{' '}
            {formatGroupedNumber(costPerMold ?? quota.data.costPerMold, locale)}{' '}
            {t('logisticsSettings.toman')}
          </p>
        </div>
      ) : null}
      <FormField icon={Hash} label={t('iceVouchers.moldCount')} htmlFor="moldCount">
        <input
          id="moldCount"
          type="number"
          min={1}
          className={fieldClassName}
          value={values.moldCount}
          onChange={(event) => onMoldCountChange(event.target.value)}
          required
        />
      </FormField>
      {estimatedCost != null ? (
        <div className="flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
          <Coins className="size-4 shrink-0" aria-hidden />
          <span>
            {t('iceVouchers.costPreview')}: {formatGroupedNumber(estimatedCost, locale)}{' '}
            {t('logisticsSettings.toman')}
          </span>
        </div>
      ) : null}
      <FormField icon={AlignLeft} label={t('iceVouchers.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={initial ? t('iceVouchers.saveEdit') : t('iceVouchers.save')}
        cancelLabel={t('iceVouchers.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
  )
}
