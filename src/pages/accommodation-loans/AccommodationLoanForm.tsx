import { AlignLeft, CalendarDays, Hash, Package, UserRound } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { DateObject } from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, cardClassName, fieldClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { formatNumber, fromIsoDateOnly, toIsoDateOnly } from '../../lib/datetime'
import { formatItemUnit, type AccommodationLoan, type ManagedUser, type SupplierItem } from '../../types/app'

function todayIso() {
  return toIsoDateOnly(new DateObject({ calendar: gregorian }))
}

function addDaysIso(iso: string, days: number) {
  const date = fromIsoDateOnly(iso)
  if (!date) return ''
  return toIsoDateOnly(date.add(days, 'days'))
}

export type AccommodationLoanPayload = {
  supplierItemId: string
  accommodationManagerId: string
  quantity: number
  deliveryDate: string
  plannedReturnDate: string | null
  actualReturnDate: string | null
  returnedQuantity: number | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function AccommodationLoanForm({
  items,
  managers,
  initial,
  onSubmit,
}: {
  items: SupplierItem[]
  managers: ManagedUser[]
  initial?: AccommodationLoan
  onSubmit: (payload: AccommodationLoanPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const isEdit = Boolean(initial)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState(() => {
    const deliveryDate = initial?.deliveryDate?.slice(0, 10) ?? todayIso()
    return {
      supplierItemId: initial?.supplierItemId ?? '',
      accommodationManagerId: initial?.accommodationManagerId ?? '',
      quantity: initial ? String(initial.quantity) : '',
      deliveryDate,
      plannedReturnDate:
        initial?.plannedReturnDate?.slice(0, 10) ?? addDaysIso(deliveryDate, 3),
      actualReturnDate: initial?.actualReturnDate?.slice(0, 10) ?? '',
      returnedQuantity: initial?.returnedQuantity != null ? String(initial.returnedQuantity) : '',
      description: initial?.description ?? '',
    }
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const selectedItem = items.find((item) => item.id === values.supplierItemId)
  const extra =
    initial && initial.supplierItemId === values.supplierItemId
      ? initial.quantity - (initial.returnedQuantity ?? 0)
      : 0
  const remaining = selectedItem ? selectedItem.remainingQuantity + extra : 0
  const returned = values.returnedQuantity.trim()
  const shortage =
    returned === '' || !values.quantity
      ? null
      : Number(values.quantity) - Number(returned)

  const itemOptions = useMemo(() => {
    return items
      .filter((item) => item.remainingQuantity > 0 || item.id === initial?.supplierItemId)
      .map((item) => ({
        value: item.id,
        label: `${item.supplier.name} — ${item.name} (${formatNumber(item.remainingQuantity, locale)} ${formatItemUnit(item.unit, t)})`,
      }))
  }, [items, initial?.supplierItemId, locale, t])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.deliveryDate) {
      toast.error(t('accommodationLoans.deliveryDateRequired'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        supplierItemId: values.supplierItemId,
        accommodationManagerId: values.accommodationManagerId,
        quantity: Number(values.quantity),
        deliveryDate: values.deliveryDate,
        plannedReturnDate: emptyToNull(values.plannedReturnDate),
        actualReturnDate: isEdit ? emptyToNull(values.actualReturnDate) : null,
        returnedQuantity:
          isEdit && emptyToNull(values.returnedQuantity)
            ? Number(values.returnedQuantity)
            : null,
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
      <FormField icon={UserRound} label={t('accommodationLoans.manager')} htmlFor="accommodationManagerId">
        <SearchSelect
          id="accommodationManagerId"
          value={values.accommodationManagerId}
          required
          onChange={(next) => set('accommodationManagerId', next)}
          placeholder={t('accommodationLoans.selectManager')}
          options={[
            { value: '', label: t('accommodationLoans.selectManager') },
            ...managers.map((manager) => ({
              value: manager.id,
              label: `${manager.fullName} — ${manager.username}`,
            })),
          ]}
        />
      </FormField>
      <FormField icon={Package} label={t('accommodationLoans.item')} htmlFor="supplierItemId">
        <SearchSelect
          id="supplierItemId"
          value={values.supplierItemId}
          required
          onChange={(next) => set('supplierItemId', next)}
          placeholder={t('accommodationLoans.selectItem')}
          options={[
            { value: '', label: t('accommodationLoans.selectItem') },
            ...itemOptions,
          ]}
        />
      </FormField>
      {selectedItem ? (
        <p className="text-sm text-ink-500">
          {t('accommodationLoans.remainingHint', {
            remaining: formatNumber(remaining, locale),
            unit: formatItemUnit(selectedItem.unit, t),
          })}
        </p>
      ) : null}
      <FormField icon={Hash} label={t('accommodationLoans.quantity')} htmlFor="quantity">
        <input
          id="quantity"
          type="number"
          min={1}
          max={remaining || undefined}
          className={fieldClassName}
          value={values.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          required
        />
      </FormField>
      <FormField icon={CalendarDays} label={t('accommodationLoans.deliveryDate')} htmlFor="deliveryDate">
        <PersianDateField
          id="deliveryDate"
          value={values.deliveryDate || undefined}
          onChange={(iso) => {
            const deliveryDate = iso ?? ''
            setValues((current) => ({
              ...current,
              deliveryDate,
              plannedReturnDate:
                !isEdit && deliveryDate
                  ? addDaysIso(deliveryDate, 3)
                  : current.plannedReturnDate,
            }))
          }}
        />
      </FormField>
      <FormField icon={CalendarDays} label={t('accommodationLoans.plannedReturnDate')} htmlFor="plannedReturnDate">
        <PersianDateField
          id="plannedReturnDate"
          value={values.plannedReturnDate || undefined}
          onChange={(iso) => set('plannedReturnDate', iso ?? '')}
        />
      </FormField>
      {isEdit ? (
        <>
          <FormField icon={CalendarDays} label={t('accommodationLoans.actualReturnDate')} htmlFor="actualReturnDate">
            <PersianDateField
              id="actualReturnDate"
              value={values.actualReturnDate || undefined}
              onChange={(iso) => set('actualReturnDate', iso ?? '')}
            />
          </FormField>
          <FormField icon={Hash} label={t('accommodationLoans.returnedQuantity')} htmlFor="returnedQuantity">
            <input
              id="returnedQuantity"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.returnedQuantity}
              onChange={(e) => set('returnedQuantity', e.target.value)}
            />
          </FormField>
          <FormField icon={Hash} label={t('accommodationLoans.shortage')} htmlFor="shortage">
            <input
              id="shortage"
              className={fieldClassName}
              value={shortage == null || Number.isNaN(shortage) ? '' : formatNumber(shortage, locale)}
              readOnly
              tabIndex={-1}
            />
          </FormField>
        </>
      ) : null}
      <FormField icon={AlignLeft} label={t('accommodationLoans.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('accommodationLoans.save')}
        cancelLabel={t('accommodationLoans.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
  )
}
