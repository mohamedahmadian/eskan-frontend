import { AlignLeft, Hash, MapPin, Package, Store, UserRound } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  ToggleField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type ItemQuota, type ItemQuotaVoucher, type ManagedUser, type Supplier } from '../../types/app'

export type ItemQuotaVoucherPayload = {
  quotaId: string
  accommodationManagerId: string
  quantity: number
  supplierId: string | null
  supplierName: string | null
  pickupLocation: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function ItemQuotaVoucherForm({
  quota,
  quotas,
  managers,
  suppliers,
  initial,
  onSubmit,
}: {
  quota?: ItemQuota
  quotas?: ItemQuota[]
  managers: ManagedUser[]
  suppliers: Supplier[]
  initial?: ItemQuotaVoucher
  onSubmit: (payload: ItemQuotaVoucherPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const allowSelect = Boolean(quotas)
  const [saving, setSaving] = useState(false)
  const [quotaId, setQuotaId] = useState(quota?.id ?? '')
  const selectedQuota = allowSelect
    ? quotas?.find((item) => item.id === quotaId)
    : quota
  const [fromList, setFromList] = useState(
    Boolean(initial?.supplierId ?? selectedQuota?.supplierId),
  )
  const [values, setValues] = useState({
    accommodationManagerId: initial?.accommodationManagerId ?? '',
    quantity: initial ? String(initial.quantity) : '',
    supplierId: initial?.supplierId ?? selectedQuota?.supplierId ?? '',
    supplierName: initial?.supplierId ? '' : (initial?.supplierName ?? ''),
    pickupLocation:
      initial?.pickupLocation ??
      selectedQuota?.supplier?.address ??
      '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const extra =
    initial && selectedQuota && initial.quotaId === selectedQuota.id ? initial.quantity : 0
  const remaining = selectedQuota ? selectedQuota.remainingQuantity + extra : 0
  const selectedSupplier = useMemo(
    () => suppliers.find((item) => item.id === values.supplierId),
    [suppliers, values.supplierId],
  )
  const quotaOptions = useMemo(
    () =>
      (quotas ?? []).map((item) => ({
        value: item.id,
        label: `${item.name} — ${formatNumber(item.year, locale)} (${formatNumber(item.remainingQuantity, locale)} ${formatItemUnit(item.unit, t)})`,
      })),
    [quotas, locale, t],
  )
  const quantityError = useMemo(() => {
    const raw = values.quantity.trim()
    if (!raw) return undefined
    const quantity = Number(raw)
    if (!Number.isInteger(quantity) || quantity < 1) {
      return t('itemQuotaVouchers.quantityInvalid')
    }
    if (selectedQuota && quantity > remaining) {
      return t('itemQuotaVouchers.quantityOverRemaining', {
        remaining: formatNumber(remaining, locale),
        unit: formatItemUnit(selectedQuota.unit, t),
      })
    }
    return undefined
  }, [values.quantity, selectedQuota, remaining, locale, t])

  function onSupplierChange(next: string) {
    const supplier = suppliers.find((item) => item.id === next)
    setValues((current) => ({
      ...current,
      supplierId: next,
      pickupLocation: supplier?.address ?? current.pickupLocation,
    }))
  }

  function applyQuotaDefaults(next: ItemQuota | undefined) {
    if (!next) {
      setFromList(false)
      setValues((current) => ({
        ...current,
        supplierId: '',
        supplierName: '',
        pickupLocation: '',
      }))
      return
    }
    const fallback = next.supplierId ?? ''
    const supplier = suppliers.find((item) => item.id === fallback)
    setFromList(Boolean(fallback))
    setValues((current) => ({
      ...current,
      supplierId: fallback,
      supplierName: '',
      pickupLocation: supplier?.address ?? next.supplier?.address ?? '',
    }))
  }

  function onQuotaChange(next: string) {
    setQuotaId(next)
    applyQuotaDefaults(quotas?.find((item) => item.id === next))
  }

  function onSourceChange(nextFromList: boolean) {
    setFromList(nextFromList)
    if (nextFromList) {
      const fallback = selectedQuota?.supplierId ?? ''
      const supplier = suppliers.find((item) => item.id === fallback)
      setValues((current) => ({
        ...current,
        supplierId: fallback,
        supplierName: '',
        pickupLocation: supplier?.address ?? current.pickupLocation,
      }))
      return
    }
    setValues((current) => ({
      ...current,
      supplierId: '',
      supplierName: current.supplierName || selectedSupplier?.name || '',
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedQuota) {
      toast.error(t('itemQuotaVouchers.selectItem'))
      return
    }
    if (fromList && !values.supplierId) {
      toast.error(t('itemQuotaVouchers.selectSupplier'))
      return
    }
    if (!fromList && !values.supplierName.trim()) {
      toast.error(t('itemQuotaVouchers.supplierName'))
      return
    }
    if (quantityError) {
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        quotaId: selectedQuota.id,
        accommodationManagerId: values.accommodationManagerId,
        quantity: Number(values.quantity),
        supplierId: fromList ? emptyToNull(values.supplierId) : null,
        supplierName: fromList ? null : emptyToNull(values.supplierName),
        pickupLocation: emptyToNull(values.pickupLocation),
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
      {allowSelect ? (
        <FormField icon={Package} label={t('itemQuotaVouchers.item')} htmlFor="quotaId">
          <SearchSelect
            id="quotaId"
            value={quotaId}
            required
            onChange={onQuotaChange}
            placeholder={t('itemQuotaVouchers.selectItem')}
            options={[
              { value: '', label: t('itemQuotaVouchers.selectItem') },
              ...quotaOptions,
            ]}
          />
        </FormField>
      ) : null}
      <FormField icon={UserRound} label={t('itemQuotaVouchers.manager')} htmlFor="accommodationManagerId">
        <SearchSelect
          id="accommodationManagerId"
          value={values.accommodationManagerId}
          required
          onChange={(next) => set('accommodationManagerId', next)}
          placeholder={t('itemQuotaVouchers.selectManager')}
          options={[
            { value: '', label: t('itemQuotaVouchers.selectManager') },
            ...managers.map((manager) => ({
              value: manager.id,
              label: `${manager.fullName} — ${manager.username}`,
            })),
          ]}
        />
      </FormField>
      {selectedQuota ? (
        <p className="text-sm text-ink-500">
          {t('itemQuotaVouchers.remainingHint', {
            remaining: formatNumber(remaining, locale),
            unit: formatItemUnit(selectedQuota.unit, t),
          })}
        </p>
      ) : null}
      <FormField
        icon={Hash}
        label={t('itemQuotaVouchers.quantity')}
        htmlFor="quantity"
        error={quantityError}
      >
        <input
          id="quantity"
          type="number"
          min={1}
          max={selectedQuota ? remaining : undefined}
          className={`${fieldClassName} ${quantityError ? 'border-red-500' : ''}`}
          value={values.quantity}
          onChange={(e) => set('quantity', e.target.value)}
          aria-invalid={Boolean(quantityError)}
          required
        />
      </FormField>
      <FormField icon={Store} label={t('itemQuotaVouchers.supplier')} htmlFor="supplier-source">
        <ToggleField
          id="supplier-source"
          checked={fromList}
          onChange={onSourceChange}
          onLabel={t('itemQuotaVouchers.supplierFromList')}
          offLabel={t('itemQuotaVouchers.supplierManual')}
        />
      </FormField>
      {fromList ? (
        <FormField icon={Store} label={t('itemQuotaVouchers.selectSupplier')} htmlFor="supplierId">
          <SearchSelect
            id="supplierId"
            value={values.supplierId}
            required
            onChange={onSupplierChange}
            placeholder={t('itemQuotaVouchers.selectSupplier')}
            options={[
              { value: '', label: t('itemQuotaVouchers.selectSupplier') },
              ...suppliers.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              })),
            ]}
          />
        </FormField>
      ) : (
        <FormField icon={Store} label={t('itemQuotaVouchers.supplierName')} htmlFor="supplierName">
          <input
            id="supplierName"
            className={fieldClassName}
            value={values.supplierName}
            onChange={(e) => set('supplierName', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
      )}
      <FormField icon={MapPin} label={t('itemQuotaVouchers.pickupLocation')} htmlFor="pickupLocation">
        <textarea
          id="pickupLocation"
          className={fieldClassName}
          rows={3}
          value={values.pickupLocation}
          onChange={(e) => set('pickupLocation', e.target.value)}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('itemQuotaVouchers.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={initial ? t('itemQuotaVouchers.save') : t('itemQuotaVouchers.create')}
        cancelLabel={t('itemQuotaVouchers.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
  )
}
