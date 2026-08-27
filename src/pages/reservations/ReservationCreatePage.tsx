import {
  Ban,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileBadge,
  Gauge,
  HeartHandshake,
  IdCard,
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
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  AppForm,
  Button,
  LoadingState,
  PageHeader,
  cardClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import { FormMetaChip } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { addDaysIso, currentPersianYear, formatNumber } from '../../lib/datetime'
import { isCaravanManager } from '../../lib/roles'
import type {
  ManagedUser,
  ReceptionCapacity,
  ReceptionCapacitySlice,
  ReceptionSettings,
  Reservation,
  ReservationPermitOptions,
  ReservationType,
} from '../../types/app'
import {
  CAPACITY_WARNING_RATIO,
  GROUP_MAX_SIZE,
  capacityKey,
  createWizardPath,
  isOwnerCreateDraft,
  settingsEnabledKey,
} from './reservation-steps'
import {
  ReceptionRulesModal,
  ReceptionTypeIntro,
  settingsRulesKey,
  splitMultilineItems,
} from './ReceptionTypeContent'
import { ReservationCountFields } from './ReservationCountFields'
import {
  createReservationParty,
  emptyPartyDraft,
  partyDraftError,
  ReservationPartyFields,
  shouldPickCaravanManager,
  type PartyDraft,
  type PartyKind,
} from './ReservationPartyFields'
import {
  travelDatesError,
  OccasionStayHint,
  ReservationDateFields,
  ReservationApplicantFields,
  type TravelValues,
} from './ReservationTravelFields'
import { ReservationCaravanLicenseStep, type CaravanPermitDraft } from './ReservationCaravanLicenseStep'
import { StepBlockedNotice } from './ReservationStepNav'
import { StepProgressChart } from './StepProgressChart'

const defaultTypes: ReservationType[] = ['INDIVIDUAL', 'GROUP', 'CARAVAN']
const caravanManagerTypes: ReservationType[] = ['CARAVAN', 'INDIVIDUAL', 'GROUP']
const typeCardHoverClass =
  'hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_18px_40px_rgba(46,189,182,0.28),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.35)]'
const typeIcons = { INDIVIDUAL: User, GROUP: Users, CARAVAN: Footprints }

type CreateStep = 'type' | 'party' | 'count' | 'dates' | 'services' | 'license'
const defaultCreateSteps: CreateStep[] = ['type', 'count', 'dates', 'services']
const groupCreateSteps: CreateStep[] = ['type', 'party', 'count', 'dates', 'services']
const caravanCreateSteps: CreateStep[] = ['type', 'party', 'count', 'dates', 'services', 'license']

function stepsForCreateType(type: ReservationType | ''): CreateStep[] {
  if (type === 'CARAVAN') return caravanCreateSteps
  if (type === 'GROUP') return groupCreateSteps
  return defaultCreateSteps
}

const createStepIcons: Record<CreateStep, LucideIcon> = {
  type: Users,
  party: Users,
  count: User,
  dates: Calendar,
  services: HeartHandshake,
  license: FileBadge,
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
  requestedMaleCount: '0',
  requestedFemaleCount: '0',
  caravanId: '',
  groupId: '',
  requestsAccommodation: true,
  requestsBus: true,
  requestsSimCard: false,
  requestsBankCard: false,
  specialServices: '',
})

function countsForIndividualGender(gender: 'MALE' | 'FEMALE' | null | undefined) {
  if (gender === 'MALE') return { maleCount: '1', femaleCount: '0' }
  if (gender === 'FEMALE') return { maleCount: '0', femaleCount: '1' }
  return { maleCount: '0', femaleCount: '0' }
}

