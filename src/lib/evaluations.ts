import type {
  EvaluationEvaluatorType,
  EvaluationTargetType,
} from '../types/app'

export const EVALUATION_EVALUATOR_TYPES = [
  'UNIT_MANAGER',
  'CARAVAN_MANAGER',
  'ACCOMMODATION_MANAGER',
  'PILGRIM',
] as const satisfies readonly EvaluationEvaluatorType[]

export const EVALUATION_TARGET_TYPES = [
  'CARAVAN_MANAGER',
  'ACCOMMODATION_MANAGER',
  'HEADQUARTERS',
] as const satisfies readonly EvaluationTargetType[]

export const EVALUATION_CAMPAIGN_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'CLOSED',
] as const

export const EVALUATION_PAIRS: Record<
  EvaluationEvaluatorType,
  EvaluationTargetType[]
> = {
  UNIT_MANAGER: ['CARAVAN_MANAGER', 'ACCOMMODATION_MANAGER'],
  ACCOMMODATION_MANAGER: ['CARAVAN_MANAGER', 'HEADQUARTERS'],
  CARAVAN_MANAGER: ['ACCOMMODATION_MANAGER', 'HEADQUARTERS'],
  PILGRIM: ['CARAVAN_MANAGER', 'ACCOMMODATION_MANAGER', 'HEADQUARTERS'],
}

export const EVALUATION_SCORES = [1, 2, 3, 4, 5] as const

export function isPairAllowed(
  evaluatorType: EvaluationEvaluatorType,
  targetType: EvaluationTargetType,
) {
  return EVALUATION_PAIRS[evaluatorType]?.includes(targetType) ?? false
}

export function scoreTone(score: number) {
  if (score <= 1) return 'excellent'
  if (score === 2) return 'good'
  if (score === 3) return 'average'
  if (score === 4) return 'weak'
  return 'poor'
}
