import { Package, ToggleRight } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { ContributionGood } from '../../types/app'

export type ContributionGoodPayload = {
  name: string
  isActive: boolean
}

export function ContributionGoodForm({
  initial,
  onSubmit,
}: {
  initial?: ContributionGood
  onSubmit: (payload: ContributionGoodPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    isActive: initial?.isActive ?? true,
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
        isActive: values.isActive,
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
      title={initial ? initial.name : t('contributionGoods.create')}
      subtitle={initial ? undefined : t('contributionGoods.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Package} label={t('contributionGoods.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            required
            minLength={1}
          />
        </FormField>
        <FormField icon={ToggleRight} label={t('geo.isActive')} htmlFor="isActive">
          <ToggleField
            id="isActive"
            checked={values.isActive}
            onChange={(checked) => set('isActive', checked)}
            onLabel={t('geo.active')}
            offLabel={t('geo.inactive')}
          />
        </FormField>
        <FormActions
          submitLabel={t('contributionGoods.save')}
          cancelLabel={t('contributionGoods.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
