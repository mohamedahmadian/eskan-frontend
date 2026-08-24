import { AlignLeft, Building, MessageCircle, Phone, Send } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { OrgUnit } from '../../types/app'
import { UnitManagerPicker, type UnitManagerChoice } from './UnitManagerPicker'

export type OrgUnitPayload = {
  name: string
  phone: string | null
  description: string | null
  eitaaChannel: string | null
  telegramChannel: string | null
  managerUserId: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function OrgUnitForm({
  initial,
  onSubmit,
}: {
  initial?: OrgUnit
  onSubmit: (payload: OrgUnitPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    description: initial?.description ?? '',
    eitaaChannel: initial?.eitaaChannel ?? '',
    telegramChannel: initial?.telegramChannel ?? '',
  })
  const [manager, setManager] = useState<UnitManagerChoice | null>(
    initial?.manager ?? null,
  )

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
        description: emptyToNull(values.description),
        eitaaChannel: emptyToNull(values.eitaaChannel),
        telegramChannel: emptyToNull(values.telegramChannel),
        managerUserId: manager?.id ?? null,
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
      title={initial ? initial.name || t('orgUnits.edit') : t('orgUnits.create')}
      subtitle={initial ? undefined : t('orgUnits.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Building} label={t('orgUnits.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Phone} label={t('orgUnits.phone')} htmlFor="phone">
          <input
            id="phone"
            className={fieldClassName}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('orgUnits.eitaaChannel')} htmlFor="eitaaChannel">
          <input
            id="eitaaChannel"
            className={fieldClassName}
            dir="ltr"
            placeholder={t('orgUnits.eitaaChannelPlaceholder')}
            value={values.eitaaChannel}
            onChange={(e) => set('eitaaChannel', e.target.value)}
          />
        </FormField>
        <FormField icon={Send} label={t('orgUnits.telegramChannel')} htmlFor="telegramChannel">
          <input
            id="telegramChannel"
            className={fieldClassName}
            dir="ltr"
            placeholder={t('orgUnits.telegramChannelPlaceholder')}
            value={values.telegramChannel}
            onChange={(e) => set('telegramChannel', e.target.value)}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('orgUnits.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <UnitManagerPicker value={manager} onChange={setManager} />
        <FormActions
          submitLabel={t('orgUnits.save')}
          cancelLabel={t('orgUnits.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
