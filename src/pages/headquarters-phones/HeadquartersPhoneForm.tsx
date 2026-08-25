import { AlignLeft, Building2, Phone } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import { toLatinDigits } from '../../lib/datetime'
import type { HeadquartersInfo, HeadquartersPhone } from '../../types/app'

export type HeadquartersPhonePayload = {
  headquartersId: string
  phone: string
  department: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function HeadquartersPhoneForm({
  headquarters,
  initial,
  onSubmit,
}: {
  headquarters: Pick<HeadquartersInfo, 'id' | 'name'>
  initial?: HeadquartersPhone
  onSubmit: (payload: HeadquartersPhonePayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    phone: initial?.phone ?? '',
    department: initial?.department ?? '',
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
        headquartersId: headquarters.id,
        phone: toLatinDigits(values.phone).trim(),
        department: emptyToNull(values.department),
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
      icon={Phone}
      title={initial ? initial.phone || t('headquartersPhones.edit') : t('headquartersPhones.create')}
      subtitle={initial ? undefined : t('headquartersPhones.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Phone} label={t('headquartersPhones.phone')} htmlFor="phone">
          <input
            id="phone"
            className={fieldClassName}
            dir="ltr"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
            minLength={3}
          />
        </FormField>
        <FormField icon={Building2} label={t('headquartersPhones.department')} htmlFor="department">
          <input
            id="department"
            className={fieldClassName}
            value={values.department}
            onChange={(e) => set('department', e.target.value)}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('headquartersPhones.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('headquartersPhones.save')}
          cancelLabel={t('headquartersPhones.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
