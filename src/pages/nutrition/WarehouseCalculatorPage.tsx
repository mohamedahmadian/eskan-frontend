import { Calculator, Coins, Hash, Plus, Trash2, UtensilsCrossed, Warehouse, Wheat, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  PageHeader,
  fieldClassName,
  listShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { languageDir } from '../../i18n'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, formatGroupedQuantity, formatNumber } from '../../lib/datetime'
import { autoDisplayQuantity } from '../../lib/nutrition-units'
import { randomClientId } from '../../lib/random-id'
import type {
  Food,
  Ingredient,
  IngredientUnit,
  WarehouseServingsBatchResult,
  WarehouseServingsLine,
  WarehouseServingsResult,
  WarehouseStockResult,
} from '../../types/app'

type StockFoodRow = WarehouseStockResult['foods'][number]

type ServingsListItem = {
  id: string
  foodId: string
  foodName: string
  servings: number
}

function formatAmount(quantity: number, unit: IngredientUnit, locale: string, t: (key: string) => string) {
  const shown = autoDisplayQuantity(quantity, unit)
  return `${formatGroupedQuantity(shown.quantity, locale)} ${t(`ingredientUnits.${shown.unit}`)}`
}

function ServingsTotals({
  tiles,
  locale,
}: {
  tiles: Pick<WarehouseServingsResult, 'costTotal' | 'saleTotal'>
  locale: string
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
      <FormFactTile
        icon={Coins}
        label={t('warehouseCalculator.costTotal')}
        value={`${formatGroupedNumber(tiles.costTotal, locale)} ${t('foods.toman')}`}
        tone="teal"
      />
      <FormFactTile
        icon={Coins}
        label={t('warehouseCalculator.saleTotal')}
        value={`${formatGroupedNumber(tiles.saleTotal, locale)} ${t('foods.toman')}`}
        tone="mint"
      />
    </div>
  )
}

