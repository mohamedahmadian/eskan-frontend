import { CalendarDays, Coins, Snowflake } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, parseDigitString } from '../../lib/datetime'
import type { IceVoucherSettings } from '../../types/app'

export function LogisticsSettingsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [moldsPer50Pilgrims, setMoldsPer50Pilgrims] = useState('')
  const [costPerMold, setCostPerMold] = useState('')
  const [activityStartDate, setActivityStartDate] = useState('')
  const [activityEndDate, setActivityEndDate] = useState('')

  const query = useQuery({
    queryKey: ['ice-vouchers', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherSettings>('/ice-vouchers/settings')
      return data
    },
  })

  useEffect(() => {
    if (!query.data) {
      return
    }
    setMoldsPer50Pilgrims(String(query.data.moldsPer50Pilgrims))
    setCostPerMold(String(query.data.costPerMold))
    setActivityStartDate(query.data.activityStartDate ?? '')
    setActivityEndDate(query.data.activityEndDate ?? '')
  }, [query.data])

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<IceVoucherSettings>('/ice-vouchers/settings', {
        moldsPer50Pilgrims: Number(moldsPer50Pilgrims),
        costPerMold: Number(costPerMold),
        activityStartDate: activityStartDate || null,
        activityEndDate: activityEndDate || null,
      })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ice-vouchers'] })
      toast.success(t('logisticsSettings.saved'))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (activityStartDate && activityEndDate && activityStartDate > activityEndDate) {
      toast.error(t('logisticsSettings.activityRangeInvalid'))
      return
    }
    save.mutate()
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('menus.logisticsSettings')} subtitle={t('logisticsSettings.subtitle')} />
      <FormCard
        icon={Snowflake}
        title={t('logisticsSettings.iceSection')}
        subtitle={t('logisticsSettings.iceSectionHint')}
      >
        <AppForm onSubmit={onSubmit} className={formCardBodyClassName}>
          <FormField
            icon={Snowflake}
            label={t('logisticsSettings.moldsPer50Pilgrims')}
            htmlFor="moldsPer50Pilgrims"
          >
            <input
              id="moldsPer50Pilgrims"
              type="number"
              min={0}
              className={fieldClassName}
              value={moldsPer50Pilgrims}
              onChange={(event) => setMoldsPer50Pilgrims(event.target.value)}
              required
            />
          </FormField>
          <FormField icon={Coins} label={t('logisticsSettings.costPerMold')} htmlFor="costPerMold">
            <div className="relative">
              <input
                id="costPerMold"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={`${fieldClassName} pe-16`}
                value={
                  costPerMold === '' ? '' : formatGroupedNumber(Number(costPerMold), locale)
                }
                onChange={(event) => setCostPerMold(parseDigitString(event.target.value))}
                required
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                {t('logisticsSettings.toman')}
              </span>
            </div>
          </FormField>
          <FormField
            icon={CalendarDays}
            label={t('logisticsSettings.activityStartDate')}
            htmlFor="activityStartDate"
          >
            <PersianDateField
              id="activityStartDate"
              value={activityStartDate || undefined}
              onChange={(iso) => setActivityStartDate(iso ?? '')}
              maxDate={activityEndDate || undefined}
            />
          </FormField>
          <FormField
            icon={CalendarDays}
            label={t('logisticsSettings.activityEndDate')}
            htmlFor="activityEndDate"
          >
            <PersianDateField
              id="activityEndDate"
              value={activityEndDate || undefined}
              onChange={(iso) => setActivityEndDate(iso ?? '')}
              minDate={activityStartDate || undefined}
            />
          </FormField>
          <p className="text-sm text-ink-500">{t('logisticsSettings.activityRangeHint')}</p>
          <FormActions
            submitLabel={t('logisticsSettings.save')}
            submitting={save.isPending || query.isLoading}
          />
        </AppForm>
      </FormCard>
    </div>
  )
}
