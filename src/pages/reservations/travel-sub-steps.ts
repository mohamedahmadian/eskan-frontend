import type { ReservationType } from '../../types/app'
import type { TravelValues } from './ReservationTravelFields'

export const travelSubSteps = ['party', 'count', 'dates', 'services', 'license', 'optional'] as const
export type TravelSubStep = (typeof travelSubSteps)[number]

export function travelSubStepsForType(
  type: ReservationType,
  options: { license?: boolean } = {},
): TravelSubStep[] {
  if (type === 'INDIVIDUAL') {
    return ['dates', 'services']
  }
  const steps: TravelSubStep[] = ['party', 'count', 'dates', 'services']
  if (type === 'CARAVAN' && options.license) steps.push('license')
  return steps
}

export function travelSubStepLabelKey(step: TravelSubStep, type: ReservationType): string {
  if (step === 'party') {
    return type === 'CARAVAN' ? 'reservations.createSteps.caravan' : 'reservations.createSteps.group'
  }
  return `reservations.createSteps.${step}`
}

/** Furthest sub-step that already has enough data to treat as reached. */
export function inferTravelSubMaxReached(
  type: ReservationType,
  values: TravelValues,
  options: { license?: boolean } = {},
): TravelSubStep {
  const steps = travelSubStepsForType(type, options)
  let furthest: TravelSubStep = steps[0]

  for (const step of steps) {
    if (step === 'count') {
      const requestedTotal =
        (Number(values.requestedMaleCount) || 0) + (Number(values.requestedFemaleCount) || 0)
      const total = (Number(values.maleCount) || 0) + (Number(values.femaleCount) || 0)
      if (Math.max(requestedTotal, total) <= 0) return furthest
      furthest = step
      continue
    }
    if (step === 'party') {
      const partyId = type === 'CARAVAN' ? values.caravanId : values.groupId
      if (!partyId) return furthest
      furthest = step
      continue
    }
    if (step === 'dates') {
      if (
        !values.stayStartDate ||
        !values.stayEndDate ||
        !values.arrivalPeriod ||
        !values.walkingRouteId ||
        !values.walkingStartDate
      )
        return furthest
      furthest = step
      continue
    }
    // services and license are reachable once prior steps are filled
    furthest = step
  }

  return furthest
}
