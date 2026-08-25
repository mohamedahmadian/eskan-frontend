import { AlignLeft, CalendarRange, FileText } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { EVALUATION_CAMPAIGN_STATUSES } from '../../lib/evaluations'
import type { EvaluationCampaign, EvaluationCampaignStatus } from '../../types/app'

export type EvaluationCampaignPayload = {
  title: string
  description: string | null
  startAt: string
  endAt: string
  status: EvaluationCampaignStatus
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function EvaluationCampaignForm({
  initial,
  onSubmit,
}: {
  initial?: EvaluationCampaign
  onSubmit: (payload: EvaluationCampaignPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    startAt: initial?.startAt?.slice(0, 10) ?? '',
    endAt: initial?.endAt?.slice(0, 10) ?? '',
    status: (initial?.status ?? 'DRAFT') as EvaluationCampaignStatus,
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.startAt || !values.endAt) {
      toast.error(t('evaluations.campaignDatesRequired'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: emptyToNull(values.description),
        startAt: values.startAt,
        endAt: values.endAt,
        status: values.status,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={CalendarRange}
      title={initial ? initial.title : t('evaluations.campaigns.create')}
      subtitle={initial ? undefined : t('evaluations.campaigns.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={FileText} label={t('evaluations.campaigns.title')} htmlFor="title">
          <input
            id="title"
            className={fieldClassName}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('evaluations.campaigns.description')}
          htmlFor="description"
        >
          <textarea
            id="description"
            className={fieldClassName}
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={CalendarRange} label={t('evaluations.campaigns.startAt')} htmlFor="startAt">
            <PersianDateField
              id="startAt"
              value={values.startAt || undefined}
              onChange={(iso) => set('startAt', iso ?? '')}
            />
          </FormField>
          <FormField icon={CalendarRange} label={t('evaluations.campaigns.endAt')} htmlFor="endAt">
            <PersianDateField
              id="endAt"
              value={values.endAt || undefined}
              onChange={(iso) => set('endAt', iso ?? '')}
            />
          </FormField>
        </div>
        <FormField icon={FileText} label={t('evaluations.campaigns.status')} htmlFor="status">
          <SearchSelect
            id="status"
            value={values.status}
            required
            onChange={(next) => set('status', next as EvaluationCampaignStatus)}
            placeholder={t('evaluations.campaigns.selectStatus')}
            options={EVALUATION_CAMPAIGN_STATUSES.map((status) => ({
              value: status,
              label: t(`evaluations.campaignStatuses.${status}`),
            }))}
          />
        </FormField>
        <FormActions
          submitLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
