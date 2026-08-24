import { AlignLeft, CalendarDays, Hash, Package, Ruler, Store } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, persianYearOptions } from '../../lib/datetime'
import { isPresetItemUnit, itemUnits, type ItemQuota, type Supplier } from '../../types/app'

export type ItemQuotaPayload = {
  year: number
  name: string
  unit: string
  quantity: number
  supplierId: string | null
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

export function ItemQuotaForm({
  suppliers,
  initial,
  onSubmit,
}: {
  suppliers: Supplier[]
  initial?: ItemQuota
  onSubmit: (payload: ItemQuotaPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    year: String(initial?.year ?? currentPersianYear()),
    name: initial?.name ?? '',
    ...unitFormValues(initial?.unit),
    quantity: initial ? String(initial.quantity) : '',
    supplierId: initial?.supplierId ?? '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const unit =
      values.unitCode === itemUnits.OTHER ? values.customUnit.trim() : values.unitCode.trim()
    if (!unit) {
      toast.error(
        values.unitCode === itemUnits.OTHER
          ? t('itemQuotas.customUnitRequired')
          : t('itemQuotas.selectUnit'),
      )
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        year: Number(values.year),
        name: values.name.trim(),
        unit,
        quantity: Number(values.quantity),
        supplierId: emptyToNull(values.supplierId),
        description: emptyToNull(values.description),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Package}
      title={initial ? initial.name || t('itemQuotas.edit') : t('itemQuotas.create')}
      subtitle={initial ? undefined : t('itemQuotas.createSubtitle')}
    >
    <AppForm onSubmit={submit} className={formCardBodyClassName}>
      <FormField icon={CalendarDays} label={t('itemQuotas.year')} htmlFor="year">
        <SearchSelect
          id="year"
          value={values.year}
          required
          onChange={(next) => set('year', next)}
          placeholder={t('itemQuotas.selectYear')}
          options={persianYearOptions(locale, Number(values.year))}
        />
      </FormField>
      <FormField icon={Package} label={t('itemQuotas.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Hash} label={t('itemQuotas.quantity')} htmlFor="quantity">
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
      <FormField icon={Ruler} label={t('itemQuotas.unit')} htmlFor="unit">
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
          placeholder={t('itemQuotas.selectUnit')}
          options={[
            { value: '', label: t('itemQuotas.selectUnit') },
            ...Object.values(itemUnits).map((unit) => ({
              value: unit,
              label: t(`itemUnits.${unit}`),
            })),
          ]}
        />
      </FormField>
      {values.unitCode === itemUnits.OTHER ? (
        <FormField icon={Ruler} label={t('itemQuotas.customUnit')} htmlFor="customUnit">
          <input
            id="customUnit"
            className={fieldClassName}
            value={values.customUnit}
            onChange={(e) => set('customUnit', e.target.value)}
            placeholder={t('itemQuotas.customUnitPlaceholder')}
            required
            minLength={1}
          />
        </FormField>
      ) : null}
      <FormField icon={Store} label={t('itemQuotas.supplier')} htmlFor="supplierId">
        <SearchSelect
          id="supplierId"
          value={values.supplierId}
          onChange={(next) => set('supplierId', next)}
          placeholder={t('itemQuotas.selectSupplier')}
          options={[
            { value: '', label: t('itemQuotas.unspecifiedSupplier') },
            ...suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.name,
            })),
          ]}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('itemQuotas.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('itemQuotas.save')}
        cancelLabel={t('itemQuotas.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
    </FormCard>
  )
}
