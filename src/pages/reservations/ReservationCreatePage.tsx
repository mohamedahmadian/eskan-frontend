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
  MapPin,
  Trash2,
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
import { isIranCountry } from '../../lib/geo'
import { isCaravanManager } from '../../lib/roles'
import type {
  Country,
  ManagedUser,
  Paginated,
  ReceptionCapacity,
  ReceptionCapacitySlice,
  ReceptionSettings,
  Reservation,
  ReservationPermitOptions,
  ReservationType,
} from '../../types/app'
import {
  CAPACITY_WARNING_RATIO,
  capacityKey,
  createWizardPath,
  isOwnerCreateDraft,
  partyMaxSize,
  isReceptionTypeAvailable,
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
  ReservationTravelInfoFields,
  ReservationApplicantFields,
  type TravelValues,
} from './ReservationTravelFields'
import {
  RESERVATION_DATE_OVERLAP_CHECK_ENABLED,
  fetchSubjectReservationSpans,
} from './reservation-date-overlap'
import { ReservationCaravanLicenseStep, type CaravanPermitDraft } from './ReservationCaravanLicenseStep'
import { StepBlockedNotice } from './ReservationStepNav'
import { StepProgressChart } from './StepProgressChart'
import { useDeleteOwnerDraft } from './useDeleteOwnerDraft'

const defaultTypes: ReservationType[] = ['INDIVIDUAL', 'GROUP', 'CARAVAN']
const caravanManagerTypes: ReservationType[] = ['CARAVAN', 'INDIVIDUAL', 'GROUP']
const typeCardHoverClass =
  'hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_18px_40px_rgba(46,189,182,0.28),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.35)]'
const typeIcons = { INDIVIDUAL: User, GROUP: Users, CARAVAN: Footprints }

type CreateStep = 'type' | 'party' | 'count' | 'dates' | 'services' | 'license'
type CreateStepOptions = {
  skipCaravanParty?: boolean
  skipType?: boolean
  skipLicense?: boolean
}
const individualCreateSteps: CreateStep[] = ['type', 'dates', 'services']
const groupCreateSteps: CreateStep[] = ['type', 'party', 'count', 'dates', 'services']
const caravanCreateSteps: CreateStep[] = ['type', 'party', 'count', 'dates', 'services', 'license']
const caravanCreateStepsWithoutParty: CreateStep[] = ['type', 'count', 'dates', 'services', 'license']

type MineCaravan = {
  id: string
  walkingRouteId?: string | null
}

async function fetchMyCaravans() {
  const { data } = await api.get<Paginated<MineCaravan>>('/caravans/mine', {
    params: { pageSize: 100 },
  })
  return data.items
}

