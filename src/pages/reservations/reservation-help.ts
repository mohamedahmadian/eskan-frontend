import type { ReservationStepCode } from './reservation-steps'

export type ReservationHelpMedia = {
  image?: string
  videoUrl?: string
}

/** Optional media per step. Leave empty until real assets exist. */
export const reservationHelpMedia: Record<ReservationStepCode, ReservationHelpMedia> = {
  travel: {},
  review: {},
  companions: {},
  contacts: {},
  insurance: {},
  complete: {},
}
