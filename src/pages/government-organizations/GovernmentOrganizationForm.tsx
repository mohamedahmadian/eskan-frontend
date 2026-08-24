import { AlignLeft, Building, MapPin, Phone, Smartphone, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { GovernmentOrganization } from '../../types/app'

export type GovernmentOrganizationPayload = {
  name: string
  phone: string | null
  address: string | null
  contactPerson: string | null
  mobile: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function GovernmentOrganizationForm({
  initial,
  onSubmit,
}: {
  initial?: GovernmentOrganization
  onSubmit: (payload: GovernmentOrganizationPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    contactPerson: initial?.contactPerson ?? '',
    mobile: initial?.mobile ?? '',
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
        phone: emptyToNull(values.phone),
        address: emptyToNull(values.address),
        contactPerson: emptyToNull(values.contactPerson),
        mobile: emptyToNull(values.mobile),
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
      icon={Building}
      title={initial ? initial.name || t('governmentOrganizations.edit') : t('governmentOrganizations.create')}
      subtitle={initial ? undefined : t('governmentOrganizations.createSubtitle')}
    >
    <AppForm onSubmit={submit} className={formCardBodyClassName}>
      <FormField icon={Building} label={t('governmentOrganizations.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Phone} label={t('governmentOrganizations.phone')} htmlFor="phone">
        <input
          id="phone"
          className={fieldClassName}
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </FormField>
      <FormField icon={MapPin} label={t('governmentOrganizations.address')} htmlFor="address">
        <textarea
          id="address"
          className={fieldClassName}
          rows={3}
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </FormField>
      <FormField
        icon={UserRound}
        label={t('governmentOrganizations.contactPerson')}
        htmlFor="contactPerson"
      >
        <input
          id="contactPerson"
          className={fieldClassName}
          value={values.contactPerson}
          onChange={(e) => set('contactPerson', e.target.value)}
        />
      </FormField>
      <FormField icon={Smartphone} label={t('governmentOrganizations.mobile')} htmlFor="mobile">
        <input
          id="mobile"
          className={fieldClassName}
          value={values.mobile}
          onChange={(e) => set('mobile', e.target.value)}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('governmentOrganizations.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('governmentOrganizations.save')}
        cancelLabel={t('governmentOrganizations.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
    </FormCard>
  )
}
