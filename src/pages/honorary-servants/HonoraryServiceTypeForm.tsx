import { AlignLeft, HeartHandshake, Type } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { HonoraryServiceType } from '../../types/app'

export type HonoraryServiceTypePayload = {
  name: string
  description: string
}

export function HonoraryServiceTypeForm({
  initial,
  onSubmit,
}: {
  initial?: HonoraryServiceType
  onSubmit: (payload: HonoraryServiceTypePayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
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
        description: values.description.trim(),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={HeartHandshake}
      title={initial ? initial.name : t('honoraryServiceTypes.create')}
      subtitle={initial ? undefined : t('honoraryServiceTypes.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('honoraryServiceTypes.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('honoraryServiceTypes.description')}
          htmlFor="description"
        >
          <textarea
            id="description"
            className={fieldClassName}
            rows={5}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormActions
          submitLabel={t('honoraryServiceTypes.save')}
          cancelLabel={t('honoraryServiceTypes.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