function permitFromReservation(reservation: Reservation): CaravanPermitDraft {
  if (reservation.permitSource === 'ISSUED_LICENSE' && reservation.issuedLicenseId) {
    return {
      source: 'ISSUED_LICENSE',
      issuedLicenseId: reservation.issuedLicenseId,
      permitImageId: '',
    }
  }
  if (reservation.permitSource === 'UPLOAD' && reservation.permitImageId) {
    return {
      source: 'UPLOAD',
      issuedLicenseId: '',
      permitImageId: reservation.permitImageId,
    }
  }
  return { source: '', issuedLicenseId: '', permitImageId: '' }
}

function valuesFromReservation(reservation: Reservation, userProvinceId?: string | null): TravelValues {
  const male = String(reservation.requestedMaleCount || reservation.maleCount || 0)
  const female = String(reservation.requestedFemaleCount || reservation.femaleCount || 0)
  return {
    provinceId: reservation.originCity?.provinceId || userProvinceId || '',
    originCityId: reservation.originCity?.id ?? '',
    walkingRouteId: reservation.walkingRoute?.id ?? '',
    stayStartDate: reservation.stayStartDate ?? '',
    stayEndDate: reservation.stayEndDate ?? '',
    walkingStartDate: reservation.walkingStartDate ?? '',
    maleCount: male,
    femaleCount: female,
    requestedMaleCount: male,
    requestedFemaleCount: female,
    caravanId: reservation.caravan?.id ?? reservation.caravanId ?? '',
    groupId: reservation.group?.id ?? reservation.groupId ?? '',
    requestsAccommodation: reservation.requestsAccommodation ?? true,
    requestsBus: reservation.requestsBus ?? true,
    requestsSimCard: reservation.requestsSimCard ?? false,
    requestsBankCard: reservation.requestsBankCard ?? false,
    specialServices: reservation.specialServices ?? '',
  }
}

function inferCreateStep(
  type: ReservationType,
  values: TravelValues,
  permit: CaravanPermitDraft,
  savedStep?: string | null,
): CreateStep {
  const steps = stepsForCreateType(type)
  if (savedStep && steps.includes(savedStep as CreateStep)) {
    return savedStep as CreateStep
  }
  for (const item of steps) {
    if (item === 'type') continue
    if (item === 'party') {
      const partyId = type === 'CARAVAN' ? values.caravanId : values.groupId
      if (!partyId) return 'party'
      continue
    }
    if (item === 'count') {
      const male = Number(values.maleCount) || 0
      const female = Number(values.femaleCount) || 0
      if (male + female <= 0) return 'count'
      continue
    }
    if (item === 'dates') {
      if (!values.stayStartDate || !values.stayEndDate) return 'dates'
      continue
    }
    if (item === 'services') continue
    if (item === 'license' && !permit.source) return 'license'
  }
  return steps[steps.length - 1]
}

function furtherCreateStep(
  type: ReservationType | '',
  a: CreateStep,
  b: CreateStep,
): CreateStep {
  if (!type) return a
  const list = stepsForCreateType(type)
  return list.indexOf(a) >= list.indexOf(b) ? a : b
}

