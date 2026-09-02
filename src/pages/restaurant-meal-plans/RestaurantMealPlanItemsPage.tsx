import {
  CalendarDays,
  Coins,
  CookingPot,
  Hash,
  Sunrise,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormMetaChip,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { api } from '../../lib/api'
import { formatGroupedNumber, formatGroupedQuantity, formatNumber } from '../../lib/datetime'
import { autoDisplayQuantity } from '../../lib/nutrition-units'
import type { IngredientUnit, RestaurantMealPlan, WarehouseServingsResult } from '../../types/app'

function formatAmount(quantity: number, unit: IngredientUnit, locale: string, t: (key: string) => string) {
  const shown = autoDisplayQuantity(quantity, unit)
  return `${formatGroupedQuantity(shown.quantity, locale)} ${t(`ingredientUnits.${shown.unit}`)}`
}

export function RestaurantMealPlanItemsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()

  const planQuery = useQuery({
    queryKey: ['restaurant-meal-plan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RestaurantMealPlan>(`/restaurant-meal-plans/${id}`)
      return data
    },
  })

  const item = planQuery.data
  const resultQuery = useQuery({
    queryKey: ['restaurant-meal-plan-items', id, item?.foodId, item?.servings],
    enabled: Boolean(item),
    queryFn: async () => {
      const { data } = await api.post<WarehouseServingsResult>('/warehouse-calculator/from-servings', {
        foodId: item!.foodId,
        servings: item!.servings,
      })
      return data
    },
  })

  if (!item) {
    return <LoadingState />
  }

  const result = resultQuery.data
  const lines = result?.lines ?? []

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('restaurantMealPlans.foodItems')}
        subtitle={<EntityNameSubtitle name={item.food.name} icon={Wheat} />}
      />
      <FormCard
        icon={Wheat}
        title={item.food.name}
        subtitle={t('restaurantMealPlans.foodItemsSubtitle')}
        chips={
          <>
            <FormMetaChip
              icon={Sunrise}
              label={t(`restaurantMealPlans.mealTypes.${item.mealType}`)}
            />
            <FormMetaChip
              icon={Hash}
              label={`${formatNumber(item.servings, locale)} ${t('restaurantMealPlans.servings')}`}
            />
          </>
        }
      >
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={CookingPot}
              label={t('restaurantMealPlans.restaurant')}
              value={
                <Link
                  to={`/logistics/restaurants/${item.restaurant.id}`}
                  className="text-teal-700 hover:underline"
                >
                  {item.restaurant.name}
                </Link>
              }
              tone="teal"
            />
            <FormFactTile
              icon={UtensilsCrossed}
              label={t('restaurantMealPlans.food')}
              value={
                <Link
                  to={`/logistics/foods/${item.food.id}`}
                  className="text-teal-700 hover:underline"
                >
                  {item.food.name}
                </Link>
              }
              tone="mint"
            />
            <FormFactTile
              icon={CalendarDays}
              label={t('restaurantMealPlans.date')}
              value={<DateText value={item.planDate} />}
              tone="ink"
            />
            <FormFactTile
              icon={Sunrise}
              label={t('restaurantMealPlans.mealType')}
              value={t(`restaurantMealPlans.mealTypes.${item.mealType}`)}
              tone="teal"
            />
            <FormFactTile
              icon={Hash}
              label={t('restaurantMealPlans.servings')}
              value={formatNumber(item.servings, locale)}
              tone="mint"
            />
          </div>

          <FormSectionTitle icon={Coins}>{t('restaurantMealPlans.costEstimate')}</FormSectionTitle>
          {resultQuery.isLoading ? (
            <LoadingState variant="inline" />
          ) : result ? (
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Coins}
                label={t('foods.costPrice')}
                value={`${formatGroupedNumber(result.food.costPrice, locale)} ${t('foods.toman')}`}
                tone="teal"
              />
              <FormFactTile
                icon={Coins}
                label={t('warehouseCalculator.costTotal')}
                value={`${formatGroupedNumber(result.costTotal, locale)} ${t('foods.toman')}`}
                tone="mint"
              />
              <FormFactTile
                icon={Coins}
                label={t('foods.finalPrice')}
                value={`${formatGroupedNumber(result.food.finalPrice, locale)} ${t('foods.toman')}`}
                tone="ink"
              />
              <FormFactTile
                icon={Coins}
                label={t('warehouseCalculator.saleTotal')}
                value={`${formatGroupedNumber(result.saleTotal, locale)} ${t('foods.toman')}`}
                tone="teal"
              />
            </div>
          ) : (
            <FormEmptyHint>{t('restaurantMealPlans.emptyIngredients')}</FormEmptyHint>
          )}

          <FormSectionTitle icon={Wheat}>{t('restaurantMealPlans.foodItems')}</FormSectionTitle>
          {resultQuery.isLoading ? (
            <LoadingState variant="inline" />
          ) : lines.length ? (
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 text-ink-700">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('warehouseCalculator.ingredient')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('warehouseCalculator.quantityNeeded')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">{t('foods.lineCost')}</th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('warehouseCalculator.stockQty')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('warehouseCalculator.shortage')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.ingredientId} className="border-t border-line">
                      <td className="px-3 py-2">{line.name}</td>
                      <td className="px-3 py-2">
                        {formatAmount(line.quantityNeeded, line.unit, locale, t)}
                      </td>
                      <td className="px-3 py-2">
                        {`${formatGroupedNumber(line.costTotal, locale)} ${t('foods.toman')}`}
                      </td>
                      <td className="px-3 py-2">
                        {formatAmount(line.stockQty, line.unit, locale, t)}
                      </td>
                      <td className="px-3 py-2">
                        {line.shortage ? formatAmount(line.shortage, line.unit, locale, t) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <FormEmptyHint>{t('restaurantMealPlans.emptyIngredients')}</FormEmptyHint>
          )}
        </div>
      </FormCard>
    </div>
  )
}
