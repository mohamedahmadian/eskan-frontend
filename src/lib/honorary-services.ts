export const TRANSLATION_SERVICE_CODE = 'TRANSLATION'

export function isTranslationService(type?: {
  code?: string | null
  name?: string | null
} | null) {
  if (!type) return false
  if (type.code === TRANSLATION_SERVICE_CODE) return true
  return Boolean(type.name && /مترجم/.test(type.name))
}

export function canAssignReservationHonorary(reservation: {
  managementReviewedAt?: string | null
  status: string
}) {
  if (!reservation.managementReviewedAt) return false
  return (
    reservation.status !== 'DRAFT' &&
    reservation.status !== 'REJECTED' &&
    reservation.status !== 'CANCELLED'
  )
}

export function showReservationHonoraryAssignments(
  reservation: {
    honoraryAssignments?: { id: string }[]
    managementReviewedAt?: string | null
    status: string
  },
  canAssign?: boolean,
) {
  if (reservation.honoraryAssignments?.length) return true
  return Boolean(canAssign && canAssignReservationHonorary(reservation))
}
