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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  AppForm,
  Button,
  PageHeader,
  cardClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { addDaysIso, currentPersianYear, formatNumber } from '../../lib/datetime'
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
import { ReservationCountFields } from './ReservationCountFields'
import {
  createReservationParty,
  emptyPartyDraft,
  partyDraftError,
  ReservationPartyFields,
  type PartyDraft,
  type PartyKind,
} from './ReservationPartyFields'
import {
  travelDatesError,
  OccasionStayHint,
  ReservationDateFields,
  ReservationOptionalGeoFields,
  OptionalInfoHint,
  ReservationApplicantFields,
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

type CreateStep = 'type' | 'party' | 'count' | 'dates' | 'optional'
const defaultCreateSteps: CreateStep[] = ['type', 'count', 'dates', 'optional']
const partyCreateSteps: CreateStep[] = ['type', 'party', 'count', 'dates', 'optional']

function stepsForCreateType(type: ReservationType | ''): CreateStep[] {
  return type === 'GROUP' || type === 'CARAVAN' ? partyCreateSteps : defaultCreateSteps
}

const createStepIcons: Record<CreateStep, LucideIcon> = {
  type: Users,
  party: Users,
  count: User,
  dates: Calendar,
  optional: MapPin,
}

function stayDatesFromOccasions(
  settings?: Pick<ReceptionSettings, 'prophetDemiseDate' | 'imamRezaMartyrdomDate'> | null,
) {
  const stayStartDate = settings?.prophetDemiseDate
    ? addDaysIso(settings.prophetDemiseDate, -1)
    : ''
  return {
    stayStartDate,
    stayEndDate: settings?.imamRezaMartyrdomDate
      ? addDaysIso(settings.imamRezaMartyrdomDate, 1)
      : '',
    walkingStartDate: stayStartDate ? addDaysIso(stayStartDate, -3) : '',
  }
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
  groupId: '',
  requestsAccommodation: true,
  requestsBus: true,
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
  const [partyDraft, setPartyDraft] = useState<PartyDraft>(() => emptyPartyDraft(user))
  const [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const steps = stepsForCreateType(type)
  const stepIndex = steps.indexOf(step)
  const lastStep = step === 'optional'
  const partyKind: PartyKind | null = type === 'GROUP' || type === 'CARAVAN' ? type : null
  const needsPartyCity = !user?.cityId

  useEffect(() => {
    const main = document.querySelector('main')
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!user) return
    setValues((current) => ({
      ...current,
      provinceId: current.provinceId || user.provinceId || '',
      originCityId: current.originCityId || user.cityId || '',
    }))
    setPartyDraft((current) => ({
      ...current,
      provinceId: current.provinceId || user.provinceId || '',
      cityId: current.cityId || user.cityId || '',
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

  useEffect(() => {
    const defaults = stayDatesFromOccasions(settings.data)
    if (!defaults.stayStartDate && !defaults.stayEndDate) return
    setValues((current) => {
      const stayStartDate = current.stayStartDate || defaults.stayStartDate
      const stayEndDate = current.stayEndDate || defaults.stayEndDate
      const walkingStartDate = current.walkingStartDate || defaults.walkingStartDate
      if (
        stayStartDate === current.stayStartDate &&
        stayEndDate === current.stayEndDate &&
        walkingStartDate === current.walkingStartDate
      ) {
        return current
      }
      return { ...current, stayStartDate, stayEndDate, walkingStartDate }
    })
  }, [settings.data])

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
    setPartyDraft(emptyPartyDraft(user))
    setValues((current) => {
      const patch: Partial<TravelValues> = {
        caravanId: next === 'CARAVAN' ? current.caravanId : '',
        groupId: next === 'GROUP' ? current.groupId : '',
      }
      if (next !== 'INDIVIDUAL') return { ...current, ...patch }
      const male = Number(current.maleCount) || 0
      const female = Number(current.femaleCount) || 0
      if ((male === 1 && female === 0) || (male === 0 && female === 1)) {
        return { ...current, ...patch }
      }
      return { ...current, ...patch, ...countsForIndividualGender(user?.gender) }
    })
  }

  function goAfterType(next: ReservationType) {
    selectType(next)
    setStep(next === 'GROUP' || next === 'CARAVAN' ? 'party' : 'count')
  }

  function goBack() {
    if (stepIndex <= 0) return
    setStep(steps[stepIndex - 1])
  }

  function selectedPartyId() {
    if (type === 'CARAVAN') return values.caravanId
    if (type === 'GROUP') return values.groupId
    return ''
  }

  function applyParty(item: { id: string; maleCount: number; femaleCount: number }) {
    setValues((current) => ({
      ...current,
      caravanId: type === 'CARAVAN' ? item.id : '',
      groupId: type === 'GROUP' ? item.id : '',
      maleCount: String(item.maleCount),
      femaleCount: String(item.femaleCount),
    }))
  }

  async function ensurePartySelected(): Promise<boolean> {
    if (!partyKind) return true
    if (selectedPartyId()) return true
    const error = partyDraftError(partyDraft, partyKind, t, locale, needsPartyCity)
    if (error) {
      toast.error(error)
      return false
    }
    try {
      const created = await createReservationParty(partyKind, partyDraft)
      applyParty(created)
      setPartyDraft(emptyPartyDraft(user))
      await queryClient.invalidateQueries({
        queryKey: partyKind === 'CARAVAN' ? ['caravans', 'mine', 'lookup'] : ['groups', 'mine', 'lookup'],
      })
      toast.success(t(partyKind === 'CARAVAN' ? 'caravans.created' : 'groups.created'))
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      return false
    }
  }

  function validateStep(): boolean {
    if (step === 'type') {
      if (!type) {
        toast.error(t('reservations.typeRequired'))
        return false
      }
      return true
    }
    if (step === 'party') {
      if (selectedPartyId()) return true
      if (!partyKind) {
        toast.error(t('reservations.groupRequired'))
        return false
      }
      const error = partyDraftError(partyDraft, partyKind, t, locale, needsPartyCity)
      if (error) {
        toast.error(error)
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
    if (step === 'party') {
      setSubmitting(true)
      try {
        const ok = await ensurePartySelected()
        if (ok) setStep(steps[stepIndex + 1])
      } finally {
        setSubmitting(false)
      }
      return
    }
    if (!lastStep) {
      setStep(steps[stepIndex + 1])
      return
    }
    if (!type) return
    if (type === 'GROUP' && !values.groupId) {
      toast.error(t('reservations.groupRequired'))
      setStep('party')
      return
    }
    if (type === 'CARAVAN' && !values.caravanId) {
      toast.error(t('reservations.caravanRequired'))
      setStep('party')
      return
    }
    const dateError = travelDatesError(values, t)
    if (dateError) {
      toast.error(dateError)
      setStep('dates')
      return
    }
    confirmToast({
      title: t('reservations.confirmSubmitForReview'),
      confirmLabel: t('reservations.createAndSubmit'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => {
        void createReservation()
      },
    })
  }

  async function createReservation() {
    if (!type) return
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
        requestsAccommodation: values.requestsAccommodation,
        requestsBus: values.requestsBus,
        maleCount: male,
        femaleCount: female,
        caravanId: type === 'CARAVAN' ? values.caravanId || null : null,
        groupId: type === 'GROUP' ? values.groupId || null : null,
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

      <CreateStepBar
        current={step}
        steps={steps}
        type={type}
        onSelect={(next) => {
          const target = steps.indexOf(next)
          if (target >= 0 && target <= stepIndex) setStep(next)
        }}
      />

      <AppForm
        key={step}
        autoFocusFirst={step !== 'type'}
        onSubmit={submit}
        className={step === 'type' || step === 'party' ? 'space-y-4' : `space-y-4 p-6 ${cardClassName}`}
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
                    onClick={() => goAfterType(item)}
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
            <RequiredHidden value={type} />
          </>
        ) : null}

        {step === 'party' && partyKind ? (
          <ReservationPartyFields
            type={partyKind}
            selectedId={selectedPartyId()}
            draft={partyDraft}
            onDraftChange={(patch) => {
              setPartyDraft((current) => ({ ...current, ...patch }))
              if (selectedPartyId()) {
                setValues((current) => ({ ...current, caravanId: '', groupId: '' }))
              }
            }}
            onSelect={(item) => {
              applyParty(item)
              setPartyDraft(emptyPartyDraft(user))
            }}
            onAdvance={() => setStep('count')}
          />
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
          <ReservationDateFields values={values} onChange={patchValues} showOccasionHint={false} />
        ) : null}

        {step === 'optional' ? (
          <>
            <ReservationApplicantFields values={values} onChange={patchValues} />
            <OptionalInfoHint />
            <ReservationOptionalGeoFields values={values} onChange={patchValues} iranId={iranId} />
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-6">
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
        {step === 'dates' ? <OccasionStayHint /> : null}
      </AppForm>
    </div>
  )
}

function CreateStepBar({
  current,
  steps,
  type,
  onSelect,
}: {
  current: CreateStep
  steps: CreateStep[]
  type: ReservationType | ''
  onSelect: (step: CreateStep) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const currentIndex = steps.indexOf(current)
  const total = steps.length
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
        <div
          className={`grid min-w-0 w-full flex-1 gap-2 sm:order-first ${
            total === 5 ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {steps.map((item, index) => {
            const Icon =
              item === 'party' ? (type === 'CARAVAN' ? Footprints : Users) : createStepIcons[item]
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending'
            const styles = {
              done: 'border-teal-200 bg-teal-50 text-teal-800',
              current:
                'border-teal-500 bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.28)]',
              pending: 'border-line bg-cream-50 text-ink-400',
            }
            const clickable = index <= currentIndex
            const className = `flex h-full w-full flex-col items-center gap-1 rounded-2xl border px-1.5 py-3 text-center transition-[box-shadow,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${styles[state]} ${
              clickable ? 'cursor-pointer' : 'cursor-not-allowed'
            }`
            const numberClass =
              state === 'current' ? 'text-white' : state === 'done' ? 'text-teal-800' : 'text-ink-400'
            const label =
              item === 'party'
                ? t(type === 'CARAVAN' ? 'reservations.createSteps.caravan' : 'reservations.createSteps.group')
                : t(`reservations.createSteps.${item}`)
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
                  {label}
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
          {t('reservations.capacityTitle', { type: t(`reservations.types.${type}`) })}
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
