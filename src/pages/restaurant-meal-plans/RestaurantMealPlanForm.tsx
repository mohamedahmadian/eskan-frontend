import {
  AlignLeft,
  CalendarDays,
  CalendarRange,
  CookingPot,
  Hash,
  Sunrise,
  UtensilsCrossed,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { mealTypes, type Food, type Restaurant, type RestaurantMealPlan } from '../../types/app'

export type RestaurantMealPlanPayload = {
  restaurantId: string
  foodId: string
  planDate: string
  mealType: (typeof mealTypes)[keyof typeof mealTypes]
  servings: number
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function RestaurantMealPlanForm({
  initial,
  restaurants,
  foods,
  defaultRestaurantId,
  onSubmit,
}: {
  initial?: RestaurantMealPlan
  restaurants: Restaurant[]
  foods: Food[]
  defaultRestaurantId?: string
  onSubmit: (payload: RestaurantMealPlanPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    restaurantId: initial?.restaurantId ?? defaultRestaurantId ?? '',
    foodId: initial?.foodId ?? '',
    planDate: initial?.planDate?.slice(0, 10) ?? '',
    mealType: initial?.mealType ?? '',
    servings: initial ? String(initial.servings) : '',
    description: initial?.description ?? '',
  })

  const existingPlans = useQuery({
    queryKey: ['restaurant-meal-plans', 'lookup', values.restaurantId, values.planDate],
    enabled: Boolean(values.restaurantId && values.planDate),
    queryFn: async () => {
      const { data } = await api.get<RestaurantMealPlan[]>('/restaurant-meal-plans', {
        params: {
          restaurantId: values.restaurantId,
          planDate: values.planDate,
        },
      })
      return data
    },
  })

  const takenMealTypes = useMemo(() => {
    return new Set(
      (existingPlans.data ?? [])
        .filter((plan) => plan.id !== initial?.id)
        .map((plan) => plan.mealType),
    )
  }, [existingPlans.data, initial?.id])

  useEffect(() => {
    if (values.mealType && takenMealTypes.has(values.mealType as RestaurantMealPlan['mealType'])) {
      setValues((current) => ({ ...current, mealType: '' }))
    }
  }, [takenMealTypes, values.mealType])

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.planDate) {
      toast.error(t('restaurantMealPlans.dateRequired'))
      return
    }
    if (!values.mealType) {
      toast.error(t('restaurantMealPlans.selectMealType'))
      return
    }
    if (takenMealTypes.has(values.mealType as RestaurantMealPlan['mealType'])) {
      toast.error(t('restaurantMealPlans.duplicateMeal'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        restaurantId: values.restaurantId,
        foodId: values.foodId,
        planDate: values.planDate,
        mealType: values.mealType as RestaurantMealPlanPayload['mealType'],
        servings: Number(values.servings),
        description: emptyToNull(values.description),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const title = initial
    ? initial.food.name || t('restaurantMealPlans.edit')
    : t('restaurantMealPlans.create')

  return (
    <FormCard
      icon={CalendarRange}
      title={title}
      subtitle={initial ? undefined : t('restaurantMealPlans.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={CookingPot} label={t('restaurantMealPlans.restaurant')} htmlFor="restaurantId">
          <SearchSelect
            id="restaurantId"
            value={values.restaurantId}
            required
            onChange={(next) => set('restaurantId', next)}
            placeholder={t('restaurantMealPlans.selectRestaurant')}
            options={[
              { value: '', label: t('restaurantMealPlans.selectRestaurant') },
              ...restaurants.map((restaurant) => ({
                value: restaurant.id,
                label: restaurant.name,
              })),
            ]}
          />
        </FormField>
        <FormField icon={CalendarDays} label={t('restaurantMealPlans.date')} htmlFor="planDate">
          <PersianDateField
            id="planDate"
            value={values.planDate || undefined}
            onChange={(iso) => set('planDate', iso ?? '')}
          />
        </FormField>
        <FormField icon={Sunrise} label={t('restaurantMealPlans.mealType')} htmlFor="mealType">
          <SearchSelect
            id="mealType"
            value={values.mealType}
            required
            onChange={(next) => set('mealType', next)}
            placeholder={t('restaurantMealPlans.selectMealType')}
            options={[
              { value: '', label: t('restaurantMealPlans.selectMealType') },
              ...Object.values(mealTypes).map((mealType) => {
                const taken = takenMealTypes.has(mealType)
                return {
                  value: mealType,
                  label: taken
                    ? `${t(`restaurantMealPlans.mealTypes.${mealType}`)} (${t('restaurantMealPlans.mealTaken')})`
                    : t(`restaurantMealPlans.mealTypes.${mealType}`),
                  disabled: taken,
                }
              }),
            ]}
          />
        </FormField>
        <FormField icon={UtensilsCrossed} label={t('restaurantMealPlans.food')} htmlFor="foodId">
          <SearchSelect
            id="foodId"
            value={values.foodId}
            required
            onChange={(next) => set('foodId', next)}
            placeholder={t('restaurantMealPlans.selectFood')}
            options={[
              { value: '', label: t('restaurantMealPlans.selectFood') },
              ...foods.map((food) => ({
                value: food.id,
                label: food.name,
              })),
            ]}
          />
        </FormField>
        <FormField icon={Hash} label={t('restaurantMealPlans.servings')} htmlFor="servings">
          <input
            id="servings"
            type="number"
            min={1}
            step={1}
            required
            className={`${fieldClassName} digit-field`}
            value={values.servings}
            onChange={(e) => set('servings', e.target.value)}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('restaurantMealPlans.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('restaurantMealPlans.save')}
          cancelLabel={t('restaurantMealPlans.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
