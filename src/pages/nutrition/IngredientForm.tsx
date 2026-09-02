import { AlignLeft, Coins, Scale, Warehouse, Wheat } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, parseDigitString } from '../../lib/datetime'
import { ingredientUnits, type IngredientUnit } from '../../lib/nutrition-units'
import type { Ingredient } from '../../types/app'

export type IngredientPayload = {
  name: string
  unit: IngredientUnit
  pricePerUnit: number
  stockQty: number
  description: string | null
}

export function IngredientForm({
  initial,
  onSubmit,
}: {
  initial?: Ingredient
  onSubmit: (payload: IngredientPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    unit: (initial?.unit ?? '') as IngredientUnit | '',
    pricePerUnit: initial ? String(initial.pricePerUnit) : '',
    stockQty: initial ? String(initial.stockQty) : '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.unit) {
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        unit: values.unit,
        pricePerUnit: Number(values.pricePerUnit),
        stockQty: Number(values.stockQty),
        description: values.description.trim() || null,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Wheat}
      title={initial ? initial.name : t('ingredients.create')}
      subtitle={initial ? undefined : t('ingredients.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Wheat} label={t('ingredients.name')} htmlFor="ingredient-name">
          <input
            id="ingredient-name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Scale} label={t('ingredients.unit')} htmlFor="ingredient-unit">
          <SearchSelect
            id="ingredient-unit"
            value={values.unit}
            required
            onChange={(next) => set('unit', next as IngredientUnit | '')}
            placeholder={t('ingredients.selectUnit')}
            options={[
              { value: '', label: t('ingredients.selectUnit') },
              ...ingredientUnits.map((unit) => ({
                value: unit,
                label: t(`ingredientUnits.${unit}`),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Coins} label={t('ingredients.pricePerUnit')} htmlFor="ingredient-price">
          <div className="relative">
            <input
              id="ingredient-price"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              className={`${fieldClassName} digit-field pe-16`}
              value={
                values.pricePerUnit === ''
                  ? ''
                  : formatGroupedNumber(Number(values.pricePerUnit), locale)
              }
              onChange={(e) => set('pricePerUnit', parseDigitString(e.target.value))}
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
              {t('ingredients.toman')}
            </span>
          </div>
        </FormField>
        <FormField icon={Warehouse} label={t('ingredients.stockQty')} htmlFor="ingredient-stock">
          <input
            id="ingredient-stock"
            type="number"
            min={0}
            step="any"
            required
            className={`${fieldClassName} digit-field`}
            value={values.stockQty}
            onChange={(e) => set('stockQty', e.target.value)}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('ingredients.description')} htmlFor="ingredient-description">
          <textarea
            id="ingredient-description"
            className={fieldClassName}
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('ingredients.save')}
          cancelLabel={t('ingredients.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
