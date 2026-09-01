import {
  reservationStatuses,
  type PlacementStatus,
  type ReservationMemberInsurancePaidMethod,
  type ReservationMemberInsuranceStatus,
  type ReservationPerson,
  type ReservationStatus,
  type ReservationType,
} from '../../types/app'

export const inProgressFilter = 'IN_PROGRESS'
export const inProgressStatuses: ReservationStatus[] = [
  reservationStatuses.DRAFT,
  reservationStatuses.COMPANIONS,
  reservationStatuses.CARAVAN_CONTACTS,
  reservationStatuses.INSURANCE,
]

type ReservationStepDates = {
  createdAt: string
  basicInfoCompletedAt: string | null
  managementReviewedAt: string | null
  companionsCompletedAt: string | null
  caravanContactsCompletedAt: string | null
  insuranceCompletedAt: string | null
  completedAt: string | null
  placementCompletedAt?: string | null
  createdBy?: ReservationPerson
  basicInfoCompletedBy?: ReservationPerson | null
  managementReviewedBy?: ReservationPerson | null
  companionsCompletedBy?: ReservationPerson | null
  caravanContactsCompletedBy?: ReservationPerson | null
  insuranceCompletedBy?: ReservationPerson | null
  completedBy?: ReservationPerson | null
  placementCompletedBy?: ReservationPerson | null
}

export const GROUP_MAX_SIZE = 20

/** Shared headcount cap for group and caravan files. */
export function partyMaxSize(type: ReservationType | '' | null | undefined) {
  if (type === 'GROUP' || type === 'CARAVAN') return GROUP_MAX_SIZE
  return undefined
}

export function requestedHeadcount(row: {
  requestedMaleCount?: number
  requestedFemaleCount?: number
  maleCount: number
  femaleCount: number
}) {
  return {
    male: row.requestedMaleCount ?? row.maleCount,
    female: row.requestedFemaleCount ?? row.femaleCount,
  }
}

/** Lists show requested size while the file is waiting for management. */
export function listHeadcount(row: {
  status: ReservationStatus
  requestedMaleCount?: number
  requestedFemaleCount?: number
  maleCount: number
  femaleCount: number
  totalCount: number
}) {
  if (row.status === reservationStatuses.PENDING_MANAGEMENT_REVIEW) {
    const { male, female } = requestedHeadcount(row)
    return { male, female, total: male + female }
  }
  return { male: row.maleCount, female: row.femaleCount, total: row.totalCount }
}

/** Travel form / gender before management has set approved counts. */
export function workingHeadcount(row: {
  managementReviewedAt?: string | null
  requestedMaleCount?: number
  requestedFemaleCount?: number
  maleCount: number
  femaleCount: number
}) {
  if (row.managementReviewedAt) {
    return { male: row.maleCount, female: row.femaleCount }
  }
  return requestedHeadcount(row)
}

export const reservationStepCodes = [
  'travel',
  'review',
  'companions',
  'contacts',
  'insurance',
  'complete',
  'placement',
] as const

export type ReservationStepCode = (typeof reservationStepCodes)[number]

/** i18n key for wizard / timeline step titles (caravan companions → زائرین). */
export function stepLabelKey(
  step: ReservationStepCode,
  type?: ReservationType | null,
) {
  if (step === 'companions' && type === 'CARAVAN') {
    return 'reservations.steps.companionsCaravan'
  }
  return `reservations.steps.${step}`
}

export const contactRoles = [
  'DEPUTY',
  'CLERIC',
  'CULTURAL',
  'SECURITY',
  'RECEPTION',
] as const

export const selfAssignableContactRoles = [
  'CLERIC',
  'CULTURAL',
  'SECURITY',
  'RECEPTION',
] as const

export type ReservationStepSource = {
  requestsAccommodation?: boolean
  placementStatus?: PlacementStatus | null
  internationalWorkflow?: boolean
}

export function stepsForType(
  type: ReservationType,
  source?: ReservationStepSource | boolean,
): ReservationStepCode[] {
  const requestsAccommodation =
    typeof source === 'boolean' ? source : Boolean(source?.requestsAccommodation)
  const international =
    typeof source === 'object' && Boolean(source?.internationalWorkflow)
  const base: ReservationStepCode[] = international
    ? ['travel', 'complete']
    : type === 'INDIVIDUAL'
      ? ['travel', 'review', 'insurance', 'complete']
      : type === 'GROUP'
        ? ['travel', 'review', 'companions', 'insurance', 'complete']
        : ['travel', 'review', 'companions', 'contacts', 'insurance', 'complete']
  if (requestsAccommodation && !international) return [...base, 'placement']
  return base
}

