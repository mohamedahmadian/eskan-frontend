import {
  AlignLeft,
  Coins,
  Plus,
  Scale,
  Trash2,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, Button, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormEmptyHint, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import { compatibleUnits, lineCost, type IngredientUnit } from '../../lib/nutrition-units'
import { randomClientId } from '../../lib/random-id'
import type { Food, Ingredient } from '../../types/app'

export type FoodPayload = {
  name: string
  description: string | null
  finalPrice: number
  ingredients: Array<{
    ingredientId: string
    quantity: number
    unit: IngredientUnit
  }>
}

type DraftLine = {
  key: string
  ingredientId: string
  quantity: string
  unit: IngredientUnit | ''
}

function newLine(): DraftLine {
  return {
    key: randomClientId(),
    ingredientId: '',
    quantity: '',
    unit: '',
  }
}

export function FoodForm({
  initial,
  ingredients,
  onSubmit,
}: {
  initial?: Food
  ingredients: Ingredient[]
  onSubmit: (payload: FoodPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [finalPrice, setFinalPrice] = useState(initial ? String(initial.finalPrice) : '')
  const [finalTouched, setFinalTouched] = useState(Boolean(initial))
  const [lines, setLines] = useState<DraftLine[]>(
    initial?.ingredients.length
      ? initial.ingredients.map((line) => ({
          key: line.id,
          ingredientId: line.ingredientId,
          quantity: String(line.quantity),
          unit: line.unit,
        }))
      : [newLine()],
  )

  const byId = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients],
  )

  const costPrice = useMemo(() => {
    return lines.reduce((sum, line) => {
      const ingredient = byId.get(line.ingredientId)
      const quantity = Number(line.quantity)
      if (!ingredient || !line.unit || !Number.isFinite(quantity) || quantity <= 0) {
        return sum
      }
      return sum + lineCost(quantity, line.unit, ingredient.pricePerUnit, ingredient.unit)
    }, 0)
  }, [byId, lines])

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    )
  }

  function onIngredientChange(key: string, ingredientId: string) {
    const ingredient = byId.get(ingredientId)
    updateLine(key, {
      ingredientId,
      unit: ingredient?.unit ?? '',
    })
  }

  useEffect(() => {
    if (!finalTouched) {
      setFinalPrice(costPrice ? String(costPrice) : '')
    }
  }, [costPrice, finalTouched])

  const displayedCost = costPrice

  async function submit(event: FormEvent) {
    event.preventDefault()
    const payloadLines = lines
      .map((line) => ({
        ingredientId: line.ingredientId,
        quantity: Number(line.quantity),
        unit: line.unit,
      }))
      .filter(
        (line): line is { ingredientId: string; quantity: number; unit: IngredientUnit } =>
          Boolean(line.ingredientId && line.unit && Number.isFinite(line.quantity) && line.quantity > 0),
      )
    if (!payloadLines.length) {
      toast.error(t('foods.emptyIngredients'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        finalPrice: Number(finalPrice || displayedCost),
        ingredients: payloadLines,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={UtensilsCrossed}
      title={initial ? initial.name : t('foods.create')}
      subtitle={initial ? undefined : t('foods.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={UtensilsCrossed} label={t('foods.name')} htmlFor="food-name">
          <input
            id="food-name"
            className={fieldClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('foods.description')} htmlFor="food-description">
          <textarea
            id="food-description"
            className={fieldClassName}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <FormSectionTitle icon={Wheat}>{t('foods.ingredients')}</FormSectionTitle>
        <div className="space-y-3">
          {lines.map((line, index) => {
            const ingredient = byId.get(line.ingredientId)
            const unitOptions = ingredient ? compatibleUnits(ingredient.unit) : []
            const quantity = Number(line.quantity)
            const cost =
              ingredient && line.unit && Number.isFinite(quantity) && quantity > 0
                ? lineCost(quantity, line.unit, ingredient.pricePerUnit, ingredient.unit)
                : 0
            const usedIds = new Set(
              lines.filter((item) => item.key !== line.key && item.ingredientId).map((item) => item.ingredientId),
            )
            return (
              <div
                key={line.key}
                className="grid gap-3 rounded-2xl border border-line bg-cream-50/70 p-3 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end"
              >
                <FormField icon={Wheat} label={t('foods.ingredient')} htmlFor={`food-ing-${line.key}`}>
                  <SearchSelect
                    id={`food-ing-${line.key}`}
                    value={line.ingredientId}
                    required={index === 0}
                    onChange={(next) => onIngredientChange(line.key, next)}
                    placeholder={t('foods.selectIngredient')}
                    options={[
                      { value: '', label: t('foods.selectIngredient') },
                      ...ingredients
                        .filter((item) => item.id === line.ingredientId || !usedIds.has(item.id))
                        .map((item) => ({
                          value: item.id,
                          label: `${item.name} (${t(`ingredientUnits.${item.unit}`)})`,
                        })),
                    ]}
                  />
                </FormField>
                <FormField icon={Scale} label={t('foods.quantity')} htmlFor={`food-qty-${line.key}`}>
                  <input
                    id={`food-qty-${line.key}`}
                    type="number"
                    min={0}
                    step="any"
                    required={Boolean(line.ingredientId)}
                    className={`${fieldClassName} digit-field`}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  />
                </FormField>
                <FormField icon={Scale} label={t('foods.unit')} htmlFor={`food-unit-${line.key}`}>
                  <SearchSelect
                    id={`food-unit-${line.key}`}
                    value={line.unit}
                    required={Boolean(line.ingredientId)}
                    disabled={!ingredient}
                    onChange={(next) => updateLine(line.key, { unit: next as IngredientUnit | '' })}
                    placeholder={t('ingredients.selectUnit')}
                    options={[
                      { value: '', label: t('ingredients.selectUnit') },
                      ...(ingredient ? unitOptions : []).map((unit) => ({
                        value: unit,
                        label: t(`ingredientUnits.${unit}`),
                      })),
                    ]}
                  />
                </FormField>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="text-sm font-semibold text-ink-700">
                    {cost
                      ? `${formatGroupedNumber(cost, locale)} ${t('foods.toman')}`
                      : '—'}
                  </span>
                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      icon
                      onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                      aria-label={t('foods.delete')}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
          {!lines.some((line) => line.ingredientId) ? (
            <FormEmptyHint>{t('foods.emptyIngredients')}</FormEmptyHint>
          ) : null}
          <Button type="button" variant="soft" onClick={() => setLines((current) => [...current, newLine()])}>
            <Plus className="size-4" aria-hidden />
            {t('foods.addIngredient')}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField icon={Coins} label={t('foods.costPrice')}>
            <div className={`${fieldClassName} bg-cream-50 font-semibold text-ink-800`}>
              {formatGroupedNumber(displayedCost, locale)} {t('foods.toman')}
            </div>
          </FormField>
          <FormField icon={Coins} label={t('foods.finalPrice')} htmlFor="food-final-price">
            <input
              id="food-final-price"
              type="number"
              min={0}
              step="any"
              required
              className={`${fieldClassName} digit-field`}
              value={finalPrice}
              onChange={(e) => {
                setFinalTouched(true)
                setFinalPrice(e.target.value)
              }}
            />
          </FormField>
        </div>

        <FormActions
          submitLabel={t('foods.save')}
          cancelLabel={t('foods.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