function stepsForCreateType(
  type: ReservationType | '',
  options: CreateStepOptions = {},
): CreateStep[] {
  const list =
    type === 'CARAVAN'
      ? options.skipCaravanParty
        ? [...caravanCreateStepsWithoutParty]
        : [...caravanCreateSteps]
      : type === 'GROUP'
        ? [...groupCreateSteps]
        : [...individualCreateSteps]
  return list.filter((item) => {
    if (options.skipType && item === 'type') return false
    if (options.skipLicense && item === 'license') return false
    return true
  })
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

function withDefaultStayDates(
  values: TravelValues,
  settings?: Pick<ReceptionSettings, 'prophetDemiseDate' | 'imamRezaMartyrdomDate'> | null,
): TravelValues {
  const defaults = stayDatesFromOccasions(settings)
  const stayStartDate = values.stayStartDate || defaults.stayStartDate
  const stayEndDate = values.stayEndDate || defaults.stayEndDate
  const walkingStartDate = values.walkingStartDate || defaults.walkingStartDate
  if (
    stayStartDate === values.stayStartDate &&
    stayEndDate === values.stayEndDate &&
    walkingStartDate === values.walkingStartDate
  ) {
    return values
  }
  return { ...values, stayStartDate, stayEndDate, walkingStartDate }
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

function valuesFromReservation(reservation: Reservation): TravelValues {
  const male = String(reservation.requestedMaleCount || reservation.maleCount || 0)
  const female = String(reservation.requestedFemaleCount || reservation.femaleCount || 0)
  return {
    provinceId: reservation.originCity?.provinceId || '',
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
  options: CreateStepOptions = {},
): CreateStep {
  const steps = stepsForCreateType(type, options)
  let requestedStep = savedStep
  if (requestedStep && !steps.includes(requestedStep as CreateStep)) {
    if (requestedStep === 'type') requestedStep = steps[0]
    else if (requestedStep === 'party') requestedStep = 'count'
    else if (requestedStep === 'count') requestedStep = 'dates'
    else if (requestedStep === 'license') requestedStep = steps[steps.length - 1]
  }
  if (requestedStep && steps.includes(requestedStep as CreateStep)) {
    return requestedStep as CreateStep
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
  options: CreateStepOptions = {},
): CreateStep {
  if (!type) return a
  const list = stepsForCreateType(type, options)
  const aIndex = list.indexOf(a)
  const bIndex = list.indexOf(b)
  if (aIndex < 0) return bIndex >= 0 ? b : (list[0] ?? a)
  if (bIndex < 0) return a
  return aIndex >= bIndex ? a : b
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
  const { user, refresh } = useAuth()
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
  const deleteDraft = useDeleteOwnerDraft()
  const reservationYear = draftId ? draftYear : year
  const myCaravansQuery = useQuery({
    queryKey: ['caravans', 'mine', 'lookup'],
    enabled: !isAdminCreate,
    queryFn: fetchMyCaravans,
  })
  const soleCaravan =
    !isAdminCreate && myCaravansQuery.data?.length === 1 ? myCaravansQuery.data[0] : null
  const skipCaravanParty = Boolean(soleCaravan)
  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''

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

  const draftQuery = useQuery({
    queryKey: ['reservations', draftParam, 'create-draft'],
    enabled: Boolean(draftParam),
    retry: false,
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
  const originCountryId = draftQuery.data?.originCountry?.id ?? ''
  const admissionTypes: ReservationType[] = types
  const skipLicenseStep =
    type === 'CARAVAN' && Boolean(originCountryId) && !isIranCountry(originCountryId, iranId)
  const createOptions = (
    nextType: ReservationType | '' = type,
    skipParty = skipCaravanParty,
  ): CreateStepOptions => ({
    skipCaravanParty: skipParty,
    skipLicense: nextType === 'CARAVAN' && Boolean(originCountryId) && !isIranCountry(originCountryId, iranId),
  })
  const steps = useMemo(
    () =>
      stepsForCreateType(type, {
        skipCaravanParty,
        skipLicense: skipLicenseStep,
      }),
    [type, skipCaravanParty, skipLicenseStep],
  )
  const stepIndex = steps.indexOf(step)
  const maxReachedIndex = Math.max(stepIndex, steps.indexOf(maxReachedStep))
  const lastStep = stepIndex === steps.length - 1
  const partyKind: PartyKind | null = type === 'GROUP' || type === 'CARAVAN' ? type : null
  const finalSubmitBlocked =
    lastStep &&
    !skipLicenseStep &&
    type === 'CARAVAN' &&
    permitDraft.source === 'ISSUED_LICENSE' &&
    Boolean(permitDraft.issuedLicenseId) &&
    isIssuedLicenseAwaitingHqApproval(permitDraft.issuedLicenseId)
  const needsPartyCity = !subject?.cityId
  const subjectReady = !isAdminCreate || Boolean(subject) || Boolean(draftParam && draftHydrated)
  const subjectNationalId =
    subject && 'nationalId' in subject ? (subject.nationalId ?? null) : null
  const existingReservationsQuery = useQuery({
    queryKey: [
      'reservations',
      'date-overlap',
      isAdminCreate ? forUserId || 'admin' : 'mine',
      subjectNationalId ?? '',
    ],
    enabled:
      RESERVATION_DATE_OVERLAP_CHECK_ENABLED &&
      (isAdminCreate ? Boolean(forUserId) : Boolean(user?.id)),
    queryFn: () =>
      fetchSubjectReservationSpans({
        forSelf: !isAdminCreate,
        subjectId: isAdminCreate ? forUserId || undefined : user?.id,
        subjectNationalId,
      }),
  })
  const datesOverlapError = useMemo(() => {
    if (!existingReservationsQuery.data) return null
    if (travelDatesError(values, t)) return null
    return travelDatesError(values, t, {
      others: existingReservationsQuery.data,
      excludeId: draftId || undefined,
    })
  }, [draftId, existingReservationsQuery.data, t, values])

  const settings = useQuery({
    queryKey: ['reception-settings', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${year}`)
      return data
    },
  })

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
    if (nextType === 'CARAVAN' && !isAdminCreate && myCaravansQuery.isPending) return
    if (!countries.isSuccess) return
    const skipParty = nextType === 'CARAVAN' && Boolean(soleCaravan)
    const nextValues = withDefaultStayDates(
      valuesFromReservation(reservation),
      settings.data,
    )
    if (skipParty && soleCaravan && !nextValues.caravanId) {
      nextValues.caravanId = soleCaravan.id
      if (soleCaravan.walkingRouteId && !nextValues.walkingRouteId) {
        nextValues.walkingRouteId = soleCaravan.walkingRouteId
      }
    }
    const nextPermit = permitFromReservation(reservation)
    setDraftId(reservation.id)
    setDraftYear(reservation.year)
    setType(nextType)
    setValues(nextValues)
    setPermitDraft(nextPermit)
    setPartyDraft(emptyPartyDraft(subject ?? user))
    const reached = inferCreateStep(
      nextType,
      nextValues,
      nextPermit,
      reservation.createWizardStep,
      createOptions(nextType, skipParty),
    )
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
    isAdminCreate,
    myCaravansQuery.isPending,
    soleCaravan,
    settings.data,
    countries.isSuccess,
  ])

  useEffect(() => {
    if (!draftParam || !draftHydrated || !draftQuery.isError) return
    navigate(createBase, { replace: true })
  }, [draftParam, draftHydrated, draftQuery.isError, createBase, navigate])

  useEffect(() => {
    if (type !== 'CARAVAN' || !skipCaravanParty || !soleCaravan) return
    if (!values.caravanId) {
      setValues((current) => ({
        ...current,
        caravanId: soleCaravan.id,
        groupId: '',
        ...(soleCaravan.walkingRouteId ? { walkingRouteId: soleCaravan.walkingRouteId } : {}),
      }))
    }
    if (step === 'party') {
      setStep('count')
      setMaxReachedStep((current) =>
        furtherCreateStep(
          'CARAVAN',
          'count',
          current === 'party' ? 'count' : current,
          createOptions('CARAVAN', true),
        ),
      )
    }
  }, [type, skipCaravanParty, soleCaravan, values.caravanId, step])

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
    setPartyDraft((current) => ({
      ...current,
      provinceId: current.provinceId || subject.provinceId || '',
      cityId: current.cityId || subject.cityId || '',
      managerUserId:
        current.managerUserId ||
        (shouldPickCaravanManager(subject) ? '' : subject.id),
    }))
  }, [subject, draftParam])

  useEffect(() => {
    setValues((current) => withDefaultStayDates(current, settings.data))
  }, [settings.data])

  useEffect(() => {
    if (!type || !steps.length || steps.includes(step)) return
    setStep(step === 'license' ? steps[steps.length - 1] : steps[0])
  }, [type, steps, step])

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
      ...(nextType === 'CARAVAN' && !skipLicenseStep
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
    skipCaravanParty?: boolean
  }): Promise<string | null> {
    const nextType = options?.nextType ?? (type || null)
    if (!nextType) return draftId || null
    const sourceValues = options?.nextValues ?? values
    const nextValues = withDefaultStayDates(sourceValues, settings.data)
    if (nextValues !== sourceValues) {
      setValues(nextValues)
    }
    const nextPermit = options?.nextPermit ?? permitDraft
    const skipParty = options?.skipCaravanParty ?? skipCaravanParty
    const stepOptions = createOptions(nextType, skipParty)
    const reached = furtherCreateStep(
      nextType,
      options?.wizardStep ?? step,
      nextType === type
        ? maxReachedStep
        : (options?.wizardStep ?? (stepOptions.skipType ? 'party' : 'type')),
      stepOptions,
    )
    if (nextType === type || options?.wizardStep) {
      setMaxReachedStep((current) =>
        nextType === type
          ? furtherCreateStep(nextType, reached, current, stepOptions)
          : reached,
      )
    }
    const payload = {
      ...draftPayload(nextType, nextValues, nextPermit, reached),
      ...(isAdminCreate && forUserId && !draftId ? { createdById: forUserId } : {}),
    }
    try {
      let savedId: string
      if (draftId) {
        const { createdById: _createdById, ...patch } = payload
        const { data } = await api.patch<Reservation>(`/reservations/${draftId}`, patch)
        savedId = data.id
      } else {
        const { data } = await api.post<Reservation>('/reservations', payload)
        setDraftId(data.id)
        navigate(createWizardPath(data.id, createBase, forUserId || undefined), { replace: true })
        await refresh()
        if (!options?.silent) {
          toast.success(t('reservations.draftSaved'))
        }
        savedId = data.id
      }
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      return savedId
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      return null
    }
  }

  async function goAfterType(next: ReservationType) {
    selectType(next)
    let nextStep: CreateStep = next === 'GROUP' || next === 'CARAVAN' ? 'party' : 'dates'
    let nextValues: TravelValues =
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
    let skipParty = false
    if (next === 'CARAVAN' && !isAdminCreate) {
      let items = myCaravansQuery.data
      if (items === undefined) {
        try {
          items = await queryClient.fetchQuery({
            queryKey: ['caravans', 'mine', 'lookup'],
            queryFn: fetchMyCaravans,
          })
        } catch {
          items = []
        }
      }
      const caravans = items ?? []
      if (caravans.length === 1) {
        const sole = caravans[0]
        nextValues = {
          ...nextValues,
          caravanId: sole.id,
          groupId: '',
          ...(sole.walkingRouteId ? { walkingRouteId: sole.walkingRouteId } : {}),
        }
        applyParty(sole, sole.walkingRouteId ?? undefined)
        nextStep = 'count'
        skipParty = true
      }
    }
    setSubmitting(true)
    try {
      const id = await persistDraft({
        nextType: next,
        nextValues,
        nextPermit: { source: '', issuedLicenseId: '', permitImageId: '' },
        wizardStep: nextStep,
        skipCaravanParty: skipParty,
      })
      if (id) {
        setMaxReachedStep(nextStep)
        setStep(nextStep)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function goToCreateStep(next: CreateStep) {
    if (next === step) return
    if (type) {
      const id = await persistDraft({
        silent: true,
        wizardStep: furtherCreateStep(type, maxReachedStep, next, createOptions()),
      })
      if (!id) return
    }
    setStep(next)
  }

  async function goBack() {
    if (stepIndex <= 0) return
    setSubmitting(true)
    try {
      await goToCreateStep(steps[stepIndex - 1])
    } finally {
      setSubmitting(false)
    }
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
      await refresh()
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
      const max = partyMaxSize(type)
      if (max && male + female > max) {
        toast.error(
          t(type === 'CARAVAN' ? 'reservations.caravanMaxExceeded' : 'reservations.groupMaxExceeded', {
            count: formatNumber(max, locale),
          }),
        )
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
    if (step === 'license' && !skipLicenseStep) {
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

  async function assertTravelDatesReady() {
    try {
      const others = RESERVATION_DATE_OVERLAP_CHECK_ENABLED
        ? (existingReservationsQuery.data ??
          (await existingReservationsQuery.refetch()).data ??
          [])
        : []
      const dateError = travelDatesError(values, t, {
        others,
        excludeId: draftId || undefined,
      })
      if (dateError) {
        toast.error(dateError)
        return false
      }
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      return false
    }
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
    if (step === 'dates' || lastStep) {
      if (!(await assertTravelDatesReady())) {
        if (lastStep && step !== 'dates') setStep('dates')
        return
      }
    }
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
    if (type === 'CARAVAN' && !skipLicenseStep) {
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
    setSubmitting(true)
    try {
      const id = await persistDraft({ silent: true, wizardStep: step })
      if (!id) return
      if (
        type === 'CARAVAN' &&
        !skipLicenseStep &&
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
    if (!(await assertTravelDatesReady())) {
      setRulesModalOpen(false)
      setStep('dates')
      return
    }
    if (
      type === 'CARAVAN' &&
      !skipLicenseStep &&
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

  if (draftParam && !draftHydrated) {
    return (
      <div className={userFormShellClassName}>
        <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />
        <LoadingState />
        <p className="mt-3 text-center text-sm text-ink-500">{t('reservations.draftLoading')}</p>
      </div>
    )
  }

  if (draftParam && draftQuery.isError) {
    if (draftHydrated) {
      return (
        <div className={userFormShellClassName}>
          <PageHeader title={t('reservations.createPageTitle', { year: yearLabel })} />
          <LoadingState />
        </div>
      )
    }
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
        action={
          draftId ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() =>
                deleteDraft(draftId, () => navigate(createBase, { replace: true }))
              }
            >
              <Trash2 className="size-4" aria-hidden />
              {t('reservations.deleteDraft')}
            </Button>
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
          if (target < 0 || target > maxReachedIndex || next === step || submitting) return
          void (async () => {
            setSubmitting(true)
            try {
              await goToCreateStep(next)
            } finally {
              setSubmitting(false)
            }
          })()
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
              {admissionTypes.map((item) => {
                const Icon = typeIcons[item]
                const enabled = isReceptionTypeAvailable(
                  settings.data,
                  item,
                  originCountryId || undefined,
                )
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
            {selectedCapacity && type !== 'CARAVAN' ? (
              <RemainingCapacityCard type={type} slice={selectedCapacity} locale={locale} />
            ) : null}
            <ReservationCountFields
              values={values}
              onChange={patchValues}
              type={type}
            />
          </>
        ) : null}

        {step === 'dates' ? (
          <ReservationTravelInfoFields
            values={values}
            onChange={patchValues}
            showOccasionHint={false}
            error={datesOverlapError}
            countryId={draftQuery.data?.originCountry?.id}
          />
        ) : null}

        {step === 'services' ? (
          <ReservationApplicantFields
            values={values}
            onChange={patchValues}
            reservationType={type}
            simCardRequestCount={draftQuery.data?.simCardRequestCount ?? 0}
            bankCardRequestCount={draftQuery.data?.bankCardRequestCount ?? 0}
          />
        ) : null}

        {step === 'license' && !skipLicenseStep ? (
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
            {lastStep
              ? t(step === 'services' ? 'reservations.createFileSubmit' : 'reservations.finalSubmit')
              : t('reservations.nextStep')}
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
      <div className="mb-3 flex items-center justify-start">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-800">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {t('reservations.steps.travel')}
        </span>
      </div>
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
            total >= 6
              ? 'grid-cols-3 sm:grid-cols-6'
              : total === 5
                ? 'grid-cols-5'
                : total === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-4'
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