export function currentStepFromStatus(
  status: ReservationStatus,
  type: ReservationType,
  source?: ReservationStepSource,
): ReservationStepCode {
  if (status === 'DRAFT') return 'travel'
  if (status === 'PENDING_MANAGEMENT_REVIEW') return 'review'
  if (status === 'COMPANIONS') return 'companions'
  if (status === 'CARAVAN_CONTACTS') return 'contacts'
  if (status === 'INSURANCE') return 'insurance'
  if (status === 'COMPLETED') {
    if (source?.requestsAccommodation && !source.internationalWorkflow) return 'placement'
    return 'complete'
  }
  return stepsForType(type, source)[0]
}

export function isStepDone(
  step: ReservationStepCode,
  status: ReservationStatus,
  type: ReservationType,
  source?: ReservationStepSource,
) {
  const steps = stepsForType(type, source)
  const current = currentStepFromStatus(status, type, source)
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return false
  }
  if (status === 'COMPLETED') {
    if (step === 'placement') return source?.placementStatus === 'PLACED'
    return true
  }
  return steps.indexOf(step) < steps.indexOf(current)
}

/** Owner can still edit these steps after completing them, until the file is finished. */
/** Steps the owner can walk back and forth after management review. */
export function ownerFlowSteps(
  type: ReservationType,
  source?: ReservationStepSource,
): ReservationStepCode[] {
  return stepsForType(type, source).filter(
    (step) => step === 'companions' || step === 'contacts' || step === 'insurance',
  )
}

export function neighborFlowStep(
  type: ReservationType,
  step: ReservationStepCode,
  direction: -1 | 1,
): ReservationStepCode | null {
  const flow = ownerFlowSteps(type)
  const index = flow.indexOf(step)
  if (index < 0) return null
  return flow[index + direction] ?? null
}

export function ownerCanEditStep(
  step: ReservationStepCode,
  status: ReservationStatus,
  type: ReservationType,
) {
  if (step === 'companions') {
    if (type === 'GROUP') return status === 'COMPANIONS' || status === 'INSURANCE'
    if (type === 'CARAVAN') {
      return (
        status === 'COMPANIONS' ||
        status === 'CARAVAN_CONTACTS' ||
        status === 'INSURANCE'
      )
    }
    return false
  }
  if (step === 'contacts') {
    return type === 'CARAVAN' && (status === 'CARAVAN_CONTACTS' || status === 'INSURANCE')
  }
  return false
}

export function stepCompletedAt(step: ReservationStepCode, reservation: ReservationStepDates) {
  if (step === 'travel') return reservation.basicInfoCompletedAt
  if (step === 'review') return reservation.managementReviewedAt
  if (step === 'companions') return reservation.companionsCompletedAt
  if (step === 'contacts') return reservation.caravanContactsCompletedAt
  if (step === 'insurance') return reservation.insuranceCompletedAt
  if (step === 'placement') return reservation.placementCompletedAt ?? null
  return reservation.completedAt
}

export function stepHasProgress(step: ReservationStepCode, reservation: ReservationStepDates) {
  if (step === 'travel') {
    return Boolean(reservation.basicInfoCompletedAt || reservation.createdAt)
  }
  return Boolean(stepCompletedAt(step, reservation))
}

export function stepCompletedBy(
  step: ReservationStepCode,
  reservation: ReservationStepDates,
): ReservationPerson | null | undefined {
  if (step === 'travel') {
    return reservation.basicInfoCompletedBy ?? reservation.createdBy ?? null
  }
  if (step === 'review') return reservation.managementReviewedBy
  if (step === 'companions') return reservation.companionsCompletedBy
  if (step === 'contacts') return reservation.caravanContactsCompletedBy
  if (step === 'insurance') return reservation.insuranceCompletedBy
  if (step === 'placement') return reservation.placementCompletedBy
  return reservation.completedBy
}

export function stepCardDate(step: ReservationStepCode, reservation: ReservationStepDates) {
  return stepCompletedAt(step, reservation) ?? (step === 'travel' ? reservation.createdAt : null)
}

export function progressPercent(
  status: ReservationStatus,
  type: ReservationType,
  source?: ReservationStepSource,
) {
  if (status === 'COMPLETED') {
    if (
      source?.internationalWorkflow ||
      !source?.requestsAccommodation ||
      source.placementStatus === 'PLACED'
    ) {
      return 100
    }
  }
  if (status === 'REJECTED' || status === 'CANCELLED' || status === 'DRAFT') {
    return status === 'DRAFT' ? 10 : 0
  }
  const steps = stepsForType(type, source)
  const current = currentStepFromStatus(status, type, source)
  const index = Math.max(0, steps.indexOf(current))
  return Math.round((index / steps.length) * 100)
}

export function listStepProgress(
  status: ReservationStatus,
  type: ReservationType,
  source?: ReservationStepSource,
) {
  const steps = stepsForType(type, source)
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return { currentIndex: -1, total: steps.length, remaining: 0, showRemaining: false }
  }
  const current = currentStepFromStatus(status, type, source)
  const currentIndex = Math.max(0, steps.indexOf(current))
  const remaining = Math.max(0, steps.length - currentIndex - 1)
  return { currentIndex, total: steps.length, remaining, showRemaining: remaining > 0 }
}

