import {
  AlignLeft,
  CalendarDays,
  CalendarRange,
  CookingPot,
  Hash,
  Sunrise,
  Truck,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { RestaurantMealPlan } from '../../types/app'

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function RestaurantMealPlanDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['restaurant-meal-plan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RestaurantMealPlan>(`/restaurant-meal-plans/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('restaurantMealPlans.details')}
        subtitle={<EntityNameSubtitle name={item.food.name} icon={CalendarRange} />}
      />
      <FormCard icon={CalendarRange} title={item.food.name}>
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
            <FormFactTile
              icon={Hash}
              label={t('restaurantMealPlans.remainingServings')}
              value={formatNumber(item.remainingServings, locale)}
              tone="teal"
            />
            {hasText(item.description) ? (
              <FormFactTile
                icon={AlignLeft}
                label={t('restaurantMealPlans.description')}
                value={<span className="whitespace-pre-wrap">{item.description}</span>}
                tone="ink"
                className="sm:col-span-2"
              />
            ) : (
              <FormFactTile
                icon={AlignLeft}
                label={t('restaurantMealPlans.description')}
                value="—"
                empty
                tone="ink"
                className="sm:col-span-2"
              />
            )}
          </div>
          <DetailActions
            editTo={`/logistics/restaurant-meal-plans/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('restaurantMealPlans.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('restaurantMealPlans.confirmDelete'),
                successMessage: t('restaurantMealPlans.deleted'),
                path: `/restaurant-meal-plans/${item.id}`,
                queryKey: ['restaurant-meal-plans'],
                onDeleted: () => navigate('/logistics/restaurant-meal-plans'),
              })
            }
            extra={
              <>
                <Link to={`/logistics/restaurant-meal-plans/${item.id}/items`}>
                  <Button type="button" variant="soft">
                    <Wheat className="size-4" aria-hidden />
                    {t('restaurantMealPlans.foodItems')}
                  </Button>
                </Link>
                <Link to={`/logistics/restaurant-meal-plans/${item.id}/distribute`}>
                  <Button type="button" variant="soft">
                    <Truck className="size-4" aria-hidden />
                    {t('restaurantMealPlans.distribute')}
                  </Button>
                </Link>
              </>
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
