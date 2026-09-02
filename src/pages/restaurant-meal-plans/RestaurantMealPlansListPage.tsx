import { CalendarDays, CookingPot, Plus, Sunrise, Truck, Wheat } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { mealTypes, type Paginated, type Restaurant, type RestaurantMealPlan } from '../../types/app'

export function RestaurantMealPlansListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const restaurantId = searchParams.get('restaurantId') ?? ''
  const planDate = searchParams.get('planDate') ?? ''
  const mealType = searchParams.get('mealType') ?? ''

  const restaurants = useQuery({
    queryKey: ['restaurants', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Restaurant[]>('/restaurants')
      return data
    },
  })

  const query = useQuery({
    queryKey: ['restaurant-meal-plans', 'list', q, restaurantId, planDate, mealType, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<RestaurantMealPlan>>('/restaurant-meal-plans', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(restaurantId ? { restaurantId } : {}),
          ...(planDate ? { planDate } : {}),
          ...(mealType ? { mealType } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const selectedRestaurant = restaurants.data?.find((item) => item.id === restaurantId)
  const createQuery = restaurantId ? `?restaurantId=${restaurantId}` : ''
  const rows = query.data?.items ?? []
  const filtersActive = Boolean(restaurantId || planDate || mealType)
  const emptyMessage = q || filtersActive ? t('restaurantMealPlans.noResults') : t('restaurantMealPlans.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.restaurantMealPlan')}
        subtitle={selectedRestaurant?.name ?? t('restaurantMealPlans.subtitle')}
        action={
          <Link to={`/logistics/restaurant-meal-plans/new${createQuery}`}>
            <Button>
              <Plus className="size-4" />
              {t('restaurantMealPlans.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="restaurant-meal-plan-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('restaurantMealPlans.search')}
        placeholder={t('restaurantMealPlans.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair columns={3}>
            <FormField icon={CookingPot} label={t('restaurantMealPlans.restaurant')} htmlFor="meal-plan-restaurant">
              <SearchSelect
                id="meal-plan-restaurant"
                value={restaurantId}
                placeholder={t('restaurantMealPlans.allRestaurants')}
                onChange={(next) =>
                  setParams({ restaurantId: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('restaurantMealPlans.allRestaurants') },
                  ...(restaurants.data ?? []).map((restaurant) => ({
                    value: restaurant.id,
                    label: restaurant.name,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={CalendarDays} label={t('restaurantMealPlans.date')} htmlFor="meal-plan-date">
              <PersianDateField
                id="meal-plan-date"
                value={planDate || undefined}
                onChange={(next) =>
                  setParams({ planDate: next || undefined }, { resetPage: true })
                }
              />
            </FormField>
            <FormField icon={Sunrise} label={t('restaurantMealPlans.mealType')} htmlFor="meal-plan-meal">
              <SearchSelect
                id="meal-plan-meal"
                value={mealType}
                placeholder={t('restaurantMealPlans.allMealTypes')}
                onChange={(next) =>
                  setParams({ mealType: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('restaurantMealPlans.allMealTypes') },
                  ...Object.values(mealTypes).map((value) => ({
                    value,
                    label: t(`restaurantMealPlans.mealTypes.${value}`),
                  })),
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="planDate"
                label={t('restaurantMealPlans.date')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="restaurant"
                label={t('restaurantMealPlans.restaurant')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="mealType"
                label={t('restaurantMealPlans.mealType')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="food"
                label={t('restaurantMealPlans.food')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="servings"
                label={t('restaurantMealPlans.servings')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <DateText value={item.planDate} />
                </td>
                <td className="px-4 py-3">{item.restaurant.name}</td>
                <td className="px-4 py-3">{t(`restaurantMealPlans.mealTypes.${item.mealType}`)}</td>
                <td className="px-4 py-3">{item.food.name}</td>
                <td className="px-4 py-3">
                  <div>{formatNumber(item.servings, locale)}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {t('restaurantMealPlans.remainingServings')}:{' '}
                    {formatNumber(item.remainingServings, locale)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <EntityRowActions
                      viewTo={`/logistics/restaurant-meal-plans/${item.id}`}
                      editTo={`/logistics/restaurant-meal-plans/${item.id}/edit`}
                      onDelete={() =>
                        confirmDelete({
                          message: t('restaurantMealPlans.confirmDelete'),
                          successMessage: t('restaurantMealPlans.deleted'),
                          path: `/restaurant-meal-plans/${item.id}`,
                          queryKey: ['restaurant-meal-plans'],
                        })
                      }
                    />
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}