export function ReservationCreatePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const draftParam = searchParams.get('draft') ?? ''
  const forUserParam = searchParams.get('forUser') ?? ''
  const createBase = location.pathname.startsWith('/reservations')
    ? '/reservations'
    : '/my-reservations'
  const isAdminCreate = createBase === '/reservations'
  const { user } = useAuth()
  const year = currentPersianYear()
  const yearLabel = formatNumber(year, locale)
  const types = isAdminCreate
    ? defaultTypes
    : isCaravanManager(user)
      ? caravanManagerTypes
      : defaultTypes
  const [step, setStep] = useState<CreateStep>('type')
  const [maxReachedStep, setMaxReachedStep] = useState<CreateStep>('type')
  const [type, setType] = useState<ReservationType | ''>('')
  const [draftId, setDraftId] = useState(draftParam)
  const [draftYear, setDraftYear] = useState(year)
  const [values, setValues] = useState<TravelValues>(() => emptyTravel())
  const [partyDraft, setPartyDraft] = useState<PartyDraft>(() => emptyPartyDraft(null))
  const [permitDraft, setPermitDraft] = useState<CaravanPermitDraft>({
    source: '',
    issuedLicenseId: '',
    permitImageId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const [draftHydrated, setDraftHydrated] = useState(!draftParam)
  const queryClient = useQueryClient()
  const reservationYear = draftId ? draftYear : year
  const steps = stepsForCreateType(type)
  const stepIndex = steps.indexOf(step)
  const maxReachedIndex = Math.max(stepIndex, steps.indexOf(maxReachedStep))
  const lastStep = stepIndex === steps.length - 1
  const partyKind: PartyKind | null = type === 'GROUP' || type === 'CARAVAN' ? type : null

  const permitOptionsQuery = useQuery({
    queryKey: ['reservations', 'permit-options', values.caravanId, reservationYear],
    enabled: Boolean(values.caravanId) && type === 'CARAVAN',
    queryFn: async () => {
      const { data } = await api.get<ReservationPermitOptions>('/reservations/permit-options', {
        params: { caravanId: values.caravanId, year: reservationYear },
      })
      return data
    },
  })

  function isIssuedLicenseAwaitingHqApproval(licenseId: string) {
    if (!licenseId) return false
    const selected = permitOptionsQuery.data?.items.find((item) => item.id === licenseId)
    return selected?.status === 'ISSUED'
  }

  const finalSubmitBlocked =
    lastStep &&
    type === 'CARAVAN' &&
    permitDraft.source === 'ISSUED_LICENSE' &&
    Boolean(permitDraft.issuedLicenseId) &&
    isIssuedLicenseAwaitingHqApproval(permitDraft.issuedLicenseId)

  const draftQuery = useQuery({
    queryKey: ['reservations', draftParam, 'create-draft'],
    enabled: Boolean(draftParam),
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${draftParam}`)
      return data
    },
  })

  const forUserId =
    forUserParam ||
    (isAdminCreate ? draftQuery.data?.createdBy?.id ?? '' : '') ||
    ''

  useEffect(() => {
    if (!isAdminCreate) return
    if (draftParam || forUserParam) return
    navigate('/reservations', { replace: true })
  }, [isAdminCreate, draftParam, forUserParam, navigate])

  const forUserQuery = useQuery({
    queryKey: ['users', forUserId, 'create-on-behalf'],
    enabled: Boolean(forUserId) && isAdminCreate,
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`/users/${forUserId}`)
      return data
    },
  })

  const subject =
    isAdminCreate && forUserQuery.data
      ? forUserQuery.data
      : !isAdminCreate
        ? user
        : null
  const needsPartyCity = !subject?.cityId
  const subjectReady = !isAdminCreate || Boolean(subject) || Boolean(draftParam && draftHydrated)

  useEffect(() => {
    if (!draftParam) {
      setDraftHydrated(true)
      return
    }
    if (draftHydrated) return
    if (!draftQuery.isSuccess || !draftQuery.data) return
    const reservation = draftQuery.data
    if (!isOwnerCreateDraft(reservation)) {
      navigate(`${createBase}/${reservation.id}`, { replace: true })
      return
    }
    const nextType = reservation.type
    const nextValues = valuesFromReservation(
      reservation,
      reservation.createdBy ? undefined : user?.provinceId,
    )
    const nextPermit = permitFromReservation(reservation)
    setDraftId(reservation.id)
    setDraftYear(reservation.year)
    setType(nextType)
    setValues(nextValues)
    setPermitDraft(nextPermit)
    setPartyDraft(emptyPartyDraft(subject ?? user))
    const reached = inferCreateStep(nextType, nextValues, nextPermit, reservation.createWizardStep)
    setStep(reached)
    setMaxReachedStep(reached)
    setDraftHydrated(true)
  }, [
    draftParam,
    draftHydrated,
    draftQuery.isSuccess,
    draftQuery.data,
    navigate,
    user,
    createBase,
    subject,
  ])

  useEffect(() => {
    const main = document.querySelector('main')
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!subject || draftParam) return
    setValues((current) => ({
      ...current,
      provinceId: current.provinceId || subject.provinceId || '',
      originCityId: current.originCityId || subject.cityId || '',
    }))
    setPartyDraft((current) => ({
      ...current,
      provinceId: current.provinceId || subject.provinceId || '',
      cityId: current.cityId || subject.cityId || '',
      managerUserId:
        current.managerUserId ||
        (shouldPickCaravanManager(subject) ? '' : subject.id),
    }))
  }, [subject, draftParam])

  const settings = useQuery({
    queryKey: ['reception-settings', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${year}`)
      return data
    },
  })

  useEffect(() => {
    if (draftParam) return
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
  }, [settings.data, draftParam])

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
    setPartyDraft(emptyPartyDraft(subject))
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
      return { ...current, ...patch, ...countsForIndividualGender(subject?.gender) }
    })
  }

  function selectedPartyId() {
    if (type === 'CARAVAN') return values.caravanId
    if (type === 'GROUP') return values.groupId
    return ''
  }

  function applyParty(item: { id: string }, walkingRouteId?: string) {
    setValues((current) => ({
      ...current,
      caravanId: type === 'CARAVAN' ? item.id : '',
      groupId: type === 'GROUP' ? item.id : '',
      ...(walkingRouteId ? { walkingRouteId } : {}),
    }))
  }

  function draftPayload(
    nextType: ReservationType,
    nextValues: TravelValues,
    nextPermit: CaravanPermitDraft,
    wizardStep?: CreateStep,
  ) {
    const male = Number(nextValues.maleCount) || 0
    const female = Number(nextValues.femaleCount) || 0
    return {
      type: nextType,
      year: reservationYear,
      asDraft: true as const,
      createWizardStep: wizardStep ?? step,
      originCityId: nextValues.originCityId || null,
      walkingRouteId: nextValues.walkingRouteId || null,
      stayStartDate: nextValues.stayStartDate || null,
      stayEndDate: nextValues.stayEndDate || null,
      walkingStartDate: nextValues.walkingStartDate || null,
      requestsAccommodation: nextValues.requestsAccommodation,
      requestsBus: nextValues.requestsBus,
      requestsSimCard: nextValues.requestsSimCard,
      requestsBankCard: nextValues.requestsBankCard,
      specialServices: nextValues.specialServices.trim() || null,
      maleCount: male,
      femaleCount: female,
      caravanId: nextType === 'CARAVAN' ? nextValues.caravanId || null : null,
      groupId: nextType === 'GROUP' ? nextValues.groupId || null : null,
      ...(nextType === 'CARAVAN'
        ? {
            issuedLicenseId:
              nextPermit.source === 'ISSUED_LICENSE' ? nextPermit.issuedLicenseId || null : null,
            permitImageId:
              nextPermit.source === 'UPLOAD' ? nextPermit.permitImageId || null : null,
          }
        : {}),
    }
  }

  async function persistDraft(options?: {
    nextType?: ReservationType
    nextValues?: TravelValues
    nextPermit?: CaravanPermitDraft
    wizardStep?: CreateStep
    silent?: boolean
  }): Promise<string | null> {
    const nextType = options?.nextType ?? (type || null)
    if (!nextType) return draftId || null
    const nextValues = options?.nextValues ?? values
    const nextPermit = options?.nextPermit ?? permitDraft
    const reached = furtherCreateStep(
      nextType,
      options?.wizardStep ?? step,
      nextType === type ? maxReachedStep : (options?.wizardStep ?? 'type'),
    )
    if (nextType === type || options?.wizardStep) {
      setMaxReachedStep((current) =>
        nextType === type
          ? furtherCreateStep(nextType, reached, current)
          : reached,
      )
    }
    const payload = {
      ...draftPayload(nextType, nextValues, nextPermit, reached),
      ...(isAdminCreate && forUserId && !draftId ? { createdById: forUserId } : {}),
    }
    try {
      if (draftId) {
        const { asDraft: _asDraft, createdById: _createdById, ...patch } = payload
        const { data } = await api.patch<Reservation>(`/reservations/${draftId}`, patch)
        return data.id
      }
      const { data } = await api.post<Reservation>('/reservations', payload)
      setDraftId(data.id)
      navigate(createWizardPath(data.id, createBase, forUserId || undefined), { replace: true })
      if (!options?.silent) {
        toast.success(t('reservations.draftSaved'))
      }
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      return data.id
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      return null
    }
  }

  async function goAfterType(next: ReservationType) {
    selectType(next)
    const nextStep: CreateStep = next === 'GROUP' || next === 'CARAVAN' ? 'party' : 'count'
    const nextValues =
      next === 'INDIVIDUAL'
        ? {
            ...values,
            caravanId: '',
            groupId: '',
            ...((Number(values.maleCount) === 1 && Number(values.femaleCount) === 0) ||
            (Number(values.maleCount) === 0 && Number(values.femaleCount) === 1)
              ? {}
              : countsForIndividualGender(subject?.gender)),
          }
        : {
            ...values,
            caravanId: next === 'CARAVAN' ? values.caravanId : '',
            groupId: next === 'GROUP' ? values.groupId : '',
          }
    setSubmitting(true)
    try {
      const id = await persistDraft({
        nextType: next,
        nextValues,
        nextPermit: { source: '', issuedLicenseId: '', permitImageId: '' },
        wizardStep: nextStep,
      })
      if (id) {
        setMaxReachedStep(nextStep)
        setStep(nextStep)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function goBack() {
    if (stepIndex <= 0) return
    setStep(steps[stepIndex - 1])
  }

  async function ensurePartySelected(
    nextValues: TravelValues = values,
  ): Promise<TravelValues | null> {
    if (!partyKind) return nextValues
    if (type === 'CARAVAN' ? nextValues.caravanId : nextValues.groupId) return nextValues
    const error = partyDraftError(partyDraft, partyKind, t, needsPartyCity)
    if (error) {
      toast.error(error)
      return null
    }
    try {
      const created = await createReservationParty(partyKind, partyDraft)
      const patched: TravelValues = {
        ...nextValues,
        caravanId: type === 'CARAVAN' ? created.id : '',
        groupId: type === 'GROUP' ? created.id : '',
        ...(partyDraft.walkingRouteId ? { walkingRouteId: partyDraft.walkingRouteId } : {}),
      }
      applyParty(created, partyDraft.walkingRouteId)
      setPartyDraft(emptyPartyDraft(subject))
      await queryClient.invalidateQueries({
        queryKey: partyKind === 'CARAVAN' ? ['caravans', 'mine', 'lookup'] : ['groups', 'mine', 'lookup'],
      })
      toast.success(t(partyKind === 'CARAVAN' ? 'caravans.created' : 'groups.created'))
      return patched
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      return null
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
      const error = partyDraftError(partyDraft, partyKind, t, needsPartyCity)
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
    if (step === 'license') {
      if (permitDraft.source === 'ISSUED_LICENSE' && !permitDraft.issuedLicenseId) {
        toast.error(t('reservations.permitIssuedRequired'))
        return false
      }
      if (permitDraft.source === 'UPLOAD' && !permitDraft.permitImageId) {
        toast.error(t('reservations.permitImageRequired'))
        return false
      }
      if (!permitDraft.source) {
        toast.error(t('reservations.permitRequired'))
        return false
      }
    }
    return true
  }

  async function advanceAfterSave(nextValues = values, nextPermit = permitDraft) {
    if (!type) return false
    const nextStep = lastStep ? step : steps[stepIndex + 1]
    const id = await persistDraft({
      nextType: type,
      nextValues,
      nextPermit,
      wizardStep: nextStep,
      silent: Boolean(draftId),
    })
    if (!id) return false
    if (!lastStep) setStep(nextStep)
    return true
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validateStep()) return
    if (step === 'party') {
      setSubmitting(true)
      try {
        const patched = await ensurePartySelected()
        if (!patched || !type) return
        const nextStep = steps[stepIndex + 1]
        const id = await persistDraft({
          nextType: type,
          nextValues: patched,
          wizardStep: nextStep,
          silent: Boolean(draftId),
        })
        if (id) setStep(nextStep)
      } finally {
        setSubmitting(false)
      }
      return
    }
    if (!lastStep) {
      setSubmitting(true)
      try {
        await advanceAfterSave()
      } finally {
        setSubmitting(false)
      }
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
    if (type === 'CARAVAN') {
      if (permitDraft.source === 'ISSUED_LICENSE' && !permitDraft.issuedLicenseId) {
        toast.error(t('reservations.permitIssuedRequired'))
        setStep('license')
        return
      }
      if (permitDraft.source === 'UPLOAD' && !permitDraft.permitImageId) {
        toast.error(t('reservations.permitImageRequired'))
        setStep('license')
        return
      }
      if (!permitDraft.source) {
        toast.error(t('reservations.permitRequired'))
        setStep('license')
        return
      }
    }
    const dateError = travelDatesError(values, t)
    if (dateError) {
      toast.error(dateError)
      setStep('dates')
      return
    }
    setSubmitting(true)
    try {
      const id = await persistDraft({ silent: true, wizardStep: step })
      if (!id) return
      if (
        type === 'CARAVAN' &&
        permitDraft.source === 'ISSUED_LICENSE' &&
        permitDraft.issuedLicenseId &&
        isIssuedLicenseAwaitingHqApproval(permitDraft.issuedLicenseId)
      ) {
        toast.error(t('reservations.permitAwaitingHqApproval'))
        return
      }
      const rules = type ? (settings.data?.[settingsRulesKey(type)] ?? '') : ''
      if (splitMultilineItems(rules).length === 0) {
        await finalizeReservation()
        return
      }
      setRulesModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function finalizeReservation() {
    if (!type) return
    if (
      type === 'CARAVAN' &&
      permitDraft.source === 'ISSUED_LICENSE' &&
      permitDraft.issuedLicenseId &&
      isIssuedLicenseAwaitingHqApproval(permitDraft.issuedLicenseId)
    ) {
      setRulesModalOpen(false)
      toast.error(t('reservations.permitAwaitingHqApproval'))
      setStep('license')
      return
    }
    setSubmitting(true)
    try {
      const id = await persistDraft({ silent: true, wizardStep: step })
      if (!id) return
      const { data } = await api.post<Reservation>(`/reservations/${id}/submit`)
      setRulesModalOpen(false)
      toast.success(
        data.status === 'PENDING_MANAGEMENT_REVIEW'
          ? t('reservations.submitted')
          : t('reservations.created'),
      )
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate(`${createBase}/${data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  const patchValues = (patch: Partial<TravelValues>) =>
    setValues((current) => ({ ...current, ...patch }))

  async function onIndividualCountChosen(patch: Partial<TravelValues>) {
    const nextValues = { ...values, ...patch }
    patchValues(patch)
    if (type !== 'INDIVIDUAL') return
    const male = Number(nextValues.maleCount) || 0
    const female = Number(nextValues.femaleCount) || 0
    if (male + female <= 0) return
    setSubmitting(true)
    try {
      const id = await persistDraft({
        nextType: 'INDIVIDUAL',
        nextValues,
        wizardStep: 'dates',
        silent: Boolean(draftId),
      })
      if (id) setStep('dates')
    } finally {
      setSubmitting(false)
    }
  }

  async function selectPartyAndAdvance(item: { id: string }) {
    if (!type || (type !== 'CARAVAN' && type !== 'GROUP')) return
    const nextValues: TravelValues = {
      ...values,
      caravanId: type === 'CARAVAN' ? item.id : '',
      groupId: type === 'GROUP' ? item.id : '',
    }
    applyParty(item)
    setPartyDraft(emptyPartyDraft(subject))
    setSubmitting(true)
    try {
      const id = await persistDraft({
        nextType: type,
        nextValues,
        wizardStep: 'count',
        silent: Boolean(draftId),
      })
      if (id) setStep('count')
    } finally {
      setSubmitting(false)
    }
  }

  if (draftParam && (!draftHydrated || draftQuery.isLoading)) {
    return (
      <div className={userFormShellClassName}>
        <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />
        <LoadingState />
        <p className="mt-3 text-center text-sm text-ink-500">{t('reservations.draftLoading')}</p>
      </div>
    )
  }

  if (draftParam && draftQuery.isError) {
    return (
      <div className={userFormShellClassName}>
        <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />
        <p className="text-sm text-red-700">{t('reservations.notFound')}</p>
      </div>
    )
  }

  if (isAdminCreate && forUserId && forUserQuery.isLoading) {
    return (
      <div className={userFormShellClassName}>
        <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />
        <LoadingState />
      </div>
    )
  }

  if (isAdminCreate && forUserId && forUserQuery.isError) {
    return (
      <div className={userFormShellClassName}>
        <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />
        <p className="text-sm text-red-700">{t('reservations.pickApplicantNotFound')}</p>
      </div>
    )
  }

  if (!subjectReady) {
    return null
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('reservations.createPageTitle', { year: yearLabel })}
        subtitle={
          subject && isAdminCreate ? (
            <span className="flex flex-wrap items-center gap-2">
              <FormMetaChip
                icon={User}
                label={t('reservations.createOnBehalfOf', { name: subject.fullName })}
              />
              {'nationalId' in subject && subject.nationalId ? (
                <FormMetaChip icon={IdCard} copyValue={subject.nationalId} />
              ) : null}
            </span>
          ) : draftId ? (
            t('reservations.draftResume')
          ) : undefined
        }
      />

      <CreateStepBar
        current={step}
        maxReached={maxReachedStep}
        steps={steps}
        type={type}
        onSelect={(next) => {
          const target = steps.indexOf(next)
          if (target >= 0 && target <= maxReachedIndex) setStep(next)
        }}
      />

      <AppForm
        key={step}
        autoFocusFirst={step !== 'type'}
        onSubmit={submit}
        className={`animate-page-fade-in ${
          step === 'type' || step === 'party' ? 'space-y-4' : `space-y-4 p-6 ${cardClassName}`
        }`}
      >
        {step === 'type' ? (
          <>
            <div className="flex flex-col gap-4">
              {types.map((item) => {
                const Icon = typeIcons[item]
                const enabled = Boolean(settings.data?.[settingsEnabledKey(item)])
                const selected = type === item
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!enabled || submitting}
                    data-enter-ignore=""
                    onClick={() => void goAfterType(item)}
                    className={`w-full rounded-[22px] border p-5 text-start transition-[box-shadow,transform,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:p-6 ${
                      selected
                        ? 'border-teal-500 bg-teal-50 shadow-[0_16px_36px_rgba(46,189,182,0.24),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.32)]'
                        : 'border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]'
                    } ${!enabled || submitting ? 'cursor-not-allowed' : `cursor-pointer ${typeCardHoverClass}`}`}
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
                      <ReceptionTypeIntro
                        type={item}
                        settings={settings.data}
                        className="mt-4"
                      />
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
            subjectUser={subject}
            hideExistingParties={isAdminCreate}
            knownSelected={
              draftQuery.data?.caravan && partyKind === 'CARAVAN'
                ? {
                    id: draftQuery.data.caravan.id,
                    name: draftQuery.data.caravan.name,
                    maleCount: draftQuery.data.caravan.maleCount ?? 0,
                    femaleCount: draftQuery.data.caravan.femaleCount ?? 0,
                    totalCount: draftQuery.data.caravan.totalCount ?? 0,
                    city: draftQuery.data.caravan.city,
                  }
                : draftQuery.data?.group && partyKind === 'GROUP'
                  ? {
                      id: draftQuery.data.group.id,
                      name: draftQuery.data.group.name,
                      maleCount: draftQuery.data.group.maleCount ?? 0,
                      femaleCount: draftQuery.data.group.femaleCount ?? 0,
                      totalCount: draftQuery.data.group.totalCount ?? 0,
                      city: draftQuery.data.group.city,
                    }
                  : null
            }
            onDraftChange={(patch) => {
              setPartyDraft((current) => ({ ...current, ...patch }))
              if (selectedPartyId()) {
                setValues((current) => ({ ...current, caravanId: '', groupId: '' }))
              }
            }}
            onSelect={(item) => {
              void selectPartyAndAdvance(item)
            }}
            onAdvance={undefined}
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
                if (type === 'INDIVIDUAL') {
                  void onIndividualCountChosen(patch)
                  return
                }
                patchValues(patch)
              }}
              type={type}
            />
          </>
        ) : null}

        {step === 'dates' ? (
          <ReservationDateFields values={values} onChange={patchValues} showOccasionHint={false} />
        ) : null}

        {step === 'services' ? (
          <ReservationApplicantFields values={values} onChange={patchValues} />
        ) : null}

        {step === 'license' ? (
          <ReservationCaravanLicenseStep
            caravanId={values.caravanId}
            year={reservationYear}
            value={permitDraft}
            onChange={(patch) => setPermitDraft((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-6">
          {stepIndex > 0 ? (
            <Button type="button" onClick={goBack} disabled={submitting}>
              <ChevronRight className="size-4" aria-hidden />
              {t('reservations.prevStep')}
            </Button>
          ) : null}
          <Button
            type="submit"
            className="ms-auto"
            disabled={submitting || (step === 'type' && !type) || finalSubmitBlocked}
            aria-describedby={finalSubmitBlocked ? 'final-submit-blocked-reason' : undefined}
          >
            {lastStep ? t('reservations.finalSubmit') : t('reservations.nextStep')}
            {lastStep ? <Check className="size-4" aria-hidden /> : <ChevronLeft className="size-4" aria-hidden />}
          </Button>
        </div>
        {finalSubmitBlocked ? (
          <StepBlockedNotice
            id="final-submit-blocked-reason"
            title={t('reservations.finalSubmitBlockedTitle')}
            message={t('reservations.permitAwaitingHqApproval')}
          />
        ) : null}
        {step === 'dates' ? <OccasionStayHint /> : null}
      </AppForm>
      {rulesModalOpen && type ? (
        <ReceptionRulesModal
          type={type}
          settings={settings.data}
          submitting={submitting}
          onClose={() => {
            if (!submitting) setRulesModalOpen(false)
          }}
          onConfirm={() => {
            void finalizeReservation()
          }}
        />
      ) : null}
    </div>
  )
}

function CreateStepBar({
  current,
  maxReached,
  steps,
  type,
  onSelect,
}: {
  current: CreateStep
  maxReached: CreateStep
  steps: CreateStep[]
  type: ReservationType | ''
  onSelect: (step: CreateStep) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const currentIndex = steps.indexOf(current)
  const maxReachedIndex = Math.max(currentIndex, steps.indexOf(maxReached))
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
            total >= 6 ? 'grid-cols-3 sm:grid-cols-6' : total === 5 ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {steps.map((item, index) => {
            const Icon =
              item === 'party' ? (type === 'CARAVAN' ? Footprints : Users) : createStepIcons[item]
            const state =
              index === currentIndex ? 'current' : index <= maxReachedIndex ? 'done' : 'pending'
            const styles = {
              done: 'border-teal-200 bg-teal-50 text-teal-800',
              current:
                'border-teal-500 bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.28)]',
              pending: 'border-line bg-cream-50 text-ink-400',
            }
            const clickable = index <= maxReachedIndex
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
    <section className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-3 py-2 shadow-[0_6px_16px_rgba(20,40,40,0.04)]">
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
