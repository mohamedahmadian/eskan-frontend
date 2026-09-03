import type { ReceptionSettings, ReservationType } from '../../types/app'
import type { ReservationStepCode } from './reservation-steps'

export type ReservationHelpMedia = {
  image?: string
  videoUrl?: string
}

export const reservationHelpKeys = [
  'travel',
  'review',
  'companions',
  'companionsCaravan',
  'contacts',
  'insurance',
  'complete',
  'placement',
] as const

export type ReservationHelpKey = (typeof reservationHelpKeys)[number]

export const reservationHelpField = {
  travel: 'helpTravel',
  review: 'helpReview',
  companions: 'helpCompanions',
  companionsCaravan: 'helpCompanionsCaravan',
  contacts: 'helpContacts',
  insurance: 'helpInsurance',
  complete: 'helpComplete',
  placement: 'helpPlacement',
} as const satisfies Record<ReservationHelpKey, keyof ReceptionSettings>

export function reservationHelpKey(
  step: ReservationStepCode,
  reservationType?: ReservationType,
): ReservationHelpKey {
  return step === 'companions' && reservationType === 'CARAVAN'
    ? 'companionsCaravan'
    : step
}

export function reservationHelpText(
  settings: Pick<ReceptionSettings, (typeof reservationHelpField)[ReservationHelpKey]> | undefined,
  key: ReservationHelpKey,
) {
  return settings?.[reservationHelpField[key]]?.trim() ?? ''
}

/** Optional media per step. Leave empty until real assets exist. */
export const reservationHelpMedia: Record<ReservationStepCode, ReservationHelpMedia> = {
  travel: {},
  review: {},
  companions: {},
  contacts: {},
  insurance: {},
  complete: {},
  placement: {},
}
