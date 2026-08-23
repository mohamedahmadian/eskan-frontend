import {
  Ban,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  MapPin,
  Mars,
  User,
  Users,
  Venus,
  Footprints,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  AppForm,
  Button,
  PageHeader,
  cardClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import { isCaravanManager } from '../../lib/roles'
import type {
  Country,
  ReceptionCapacity,
  ReceptionCapacitySlice,
  ReceptionSettings,
  Reservation,
  ReservationType,
} from '../../types/app'
import {
  CAPACITY_WARNING_RATIO,
  GROUP_MAX_SIZE,
  capacityKey,
  settingsEnabledKey,
} from './reservation-steps'
import {
  travelDatesError,
  ReservationCaravanField,
  ReservationCountFields,
  ReservationDateFields,
  ReservationOptionalGeoFields,
  OptionalInfoHint,
  type TravelValues,
} from './ReservationTravelFields'
import { StepProgressChart } from './StepProgressChart'

const defaultTypes: ReservationType[] = ['INDIVIDUAL', 'GROUP', 'CARAVAN']
const caravanManagerTypes: ReservationType[] = ['CARAVAN', 'INDIVIDUAL', 'GROUP']
const typeCardHoverClass =
  'hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_18px_40px_rgba(46,189,182,0.28),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.35)]'
const typeIcons = { INDIVIDUAL: User, GROUP: Users, CARAVAN: Footprints }
const typeHintCounts: Record<ReservationType, number> = {
  INDIVIDUAL: 2,
  GROUP: 3,
  CARAVAN: 3,
}

const createSteps = ['type', 'count', 'dates', 'optional'] as const
type CreateStep = (typeof createSteps)[number]
const createStepIcons: Record<CreateStep, LucideIcon> = {
  type: Users,
  count: User,
  dates: Calendar,
  optional: MapPin,
}

const emptyTravel = (): TravelValues => ({
  provinceId: '',
  originCityId: '',
  walkingRouteId: '',
  stayStartDate: '',
  stayEndDate: '',
  walkingStartDate: '',
  maleCount: '0',
  femaleCount: '0',
  caravanId: '',
})

function countsForIndividualGender(gender: 'MALE' | 'FEMALE' | null | undefined) {
  if (gender === 'MALE') return { maleCount: '1', femaleCount: '0' }
  if (gender === 'FEMALE') return { maleCount: '0', femaleCount: '1' }
  return { maleCount: '0', femaleCount: '0' }
}

export function ReservationCreatePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const { user } = useAuth()
  const year = currentPersianYear()
  const yearLabel = formatNumber(year, locale)
  const types = isCaravanManager(user) ? caravanManagerTypes : defaultTypes
  const [step, setStep] = useState<CreateStep>('type')
  const [type, setType] = useState<ReservationType | ''>('')
  const [values, setValues] = useState<TravelValues>(() => ({
    ...emptyTravel(),
    provinceId: user?.provinceId ?? '',
    originCityId: user?.cityId ?? '',
  }))
  const [submitting, setSubmitting] = useState(false)
  const stepIndex = createSteps.indexOf(step)
  const lastStep = step === 'optional'

  useEffect(() => {
    if (!user) return
    setValues((current) => ({
      ...current,
      provinceId: current.provinceId || user.provinceId || '',
      originCityId: current.originCityId || user.cityId || '',
    }))
  }, [user])

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''

  const settings = useQuery({
    queryKey: ['reception-settings', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${year}`)
      return data
    },
  })

  const capacity = useQuery({
    queryKey: ['reception-settings', year, 'capacity'],
    queryFn: async () => {
      const { data } = await api.get<ReceptionCapacity>(`/reception-settings/${year}/capacity`)
      return data
    },
  })

  const selectedCapacity = useMemo(() => {
    if (!type || !capacity.data) return null
    return capacity.data[capacityKey(type)]
  }, [type, capacity.data])

  function selectType(next: ReservationType) {
    setType(next)
    setValues((current) => {
      const patch: Partial<TravelValues> = { caravanId: next === 'CARAVAN' ? current.caravanId : '' }
      if (next !== 'INDIVIDUAL') return { ...current, ...patch }
      const male = Number(current.maleCount) || 0
      const female = Number(current.femaleCount) || 0
      if ((male === 1 && female === 0) || (male === 0 && female === 1)) {
        return { ...current, ...patch }
      }
      return { ...current, ...patch, ...countsForIndividualGender(user?.gender) }
    })
  }

  function goToCountStep(next: ReservationType) {
    selectType(next)
    if (next === 'CARAVAN' && !values.caravanId) {
      toast.error(t('reservations.caravanRequired'))
      return
    }
    setStep('count')
  }

  function goBack() {
    if (stepIndex <= 0) return
    setStep(createSteps[stepIndex - 1])
  }

  function validateStep(): boolean {
    if (step === 'type') {
      if (!type) {
        toast.error(t('reservations.typeRequired'))
        return false
      }
      if (type === 'CARAVAN' && !values.caravanId) {
        toast.error(t('reservations.caravanRequired'))
        return false
      }
      return true
    }
    if (step === 'count') {
      const male = Number(values.maleCount) || 0
      const female = Number(values.femaleCount) || 0
      if (male + female <= 0) {
        toast.error(t('reservations.countInvalid'))
        return false
      }
      if (type === 'GROUP' && male + female > GROUP_MAX_SIZE) {
        toast.error(t('reservations.groupMaxExceeded', { count: formatNumber(GROUP_MAX_SIZE, locale) }))
        return false
      }
      return true
    }
    if (step === 'dates') {
      const dateError = travelDatesError(values, t)
      if (dateError) {
        toast.error(dateError)
        return false
      }
    }
    return true
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validateStep()) return
    if (!lastStep) {
      setStep(createSteps[stepIndex + 1])
      return
    }
    if (!type) return
    const dateError = travelDatesError(values, t)
    if (dateError) {
      toast.error(dateError)
      setStep('dates')
      return
    }
    const male = Number(values.maleCount) || 0
    const female = Number(values.femaleCount) || 0
    setSubmitting(true)
    try {
      const { data } = await api.post<Reservation>('/reservations', {
        type,
        year,
        originCityId: values.originCityId || null,
        walkingRouteId: values.walkingRouteId || null,
        stayStartDate: values.stayStartDate || null,
        stayEndDate: values.stayEndDate || null,
        walkingStartDate: values.walkingStartDate || null,
        maleCount: male,
        femaleCount: female,
        caravanId: type === 'CARAVAN' ? values.caravanId || null : null,
      })
      toast.success(
        data.status === 'PENDING_MANAGEMENT_REVIEW'
          ? t('reservations.submitted')
          : t('reservations.created'),
      )
      navigate(`/my-reservations/${data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  const patchValues = (patch: Partial<TravelValues>) =>
    setValues((current) => ({ ...current, ...patch }))

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />

      <CreateStepBar current={step} onSelect={(next) => {
        const target = createSteps.indexOf(next)
        if (target >= 0 && target <= stepIndex) setStep(next)
      }} />

      <AppForm
        key={step}
        autoFocusFirst={step !== 'type'}
        onSubmit={submit}
        className={step === 'type' ? 'space-y-4' : `space-y-4 p-6 ${cardClassName}`}
      >
        {step === 'type' ? (
          <>
            <div className="flex flex-col gap-4">
              {types.map((item) => {
                const Icon = typeIcons[item]
                const enabled = Boolean(settings.data?.[settingsEnabledKey(item)])
                const selected = type === item
                const hints = Array.from({ length: typeHintCounts[item] }, (_, index) =>
                  t(`reservations.typeHints.${item}.${index}`, {
                    count: formatNumber(GROUP_MAX_SIZE, locale),
                  }),
                )
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!enabled}
                    data-enter-ignore=""
                    onClick={() => goToCountStep(item)}
                    className={`w-full rounded-[22px] border p-5 text-start transition-[box-shadow,transform,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:p-6 ${
                      selected
                        ? 'border-teal-500 bg-teal-50 shadow-[0_16px_36px_rgba(46,189,182,0.24),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.32)]'
                        : 'border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]'
                    } ${!enabled ? 'cursor-not-allowed' : `cursor-pointer ${typeCardHoverClass}`}`}
                  >
                    {settings.isSuccess && !enabled ? (
                      <CreateUnavailableNotice className="mb-4" />
                    ) : null}
                    <div className={!enabled && settings.isSuccess ? 'opacity-55' : undefined}>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                            selected ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600'
                          }`}
                        >
                          <Icon className="size-6" aria-hidden />
                        </span>
                        <p className="text-lg font-semibold text-ink-900">{t(`reservations.types.${item}`)}</p>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {hints.map((hint) => (
                          <li key={hint} className="flex items-start gap-2.5 text-sm leading-6 text-ink-600">
                            <Check className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
                            <span>{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                )
              })}
            </div>
            {type === 'CARAVAN' ? (
              <div className={`space-y-4 p-6 ${cardClassName}`}>
                <ReservationCaravanField values={values} onChange={patchValues} />
              </div>
            ) : null}
            <RequiredHidden value={type} />
          </>
        ) : null}

        {step === 'count' && type ? (
          <>
            {selectedCapacity ? (
              <RemainingCapacityCard type={type} slice={selectedCapacity} locale={locale} />
            ) : null}
            <ReservationCountFields
              values={values}
              onChange={(patch) => {
                patchValues(patch)
                if (type === 'INDIVIDUAL') setStep('dates')
              }}
              type={type}
            />
          </>
        ) : null}

        {step === 'dates' ? (
          <ReservationDateFields values={values} onChange={patchValues} />
        ) : null}

        {step === 'optional' ? (
          <>
            <OptionalInfoHint />
            <ReservationOptionalGeoFields values={values} onChange={patchValues} iranId={iranId} />
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {stepIndex > 0 ? (
            <Button type="button" onClick={goBack}>
              <ChevronRight className="size-4" aria-hidden />
              {t('reservations.prevStep')}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="ms-auto"
            disabled={submitting || (step === 'type' && !type)}
          >
            {lastStep ? t('reservations.createAndSubmit') : t('reservations.nextStep')}
            {lastStep ? <Check className="size-4" aria-hidden /> : <ChevronLeft className="size-4" aria-hidden />}
          </Button>
        </div>
      </AppForm>
    </div>
  )
}

function CreateStepBar({
  current,
  onSelect,
}: {
  current: CreateStep
  onSelect: (step: CreateStep) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const currentIndex = createSteps.indexOf(current)
  const total = createSteps.length
  return (
    <div className={`${cardClassName} mb-4 p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <StepProgressChart
          currentIndex={currentIndex}
          total={total}
          locale={locale}
          label={t('reservations.stepOf', {
            current: formatNumber(currentIndex + 1, locale),
            total: formatNumber(total, locale),
          })}
        />
        <div className="grid min-w-0 w-full flex-1 grid-cols-4 gap-2 sm:order-first">
          {createSteps.map((item, index) => {
            const Icon = createStepIcons[item]
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending'
            const styles = {
              done: 'border-teal-200 bg-teal-50 text-teal-800',
              current:
                'border-teal-500 bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.28)]',
              pending: 'border-line bg-cream-50 text-ink-400',
            }
            const clickable = index <= currentIndex
            const className = `flex h-full w-full flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-[box-shadow,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${styles[state]} ${
              clickable ? 'cursor-pointer' : 'cursor-not-allowed'
            }`
            const numberClass =
              state === 'current' ? 'text-white' : state === 'done' ? 'text-teal-800' : 'text-ink-400'
            const content = (
              <>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    state === 'current'
                      ? 'bg-white/20 text-white'
                      : state === 'done'
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-ink-300'
                  }`}
                >
                  {state === 'done' ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                </span>
                <span className="text-[11px] font-medium leading-5 sm:text-xs">
                  {t(`reservations.createSteps.${item}`)}
                </span>
                <span className={`text-base font-semibold ${numberClass}`}>
                  {formatNumber(index + 1, locale)}
                </span>
              </>
            )
            return clickable ? (
              <button
                key={item}
                type="button"
                className={className}
                aria-current={state === 'current' ? 'step' : undefined}
                onClick={() => onSelect(item)}
              >
                {content}
              </button>
            ) : (
              <span key={item} className={className} aria-disabled="true">
                {content}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RequiredHidden({ value }: { value: string }) {
  return (
    <input
      tabIndex={-1}
      required
      value={value}
      onChange={() => undefined}
      aria-hidden
      className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
    />
  )
}

function CreateUnavailableNotice({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <aside
      className={`flex items-start gap-3 rounded-[22px] border-2 border-gold-100 bg-gradient-to-b from-gold-50 via-gold-50/80 to-white p-4 shadow-[0_12px_28px_rgba(232,184,58,0.16)] ${className ?? ''}`}
      role="status"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
        <Ban className="size-5" aria-hidden />
      </div>
      <p className="pt-2 text-sm font-medium leading-7 text-ink-900">
        {t('reservations.createUnavailable')}
      </p>
    </aside>
  )
}

function RemainingCapacityCard({
  type,
  slice,
  locale,
}: {
  type: ReservationType
  slice: ReceptionCapacitySlice
  locale: string
}) {
  const { t } = useTranslation()
  const n = (value: number) => formatNumber(value, locale)
  const genders = [
    {
      key: 'male',
      icon: Mars,
      label: t('reservations.male'),
      remain: slice.maleRemaining,
      capacity: slice.maleCapacity,
      used: slice.maleUsed,
      wrap: 'bg-teal-50 text-teal-800',
      iconWrap: 'bg-teal-500 text-white',
      bar: 'bg-teal-500',
    },
    {
      key: 'female',
      icon: Venus,
      label: t('reservations.female'),
      remain: slice.femaleRemaining,
      capacity: slice.femaleCapacity,
      used: slice.femaleUsed,
      wrap: 'bg-mint-50 text-mint-600',
      iconWrap: 'bg-mint-500 text-white',
      bar: 'bg-mint-500',
    },
  ] as const

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-l from-mint-50 via-white to-teal-50 px-3 py-2 shadow-[0_6px_16px_rgba(20,40,40,0.04)]">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-white">
          <Gauge className="size-3.5" aria-hidden />
        </span>
        <p className="min-w-0 text-xs font-medium text-ink-900">
          {t('reservations.capacityTitle')}
          <span className="ms-1.5 font-normal text-ink-500">{t(`reservations.types.${type}`)}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {genders.map((item) => {
          const ratio = item.capacity > 0 ? item.used / item.capacity : 0
          const warning = ratio >= CAPACITY_WARNING_RATIO
          const percent = item.capacity > 0 ? Math.min(100, Math.round((item.remain / item.capacity) * 100)) : 0
          return (
            <div
              key={item.key}
              className={`rounded-xl px-2 py-1.5 ${item.wrap} ${warning ? 'ring-1 ring-amber-300' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-md ${item.iconWrap}`}
                >
                  <item.icon className="size-3" aria-hidden />
                </span>
                <span className="text-[11px] font-medium">{item.label}</span>
                <span className="ms-auto text-sm font-semibold text-ink-900">{n(item.remain)}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full ${warning ? 'bg-amber-500' : item.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {warning ? (
                <p className="mt-0.5 text-[10px] font-medium text-amber-800">
                  {t('reservations.capacityLow')}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