export function settingsEnabledKey(type: ReservationType) {
  if (type === 'INDIVIDUAL') return 'individualEnabled' as const
  if (type === 'GROUP') return 'groupEnabled' as const
  return 'caravanEnabled' as const
}

export function validReturnStatuses(type: ReservationType): ReservationStatus[] {
  if (type === 'INDIVIDUAL') return ['DRAFT', 'INSURANCE']
  if (type === 'GROUP') return ['DRAFT', 'COMPANIONS', 'INSURANCE']
  return ['DRAFT', 'COMPANIONS', 'CARAVAN_CONTACTS', 'INSURANCE']
}

const rewindStatusOrder: ReservationStatus[] = [
  'DRAFT',
  'PENDING_MANAGEMENT_REVIEW',
  'COMPANIONS',
  'CARAVAN_CONTACTS',
  'INSURANCE',
  'COMPLETED',
]

function statusRank(status: ReservationStatus) {
  return rewindStatusOrder.indexOf(status)
}

/** Stages management can rewind a file to, from its current status. */
export function validRewindStatuses(
  type: ReservationType,
  status: ReservationStatus,
): ReservationStatus[] {
  if (status === 'CANCELLED') return []
  const allowed = validReturnStatuses(type)
  if (status === 'REJECTED') return allowed
  const currentRank = statusRank(status)
  if (currentRank < 0) return []
  return allowed.filter((item) => statusRank(item) < currentRank)
}

export const CAPACITY_WARNING_RATIO = 0.8

export function capacityKey(type: ReservationType) {
  if (type === 'INDIVIDUAL') return 'individual' as const
  if (type === 'GROUP') return 'group' as const
  return 'caravan' as const
}

export function isInsuranceAccepted(status: ReservationMemberInsuranceStatus) {
  return status === 'PAID' || status === 'APPROVED'
}

export function insurancePaidMethodLabel(
  method: ReservationMemberInsurancePaidMethod | null | undefined,
  t: (key: string) => string,
) {
  if (!method) return null
  return t(`reservations.insurancePaidMethods.${method}`)
}

export function canPayInsurance(status: ReservationMemberInsuranceStatus) {
  return status === 'PENDING' || status === 'REJECTED'
}

export function summarizeInsurance(
  members: {
    insuranceStatus: ReservationMemberInsuranceStatus
    insurancePaidAt?: string | null
    insurancePaidAmount?: number | null
  }[],
  fallbackPremium = 0,
) {
  const pending = members.filter((item) => item.insuranceStatus === 'PENDING').length
  const paid = members.filter((item) => item.insuranceStatus === 'PAID').length
  const approved = members.filter((item) => item.insuranceStatus === 'APPROVED').length
  const rejected = members.filter((item) => item.insuranceStatus === 'REJECTED').length
  const accepted = members.filter((item) => isInsuranceAccepted(item.insuranceStatus))
  const paidAmount = accepted.reduce(
    (sum, item) => sum + (item.insurancePaidAmount ?? fallbackPremium),
    0,
  )
  const lastPaidAt =
    members
      .map((item) => item.insurancePaidAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null
  return {
    total: members.length,
    pending,
    paid: 0,
    approved: paid + approved,
    rejected,
    paidAmount,
    lastPaidAt,
    completed: members.length > 0 && pending === 0 && rejected === 0,
  }
}

/** Owner create-wizard draft (never submitted / not admin-returned). */
export function isOwnerCreateDraft(reservation: {
  status: ReservationStatus
  returnedToStatus?: ReservationStatus | null
}) {
  return reservation.status === 'DRAFT' && !reservation.returnedToStatus
}

export function canAdjustApprovedCapacity(
  type: ReservationType,
  status: ReservationStatus,
) {
  if (type === 'INDIVIDUAL') return false
  return (
    status === 'COMPANIONS' ||
    status === 'CARAVAN_CONTACTS' ||
    status === 'INSURANCE'
  )
}

export function applicantSectionKey(type: ReservationType) {
  if (type === 'CARAVAN') return 'reservations.applicantSectionCaravan'
  if (type === 'GROUP') return 'reservations.applicantSectionGroup'
  return 'reservations.applicantSectionIndividual'
}

export function applicantHintKey(type: ReservationType) {
  if (type === 'CARAVAN') return 'reservations.applicantHintCaravan'
  if (type === 'GROUP') return 'reservations.applicantHintGroup'
  return 'reservations.applicantHintIndividual'
}

export function createWizardPath(
  draftId: string,
  base: '/my-reservations' | '/reservations' = '/my-reservations',
  forUserId?: string,
) {
  const params = new URLSearchParams({ draft: draftId })
  if (forUserId) params.set('forUser', forUserId)
  return `${base}/new?${params.toString()}`
}
