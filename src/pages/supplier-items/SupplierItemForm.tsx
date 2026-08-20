import { AlignLeft, CalendarDays, Hash, Package, Ruler } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, cardClassName, fieldClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, persianYearOptions } from '../../lib/datetime'
import {
  isPresetItemUnit,
  itemUnits,
  type Supplier,
  type SupplierItem,
} from '../../types/app'

export type SupplierItemPayload = {
  supplierId: string
  year: number
  name: string
  unit: string
  quantity: number
  deliveryDate: string
  returnDate: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function unitFormValues(unit?: string) {
  if (!unit) {
    return { unitCode: '', customUnit: '' }
  }
  if (isPresetItemUnit(unit)) {
    return { unitCode: unit, customUnit: '' }
  }
  return { unitCode: itemUnits.OTHER, customUnit: unit }
}

export function SupplierItemForm({
  supplier,
  initial,
  onSubmit,
}: {
  supplier: Pick<Supplier, 'id' | 'name'>
  initial?: SupplierItem
  onSubmit: (payload: SupplierItemPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    year: String(initial?.year ?? currentPersianYear()),
    name: initial?.name ?? '',
    ...unitFormValues(initial?.unit),
    quantity: initial ? String(initial.quantity) : '',
    deliveryDate: initial?.deliveryDate?.slice(0, 10) ?? '',
    returnDate: initial?.returnDate?.slice(0, 10) ?? '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.deliveryDate) {
      toast.error(t('supplierItems.deliveryDateRequired'))
      return
    }
    const unit =
      values.unitCode === itemUnits.OTHER ? values.customUnit.trim() : values.unitCode.trim()
    if (!unit) {
      toast.error(
        values.unitCode === itemUnits.OTHER
          ? t('supplierItems.customUnitRequired')
          : t('supplierItems.selectUnit'),
      )
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        supplierId: supplier.id,
        year: Number(values.year),
        name: values.name.trim(),
        unit,
        quantity: Number(values.quantity),
        deliveryDate: values.deliveryDate,
        returnDate: emptyToNull(values.returnDate),
        description: emptyToNull(values.description),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppForm onSubmit={submit} className={`space-y-4 p-6 ${cardClassName}`}>
      <FormField icon={CalendarDays} label={t('supplierItems.year')} htmlFor="year">
        <SearchSelect
          id="year"
          value={values.year}
          required
          onChange={(next) => set('year', next)}
          placeholder={t('supplierItems.selectYear')}
          options={persianYearOptions(locale, Number(values.year))}
        />
      </FormField>
      <FormField icon={Package} label={t('supplierItems.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Hash} label={t('supplierItems.quantity')} htmlFor="quantity">
        <input
          id="quantity"
          type="number"
          min={1}
          className={fieldClassName}
          value={values.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          required
        />
      </FormField>
      <FormField icon={Ruler} label={t('supplierItems.unit')} htmlFor="unit">
        <SearchSelect
          id="unit"
          value={values.unitCode}
          required
          onChange={(next) =>
            setValues((current) => ({
              ...current,
              unitCode: next,
              customUnit: next === itemUnits.OTHER ? current.customUnit : '',
            }))
          }
          placeholder={t('supplierItems.selectUnit')}
          options={[
            { value: '', label: t('supplierItems.selectUnit') },
            ...Object.values(itemUnits).map((unit) => ({
              value: unit,
              label: t(`itemUnits.${unit}`),
            })),
          ]}
        />
      </FormField>
      {values.unitCode === itemUnits.OTHER ? (
        <FormField icon={Ruler} label={t('supplierItems.customUnit')} htmlFor="customUnit">
          <input
            id="customUnit"
            className={fieldClassName}
            value={values.customUnit}
            onChange={(e) => set('customUnit', e.target.value)}
            placeholder={t('supplierItems.customUnitPlaceholder')}
            required
            minLength={1}
          />
        </FormField>
      ) : null}
      <FormField icon={CalendarDays} label={t('supplierItems.deliveryDate')} htmlFor="deliveryDate">
        <PersianDateField
          id="deliveryDate"
          value={values.deliveryDate || undefined}
          onChange={(iso) => set('deliveryDate', iso ?? '')}
        />
      </FormField>
      <FormField icon={CalendarDays} label={t('supplierItems.returnDate')} htmlFor="returnDate">
        <PersianDateField
          id="returnDate"
          value={values.returnDate || undefined}
          onChange={(iso) => set('returnDate', iso ?? '')}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('supplierItems.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('supplierItems.save')}
        cancelLabel={t('supplierItems.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
  )
}
