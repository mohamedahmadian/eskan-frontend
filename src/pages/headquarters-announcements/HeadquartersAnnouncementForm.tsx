import { AlignLeft, CalendarDays, Megaphone, ToggleRight, Type, Users } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { todayIsoDate } from '../../lib/datetime'
import {
  announcementAudiences,
  type AnnouncementAudience,
  type HeadquartersAnnouncement,
} from '../../types/app'

export type HeadquartersAnnouncementPayload = {
  title: string
  body: string
  audience: AnnouncementAudience
  publishedAt: string
  isPublished: boolean
}

export function HeadquartersAnnouncementForm({
  initial,
  onSubmit,
}: {
  initial?: HeadquartersAnnouncement
  onSubmit: (payload: HeadquartersAnnouncementPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    body: initial?.body ?? '',
    audience: (initial?.audience ?? '') as AnnouncementAudience | '',
    publishedAt: initial?.publishedAt ?? todayIsoDate(),
    isPublished: initial?.isPublished ?? true,
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.publishedAt) {
      toast.error(t('headquartersAnnouncements.publishedAtRequired'))
      return
    }
    if (!values.audience) {
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        body: values.body.trim(),
        audience: values.audience,
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
      icon={Megaphone}
      title={
        initial
          ? initial.title || t('headquartersAnnouncements.edit')
          : t('headquartersAnnouncements.create')
      }
      subtitle={initial ? undefined : t('headquartersAnnouncements.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('headquartersAnnouncements.titleLabel')} htmlFor="title">
          <input
            id="title"
            className={fieldClassName}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Users} label={t('headquartersAnnouncements.audience')} htmlFor="audience">
          <SearchSelect
            id="audience"
            value={values.audience}
            required
            placeholder={t('headquartersAnnouncements.selectAudience')}
            onChange={(next) => set('audience', next as AnnouncementAudience)}
            options={Object.values(announcementAudiences).map((value) => ({
              value,
              label: t(`headquartersAnnouncements.audiences.${value}`),
            }))}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('headquartersAnnouncements.body')} htmlFor="body">
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
        <FormField
          icon={CalendarDays}
          label={t('headquartersAnnouncements.publishedAt')}
          htmlFor="publishedAt"
        >
          <PersianDateField
            id="publishedAt"
            value={values.publishedAt || undefined}
            onChange={(next) => set('publishedAt', next ?? '')}
          />
        </FormField>
        <FormField
          icon={ToggleRight}
          label={t('headquartersAnnouncements.isPublished')}
          htmlFor="isPublished"
        >
          <ToggleField
            id="isPublished"
            checked={values.isPublished}
            onChange={(checked) => set('isPublished', checked)}
            onLabel={t('headquartersAnnouncements.published')}
            offLabel={t('headquartersAnnouncements.draft')}
          />
        </FormField>
        <FormActions
          submitLabel={t('headquartersAnnouncements.save')}
          cancelLabel={t('headquartersAnnouncements.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
