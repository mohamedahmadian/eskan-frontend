import { AlignLeft, CalendarDays, Newspaper, ToggleRight, Type } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { getApiErrorMessage } from '../../lib/api'
import { todayIsoDate } from '../../lib/datetime'
import type { HeadquartersNews } from '../../types/app'

export type HeadquartersNewsPayload = {
  title: string
  summary: string | null
  body: string
  publishedAt: string
  isPublished: boolean
}

export function HeadquartersNewsForm({
  initial,
  onSubmit,
}: {
  initial?: HeadquartersNews
  onSubmit: (payload: HeadquartersNewsPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    body: initial?.body ?? '',
    publishedAt: initial?.publishedAt ?? todayIsoDate(),
    isPublished: initial?.isPublished ?? true,
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.publishedAt) {
      toast.error(t('headquartersNews.publishedAtRequired'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        summary: values.summary.trim() || null,
        body: values.body.trim(),
        publishedAt: values.publishedAt,
        isPublished: values.isPublished,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Newspaper}
      title={initial ? initial.title || t('headquartersNews.edit') : t('headquartersNews.create')}
      subtitle={initial ? undefined : t('headquartersNews.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('headquartersNews.titleLabel')} htmlFor="title">
          <input
            id="title"
            className={fieldClassName}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('headquartersNews.summary')} htmlFor="summary">
          <input
            id="summary"
            className={fieldClassName}
            value={values.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('headquartersNews.body')} htmlFor="body">
          <textarea
            id="body"
            className={fieldClassName}
            rows={8}
            required
            minLength={2}
            value={values.body}
            onChange={(e) => set('body', e.target.value)}
          />
        </FormField>
        <FormField icon={CalendarDays} label={t('headquartersNews.publishedAt')} htmlFor="publishedAt">
          <PersianDateField
            id="publishedAt"
            value={values.publishedAt || undefined}
            onChange={(next) => set('publishedAt', next ?? '')}
          />
        </FormField>
        <FormField icon={ToggleRight} label={t('headquartersNews.isPublished')} htmlFor="isPublished">
          <ToggleField
            id="isPublished"
            checked={values.isPublished}
            onChange={(checked) => set('isPublished', checked)}
            onLabel={t('headquartersNews.published')}
            offLabel={t('headquartersNews.draft')}
          />
        </FormField>
        <FormActions
          submitLabel={t('headquartersNews.save')}
          cancelLabel={t('headquartersNews.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