function ServingsLinesTable({
  lines,
  locale,
}: {
  lines: WarehouseServingsLine[]
  locale: string
}) {
  const { t } = useTranslation()
  if (!lines.length) {
    return <FormEmptyHint>{t('warehouseCalculator.emptyResult')}</FormEmptyHint>
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-cream-50 text-ink-700">
          <tr>
            <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.ingredient')}</th>
            <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.quantityNeeded')}</th>
            <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.stockQty')}</th>
            <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.shortage')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.ingredientId} className="border-t border-line">
              <td className="px-3 py-2">{line.name}</td>
              <td className="px-3 py-2">{formatAmount(line.quantityNeeded, line.unit, locale, t)}</td>
              <td className="px-3 py-2">{formatAmount(line.stockQty, line.unit, locale, t)}</td>
              <td className="px-3 py-2">
                {line.shortage ? formatAmount(line.shortage, line.unit, locale, t) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function WarehouseCalculatorPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  const foods = useQuery({
    queryKey: ['foods', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Food[]>('/foods')
      return data
    },
  })
  const ingredients = useQuery({
    queryKey: ['ingredients', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Ingredient[]>('/ingredients')
      return data
    },
  })

  const [foodId, setFoodId] = useState('')
  const [servings, setServings] = useState('1000')
  const [foodList, setFoodList] = useState<ServingsListItem[]>([])
  const [servingsResult, setServingsResult] = useState<WarehouseServingsBatchResult | null>(null)
  const [servingsSaving, setServingsSaving] = useState(false)

  const [ingredientId, setIngredientId] = useState('')
  const [stockQty, setStockQty] = useState('')
  const [stockTouched, setStockTouched] = useState(false)
  const [stockResult, setStockResult] = useState<WarehouseStockResult | null>(null)
  const [stockSaving, setStockSaving] = useState(false)
  const [selectedFood, setSelectedFood] = useState<StockFoodRow | null>(null)

  const selectedIngredient = (ingredients.data ?? []).find((item) => item.id === ingredientId)

  function onIngredientChange(next: string) {
    setIngredientId(next)
    setStockTouched(false)
    const ingredient = (ingredients.data ?? []).find((item) => item.id === next)
    setStockQty(ingredient ? String(ingredient.stockQty) : '')
    setStockResult(null)
    setSelectedFood(null)
  }

  function addFoodToList(event: FormEvent) {
    event.preventDefault()
    const food = (foods.data ?? []).find((item) => item.id === foodId)
    const count = Number(servings)
    if (!food || !Number.isInteger(count) || count < 1) {
      return
    }
    setFoodList((prev) => [
      ...prev,
      {
        id: randomClientId(),
        foodId: food.id,
        foodName: food.name,
        servings: count,
      },
    ])
    setFoodId('')
    setServingsResult(null)
  }

  function removeFoodFromList(id: string) {
    setFoodList((prev) => prev.filter((item) => item.id !== id))
    setServingsResult(null)
  }

  async function calculateServings() {
    if (!foodList.length) {
      toast.error(t('warehouseCalculator.needFoods'))
      return
    }
    setServingsSaving(true)
    try {
      const { data } = await api.post<WarehouseServingsBatchResult>(
        '/warehouse-calculator/from-servings-batch',
        {
          items: foodList.map((item) => ({
            foodId: item.foodId,
            servings: item.servings,
          })),
        },
      )
      setServingsResult(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setServingsSaving(false)
    }
  }

  async function submitStock(event: FormEvent) {
    event.preventDefault()
    setStockSaving(true)
    try {
      const { data } = await api.post<WarehouseStockResult>('/warehouse-calculator/from-stock', {
        ingredientId,
        ...(stockTouched && stockQty !== '' ? { quantity: Number(stockQty) } : {}),
      })
      setStockResult(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setStockSaving(false)
    }
  }

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('menus.warehouseCalculator')} subtitle={t('warehouseCalculator.subtitle')} />
      <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <FormCard
          icon={UtensilsCrossed}
          title={t('warehouseCalculator.fromServings')}
          subtitle={t('warehouseCalculator.fromServingsHint')}
        >
          <AppForm onSubmit={addFoodToList} className={formCardBodyClassName}>
            <FormField icon={UtensilsCrossed} label={t('warehouseCalculator.food')} htmlFor="calc-food">
              <SearchSelect
                id="calc-food"
                value={foodId}
                required
                onChange={setFoodId}
                placeholder={t('warehouseCalculator.selectFood')}
                options={[
                  { value: '', label: t('warehouseCalculator.selectFood') },
                  ...(foods.data ?? []).map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
            </FormField>
            <FormField icon={Hash} label={t('warehouseCalculator.servings')} htmlFor="calc-servings">
              <input
                id="calc-servings"
                type="number"
                min={1}
                step={1}
                required
                className={`${fieldClassName} digit-field`}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </FormField>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                <Plus className="size-4" aria-hidden />
                {t('warehouseCalculator.addToList')}
              </Button>
            </div>
          </AppForm>
          <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            <FormSectionTitle icon={UtensilsCrossed}>{t('warehouseCalculator.foodList')}</FormSectionTitle>
            {foodList.length ? (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.food')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.servings')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foodList.map((item) => (
                      <tr key={item.id} className="border-t border-line">
                        <td className="px-3 py-2">{item.foodName}</td>
                        <td className="px-3 py-2">{formatNumber(item.servings, locale)}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            icon
                            onClick={() => removeFoodFromList(item.id)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <FormEmptyHint>{t('warehouseCalculator.emptyList')}</FormEmptyHint>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="soft"
                disabled={!foodList.length || servingsSaving}
                onClick={() => void calculateServings()}
              >
                <Calculator className="size-4" aria-hidden />
                {t('warehouseCalculator.calculate')}
              </Button>
            </div>
          </div>
        </FormCard>

        <FormCard
          icon={Warehouse}
          title={t('warehouseCalculator.fromStock')}
          subtitle={t('warehouseCalculator.fromStockHint')}
        >
          <AppForm onSubmit={submitStock} className={formCardBodyClassName}>
            <FormField icon={Wheat} label={t('warehouseCalculator.ingredient')} htmlFor="calc-ingredient">
              <SearchSelect
                id="calc-ingredient"
                value={ingredientId}
                required
                onChange={onIngredientChange}
                placeholder={t('warehouseCalculator.selectIngredient')}
                options={[
                  { value: '', label: t('warehouseCalculator.selectIngredient') },
                  ...(ingredients.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.name} (${t(`ingredientUnits.${item.unit}`)})`,
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Calculator} label={t('warehouseCalculator.quantity')} htmlFor="calc-stock">
              <input
                id="calc-stock"
                type="number"
                min={0}
                step="any"
                required
                className={`${fieldClassName} digit-field`}
                value={stockQty}
                onChange={(e) => {
                  setStockTouched(true)
                  setStockQty(e.target.value)
                }}
              />
            </FormField>
            {selectedIngredient ? (
              <p className="text-xs text-ink-500">
                {t('warehouseCalculator.useStock')}: {formatNumber(selectedIngredient.stockQty, locale)}{' '}
                {t(`ingredientUnits.${selectedIngredient.unit}`)}
              </p>
            ) : null}
            <FormActions submitting={stockSaving} submitLabel={t('warehouseCalculator.calculate')} />
          </AppForm>
          <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {stockResult ? (
              stockResult.foods.length ? (
                <div className="overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 text-ink-700">
                      <tr>
                        <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.food')}</th>
                        <th className="px-3 py-2 text-start font-medium">
                          {t('warehouseCalculator.quantityPerServing')}
                        </th>
                        <th className="px-3 py-2 text-start font-medium">{t('warehouseCalculator.maxServings')}</th>
                        <th className="px-3 py-2 text-start font-medium">
                          {t('warehouseCalculator.feasibleServings')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockResult.foods.map((row) => (
                        <tr
                          key={row.foodId}
                          className="cursor-pointer border-t border-line hover:bg-cream-50"
                          onClick={() => setSelectedFood(row)}
                        >
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">
                            {formatAmount(row.quantityPerServing, stockResult.ingredient.unit, locale, t)}
                          </td>
                          <td className="px-3 py-2">
                            {formatGroupedNumber(row.maxServingsByIngredient, locale)}
                          </td>
                          <td className="px-3 py-2">
                            {formatGroupedNumber(row.feasibleServings, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <FormEmptyHint>{t('warehouseCalculator.noFoods')}</FormEmptyHint>
              )
            ) : (
              <FormEmptyHint>{t('warehouseCalculator.emptyResult')}</FormEmptyHint>
            )}
          </div>
        </FormCard>
      </div>
      {servingsResult ? (
        <FormCard
          icon={Calculator}
          title={t('warehouseCalculator.results')}
          subtitle={t('warehouseCalculator.totalsHint')}
        >
          <div className="space-y-8 p-5 sm:p-6">
            {servingsResult.items.map((item, index) => (
              <div key={`${item.food.id}-${item.servings}-${index}`} className="space-y-3">
                <FormSectionTitle icon={UtensilsCrossed}>
                  {t('warehouseCalculator.foodResult', {
                    food: item.food.name,
                    servings: formatNumber(item.servings, locale),
                  })}
                </FormSectionTitle>
                <ServingsTotals tiles={item} locale={locale} />
                <ServingsLinesTable lines={item.lines} locale={locale} />
              </div>
            ))}
            <div className="space-y-3 border-t border-line pt-6">
              <FormSectionTitle icon={Wheat}>{t('warehouseCalculator.totals')}</FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
                <FormFactTile
                  icon={UtensilsCrossed}
                  label={t('warehouseCalculator.foodsCount')}
                  value={formatNumber(servingsResult.totals.foodsCount, locale)}
                  tone="ink"
                />
                <FormFactTile
                  icon={Hash}
                  label={t('warehouseCalculator.servingsTotal')}
                  value={formatNumber(servingsResult.totals.servings, locale)}
                  tone="teal"
                />
                <FormFactTile
                  icon={Coins}
                  label={t('warehouseCalculator.costTotal')}
                  value={`${formatGroupedNumber(servingsResult.totals.costTotal, locale)} ${t('foods.toman')}`}
                  tone="mint"
                />
                <FormFactTile
                  icon={Coins}
                  label={t('warehouseCalculator.saleTotal')}
                  value={`${formatGroupedNumber(servingsResult.totals.saleTotal, locale)} ${t('foods.toman')}`}
                  tone="teal"
                />
              </div>
              <ServingsLinesTable lines={servingsResult.totals.lines} locale={locale} />
            </div>
          </div>
        </FormCard>
      ) : null}
      </div>
      {stockResult && selectedFood ? (
        <StockFoodDetailModal
          locale={locale}
          ingredient={stockResult.ingredient}
          availableQty={stockResult.quantity}
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      ) : null}
    </div>
  )
}

function StockFoodDetailModal({
  locale,
  ingredient,
  availableQty,
  food,
  onClose,
}: {
  locale: string
  ingredient: WarehouseStockResult['ingredient']
  availableQty: number
  food: StockFoodRow
  onClose: () => void
}) {
  const { t } = useTranslation()
  const bottleneck = [
    { name: ingredient.name, maxServings: food.maxServingsByIngredient },
    ...food.otherLimits.map((line) => ({ name: line.name, maxServings: line.maxServings })),
  ].reduce((lowest, item) => (item.maxServings < lowest.maxServings ? item : lowest))

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        dir={languageDir(locale)}
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl"
      >
        <FormCard
          icon={UtensilsCrossed}
          title={food.name}
          action={
            <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('common.close')}>
              <X className="size-4" aria-hidden />
            </Button>
          }
        >
          <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5 sm:p-6">
            <p className="rounded-2xl bg-cream-50 px-4 py-3 text-sm leading-7 text-ink-800">
              {t('warehouseCalculator.withThisAmount', {
                amount: formatAmount(availableQty, ingredient.unit, locale, t),
                ingredient: ingredient.name,
                servings: formatGroupedNumber(food.maxServingsByIngredient, locale),
                food: food.name,
                perServing: formatAmount(food.quantityPerServing, ingredient.unit, locale, t),
              })}
            </p>
            <FormSectionTitle icon={Wheat}>{t('warehouseCalculator.otherIngredients')}</FormSectionTitle>
            {food.otherLimits.length ? (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('warehouseCalculator.ingredient')}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('warehouseCalculator.stockQty')}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('warehouseCalculator.perServing')}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('warehouseCalculator.maxFromItem')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {food.otherLimits.map((line) => (
                      <tr key={line.ingredientId} className="border-t border-line">
                        <td className="px-3 py-2">{line.name}</td>
                        <td className="px-3 py-2">
                          {formatAmount(line.stockQty, line.unit, locale, t)}
                        </td>
                        <td className="px-3 py-2">
                          {formatAmount(line.quantityPerServing, line.unit, locale, t)}
                        </td>
                        <td className="px-3 py-2">
                          {formatGroupedNumber(line.maxServings, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <FormEmptyHint>{t('warehouseCalculator.noOtherIngredients')}</FormEmptyHint>
            )}
            <FormFactTile
              icon={UtensilsCrossed}
              label={t('warehouseCalculator.feasibleServings')}
              value={formatGroupedNumber(food.feasibleServings, locale)}
              tone="teal"
            />
            <p className="text-sm leading-7 text-ink-700">
              {t('warehouseCalculator.feasibleConclusion', {
                servings: formatGroupedNumber(food.feasibleServings, locale),
              })}
              {food.otherLimits.length
                ? ` ${t('warehouseCalculator.limitingItem', { name: bottleneck.name })}.`
                : ''}
            </p>
          </div>
        </FormCard>
      </div>
    </div>,
    document.body,
  )
}
