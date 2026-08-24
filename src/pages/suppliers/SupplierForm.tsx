import { AlignLeft, MapPin, Phone, Store, Tags, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { supplierTypes, type Supplier, type SupplierType } from '../../types/app'

export type SupplierPayload = {
  name: string
  type: SupplierType
  address: string | null
  phone: string | null
  contactPerson: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function SupplierForm({
  initial,
  onSubmit,
}: {
  initial?: Supplier
  onSubmit: (payload: SupplierPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? '',
    address: initial?.address ?? '',
    phone: initial?.phone ?? '',
    contactPerson: initial?.contactPerson ?? '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type as SupplierType,
        address: emptyToNull(values.address),
        phone: emptyToNull(values.phone),
        contactPerson: emptyToNull(values.contactPerson),
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
      icon={Store}
      title={initial ? initial.name || t('suppliers.edit') : t('suppliers.create')}
      subtitle={initial ? undefined : t('suppliers.createSubtitle')}
    >
    <AppForm onSubmit={submit} className={formCardBodyClassName}>
      <FormField icon={Store} label={t('suppliers.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Tags} label={t('suppliers.type')} htmlFor="type">
        <SearchSelect
          id="type"
          value={values.type}
          required
          onChange={(next) => set('type', next)}
          placeholder={t('suppliers.selectType')}
          options={[
            { value: '', label: t('suppliers.selectType') },
            ...Object.values(supplierTypes).map((type) => ({
              value: type,
              label: t(`supplierTypes.${type}`),
            })),
          ]}
        />
      </FormField>
      <FormField icon={MapPin} label={t('suppliers.address')} htmlFor="address">
        <textarea
          id="address"
          className={fieldClassName}
          rows={3}
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </FormField>
      <FormField icon={Phone} label={t('suppliers.phone')} htmlFor="phone">
        <input
          id="phone"
          className={fieldClassName}
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </FormField>
      <FormField icon={UserRound} label={t('suppliers.contactPerson')} htmlFor="contactPerson">
        <input
          id="contactPerson"
          className={fieldClassName}
          value={values.contactPerson}
          onChange={(e) => set('contactPerson', e.target.value)}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('suppliers.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('suppliers.save')}
        cancelLabel={t('suppliers.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
    </FormCard>
  )
}
