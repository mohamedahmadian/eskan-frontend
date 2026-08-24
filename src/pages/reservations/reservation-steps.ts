import {
  reservationStatuses,
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
  createdBy?: ReservationPerson
  basicInfoCompletedBy?: ReservationPerson | null
  managementReviewedBy?: ReservationPerson | null
  companionsCompletedBy?: ReservationPerson | null
  caravanContactsCompletedBy?: ReservationPerson | null
  insuranceCompletedBy?: ReservationPerson | null
  completedBy?: ReservationPerson | null
}

export const GROUP_MAX_SIZE = 20

export const reservationStepCodes = [
  'travel',
  'review',
  'companions',
  'contacts',
  'insurance',
  'complete',
] as const

export type ReservationStepCode = (typeof reservationStepCodes)[number]

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

export function stepsForType(type: ReservationType): ReservationStepCode[] {
  if (type === 'INDIVIDUAL') {
    return ['travel', 'review', 'insurance', 'complete']
  }
  if (type === 'GROUP') {
    return ['travel', 'review', 'companions', 'insurance', 'complete']
  }
  return ['travel', 'review', 'companions', 'contacts', 'insurance', 'complete']
}

export function currentStepFromStatus(
  status: ReservationStatus,
  type: ReservationType,
): ReservationStepCode {
  if (status === 'DRAFT') return 'travel'
  if (status === 'PENDING_MANAGEMENT_REVIEW') return 'review'
  if (status === 'COMPANIONS') return 'companions'
  if (status === 'CARAVAN_CONTACTS') return 'contacts'
  if (status === 'INSURANCE') return 'insurance'
  if (status === 'COMPLETED') return 'complete'
  return stepsForType(type)[0]
}

export function isStepDone(
  step: ReservationStepCode,
  status: ReservationStatus,
  type: ReservationType,
) {
  const steps = stepsForType(type)
  const current = currentStepFromStatus(status, type)
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return false
  }
  if (status === 'COMPLETED') return true
  return steps.indexOf(step) < steps.indexOf(current)
}

/** Owner can still edit these steps after completing them, until the file is finished. */
/** Steps the owner can walk back and forth after management review. */
export function ownerFlowSteps(type: ReservationType): ReservationStepCode[] {
  return stepsForType(type).filter(
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
  return reservation.completedBy
}

export function stepCardDate(step: ReservationStepCode, reservation: ReservationStepDates) {
  return stepCompletedAt(step, reservation) ?? (step === 'travel' ? reservation.createdAt : null)
}

export function progressPercent(status: ReservationStatus, type: ReservationType) {
  if (status === 'COMPLETED') return 100
  if (status === 'REJECTED' || status === 'CANCELLED' || status === 'DRAFT') {
    return status === 'DRAFT' ? 10 : 0
  }
  const steps = stepsForType(type)
  const current = currentStepFromStatus(status, type)
  const index = Math.max(0, steps.indexOf(current))
  return Math.round((index / steps.length) * 100)
}

export function listStepProgress(status: ReservationStatus, type: ReservationType) {
  const steps = stepsForType(type)
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return { currentIndex: -1, total: steps.length, remaining: 0, showRemaining: false }
  }
  const current = currentStepFromStatus(status, type)
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
