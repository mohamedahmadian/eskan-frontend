import { AlignLeft, School, Type } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { SchoolDistrict } from '../../types/app'

export type SchoolDistrictPayload = {
  name: string
  description: string | null
}

export function SchoolDistrictForm({
  initial,
  onSubmit,
}: {
  initial?: SchoolDistrict
  onSubmit: (payload: SchoolDistrictPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
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
      icon={School}
      title={initial ? initial.name : t('schoolDistricts.create')}
      subtitle={initial ? undefined : t('schoolDistricts.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('schoolDistricts.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => setValues((current) => ({ ...current, name: e.target.value }))}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('schoolDistricts.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) =>
              setValues((current) => ({ ...current, description: e.target.value }))
            }
          />
        </FormField>
        <FormActions
          submitLabel={t('schoolDistricts.save')}
          cancelLabel={t('schoolDistricts.cancel')}
          submitting={saving}
          onCancel={() => navigate('/accommodation-base-info')}
        />
      </AppForm>
    </FormCard>
  )
}
