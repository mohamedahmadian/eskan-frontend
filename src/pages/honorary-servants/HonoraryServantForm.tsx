import { AlignLeft, CalendarDays, Clock, HandHeart, Sparkles, Tags } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import {
  OTHER_HONORARY_SERVICE,
  honoraryServiceWeekDays,
  type HonoraryServant,
  type HonoraryServantPerson,
  type HonoraryServiceType,
  type HonoraryServiceWeekDay,
} from '../../types/app'
import { HonoraryServantPersonPicker } from './HonoraryServantPersonPicker'

export type HonoraryServantPayload = {
  userId: string
  serviceTypeId: string | null
  otherDescription: string | null
  startDate: string
  endDate: string
  weekDays: HonoraryServiceWeekDay[]
  startTime: string
  endTime: string
}

function ServiceDescriptionCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-5 py-4">
      <div
        className="pointer-events-none absolute -start-8 -top-10 size-28 rounded-full bg-teal-200/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-6 -bottom-12 size-24 rounded-full bg-mint-100/70"
        aria-hidden
      />
      <div className="relative flex gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">{title}</p>
          <p className="mt-1.5 text-sm leading-7 text-ink-700">{description}</p>
        </div>
      </div>
    </div>
  )
}

export function HonoraryServantForm({
  initial,
  self = false,
  onSubmit,
}: {
  initial?: HonoraryServant
  self?: boolean
  onSubmit: (payload: HonoraryServantPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [person, setPerson] = useState<HonoraryServantPerson | null>(
    initial?.user ??
      (self && user
        ? {
            id: user.id,
            fullName: user.fullName,
            firstName: '',
            lastName: '',
            nationalId: null,
            phone: null,
          }
        : null),
  )
  const [values, setValues] = useState({
    serviceKey: initial?.serviceTypeId ?? (initial?.otherDescription ? OTHER_HONORARY_SERVICE : ''),
    otherDescription: initial?.otherDescription ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    weekDays: initial?.weekDays ?? ([] as HonoraryServiceWeekDay[]),
    startTime: initial?.startTime ?? '08:00',
    endTime: initial?.endTime ?? '14:00',
  })

  const typesQuery = useQuery({
    queryKey: ['honorary-service-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<HonoraryServiceType[]>('/honorary-service-types')
      return data
    },
  })

  const types = typesQuery.data ?? []
  const selectedType = useMemo(
    () => types.find((item) => item.id === values.serviceKey) ?? null,
    [types, values.serviceKey],
  )
  const isOther = values.serviceKey === OTHER_HONORARY_SERVICE

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function toggleDay(day: HonoraryServiceWeekDay, checked: boolean) {
    setValues((current) => ({
      ...current,
      weekDays: checked
        ? honoraryServiceWeekDays.filter((item) => current.weekDays.includes(item) || item === day)
        : current.weekDays.filter((item) => item !== day),
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!person) {
      toast.error(t('honoraryServants.selectPerson'))
      return
    }
    if (!values.serviceKey) {
      toast.error(t('honoraryServants.selectService'))
      return
    }
    if (!values.startDate || !values.endDate) {
      toast.error(t('common.selectDate'))
      return
    }
    if (!values.weekDays.length) {
      toast.error(t('honoraryServants.pickDays'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        userId: person.id,
        serviceTypeId: isOther ? null : values.serviceKey,
        otherDescription: isOther ? values.otherDescription.trim() : null,
        startDate: values.startDate,
        endDate: values.endDate,
        weekDays: values.weekDays,
        startTime: values.startTime.slice(0, 5),
        endTime: values.endTime.slice(0, 5),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={HandHeart}
      title={initial ? initial.user.fullName : t('honoraryServants.create')}
      subtitle={
        initial ? undefined : self ? t('honoraryServants.applySubtitle') : t('honoraryServants.createSubtitle')
      }
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        {self ? null : (
          <HonoraryServantPersonPicker
            value={person}
            onChange={setPerson}
            locked={Boolean(initial)}
          />
        )}
        <input type="hidden" value={person?.id ?? ''} required />

        <FormSectionTitle icon={Tags}>{t('honoraryServants.service')}</FormSectionTitle>
        <FormField icon={Tags} label={t('honoraryServants.service')} htmlFor="serviceType">
          <SearchSelect
            id="serviceType"
            value={values.serviceKey}
            required
            onChange={(next) => set('serviceKey', next)}
            placeholder={t('honoraryServants.selectService')}
            options={[
              { value: '', label: t('honoraryServants.selectService') },
              ...types.map((item) => ({ value: item.id, label: item.name })),
              { value: OTHER_HONORARY_SERVICE, label: t('honoraryServants.otherService') },
            ]}
          />
        </FormField>
        {selectedType ? (
          <ServiceDescriptionCard title={selectedType.name} description={selectedType.description} />
        ) : null}
        {isOther ? (
          <FormField
            icon={AlignLeft}
            label={t('honoraryServants.otherDescription')}
            htmlFor="otherDescription"
          >
            <textarea
              id="otherDescription"
              className={fieldClassName}
              rows={4}
              required
              minLength={2}
              placeholder={t('honoraryServants.otherDescriptionHint')}
              value={values.otherDescription}
              onChange={(e) => set('otherDescription', e.target.value)}
            />
          </FormField>
        ) : null}

        <FormSectionTitle icon={CalendarDays}>{t('honoraryServants.schedule')}</FormSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={CalendarDays} label={t('honoraryServants.startDate')} htmlFor="startDate">
            <PersianDateField
              id="startDate"
              value={values.startDate || undefined}
              maxDate={values.endDate || undefined}
              onChange={(next) => set('startDate', next ?? '')}
            />
          </FormField>
          <FormField icon={CalendarDays} label={t('honoraryServants.endDate')} htmlFor="endDate">
            <PersianDateField
              id="endDate"
              value={values.endDate || undefined}
              minDate={values.startDate || undefined}
              onChange={(next) => set('endDate', next ?? '')}
            />
          </FormField>
        </div>
        <FormField icon={CalendarDays} label={t('honoraryServants.weekDays')}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {honoraryServiceWeekDays.map((day) => (
              <CheckboxField
                key={day}
                id={`week-day-${day}`}
                checked={values.weekDays.includes(day)}
                onChange={(checked) => toggleDay(day, checked)}
                label={t(`honoraryServiceWeekDays.${day}`)}
              />
            ))}
          </div>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Clock} label={t('honoraryServants.startTime')} htmlFor="startTime">
            <input
              id="startTime"
              type="time"
              required
              className={`${fieldClassName} digit-field`}
              value={values.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
          </FormField>
          <FormField icon={Clock} label={t('honoraryServants.endTime')} htmlFor="endTime">
            <input
              id="endTime"
              type="time"
              required
              className={`${fieldClassName} digit-field`}
              value={values.endTime}
              onChange={(e) => set('endTime', e.target.value)}
            />
          </FormField>
        </div>

        <FormActions
          submitLabel={initial ? t('honoraryServants.saveEdit') : t('honoraryServants.save')}
          cancelLabel={t('honoraryServants.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}

export function formatHonoraryHours(startTime: string, endTime: string, locale: string) {
  return localizeDigits(`${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`, locale)
}

export function formatHonoraryWeekDays(
  days: HonoraryServiceWeekDay[],
  t: (key: string) => string,
) {
  if (days.length === honoraryServiceWeekDays.length) {
    return t('honoraryServants.everyDay')
  }
  return honoraryServiceWeekDays
    .filter((day) => days.includes(day))
    .map((day) => t(`honoraryServiceWeekDays.${day}`))
    .join('، ')
}

export function honoraryServiceLabel(
  item: Pick<HonoraryServant, 'serviceType' | 'otherDescription'>,
  t: (key: string) => string,
) {
  return item.serviceType?.name ?? t('honoraryServants.otherService')
}
