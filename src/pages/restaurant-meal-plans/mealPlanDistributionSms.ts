import { formatNumber } from '../../lib/datetime'
import type { RestaurantMealPlan, RestaurantMealPlanDistribution } from '../../types/app'

function textOrDash(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

export function buildMealPlanDistributionSmsBody(
  plan: RestaurantMealPlan,
  servings: number,
  locale: string,
  t: (key: string, opts?: Record<string, string>) => string,
) {
  return t('restaurantMealPlans.smsBody', {
    servings: formatNumber(servings, locale),
    food: plan.food.name,
    mealType: t(`restaurantMealPlans.mealTypes.${plan.mealType}`),
    restaurant: plan.restaurant.name,
    address: textOrDash(plan.restaurant.address),
    neshan: textOrDash(plan.restaurant.neshanAddress),
  })
}

export function distributionManagers(row: RestaurantMealPlanDistribution) {
  return (row.accommodation.managers ?? []).filter((manager) => manager.user)
}

export function managersWithPhone(row: RestaurantMealPlanDistribution) {
  return distributionManagers(row).filter((manager) => manager.user?.phone?.trim())
}

export function primaryManager(row: RestaurantMealPlanDistribution) {
  return distributionManagers(row)[0] ?? null
}
