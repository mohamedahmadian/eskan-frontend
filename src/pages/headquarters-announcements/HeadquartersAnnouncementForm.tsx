import { AlignLeft, CalendarDays, Languages, Megaphone, ToggleRight, Type, Users } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { languageDir, languages, type AppLanguage } from '../../i18n'
import { getApiErrorMessage } from '../../lib/api'
import { todayIsoDate } from '../../lib/datetime'
import {
  announcementAudiences,
  type AnnouncementAudience,
  type HeadquartersAnnouncement,
  type HeadquartersAnnouncementTranslation,
} from '../../types/app'

export type ContentTranslationLocale = Exclude<AppLanguage, 'fa'>

export type HeadquartersAnnouncementPayload = {
  title: string
  body: string
  audience: AnnouncementAudience
  publishedAt: string
  isPublished: boolean
  translations: HeadquartersAnnouncementTranslation[]
}

type TranslationDraft = {
  title: string
  body: string
}

const emptyDraft = (): TranslationDraft => ({ title: '', body: '' })

export const contentTranslationLocales = (Object.keys(languages) as AppLanguage[]).filter(
  (code): code is ContentTranslationLocale => code !== 'fa',
)

function draftsFromInitial(
  translations?: HeadquartersAnnouncementTranslation[],
): Record<ContentTranslationLocale, TranslationDraft> {
  const next = Object.fromEntries(
    contentTranslationLocales.map((locale) => [locale, emptyDraft()]),
  ) as Record<ContentTranslationLocale, TranslationDraft>
  for (const item of translations ?? []) {
    if (!contentTranslationLocales.includes(item.locale as ContentTranslationLocale)) {
      continue
    }
    next[item.locale as ContentTranslationLocale] = {
      title: item.title ?? '',
      body: item.body ?? '',
    }
  }
  return next
}

function isFilled(draft: TranslationDraft) {
  return Boolean(draft.title.trim() || draft.body.trim())
}

function isComplete(draft: TranslationDraft) {
  return draft.title.trim().length >= 2 && draft.body.trim().length >= 2
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
  const [localeTab, setLocaleTab] = useState<ContentTranslationLocale>('ar')
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    body: initial?.body ?? '',
    audience: (initial?.audience ?? '') as AnnouncementAudience | '',
    publishedAt: initial?.publishedAt ?? todayIsoDate(),
    isPublished: initial?.isPublished ?? true,
  })
  const [translations, setTranslations] = useState(() => draftsFromInitial(initial?.translations))

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setTranslation(locale: ContentTranslationLocale, key: keyof TranslationDraft, value: string) {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [key]: value },
    }))
  }

  const payloadTranslations = useMemo(() => {
    return contentTranslationLocales.flatMap((locale) => {
      const draft = translations[locale]
      if (!isFilled(draft)) return []
      return [
        {
          locale,
          title: draft.title.trim(),
          body: draft.body.trim(),
        },
      ]
    })
  }, [translations])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.publishedAt) {
      toast.error(t('headquartersAnnouncements.publishedAtRequired'))
      return
    }
    if (!values.audience) {
      return
    }
    const incomplete = contentTranslationLocales.find((locale) => {
      const draft = translations[locale]
      return isFilled(draft) && !isComplete(draft)
    })
    if (incomplete) {
      setLocaleTab(incomplete)
      toast.error(t('headquartersAnnouncements.translationIncomplete'))
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
        translations: payloadTranslations,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const activeDraft = translations[localeTab]
  const activeDir = languageDir(localeTab)

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
        <FormSectionTitle icon={Type}>{t('headquartersAnnouncements.persianContent')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('headquartersAnnouncements.persianHint')}</p>
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

        <FormSectionTitle icon={Languages}>{t('headquartersAnnouncements.translations')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('headquartersAnnouncements.translationsHint')}</p>
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
          {contentTranslationLocales.map((locale) => {
            const active = localeTab === locale
            const filled = isComplete(translations[locale])
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setLocaleTab(locale)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                    : 'bg-white text-ink-700 hover:bg-cream-100'
                }`}
              >
                {t(`languages.${locale}`)}
                {filled ? (
                  <span
                    className={`size-1.5 rounded-full ${active ? 'bg-white' : 'bg-mint-500'}`}
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          })}
        </nav>
        <FormField
          icon={Type}
          label={t('headquartersAnnouncements.titleLabel')}
          htmlFor={`title-${localeTab}`}
        >
          <input
            id={`title-${localeTab}`}
            className={fieldClassName}
            dir={activeDir}
            lang={localeTab}
            value={activeDraft.title}
            onChange={(e) => setTranslation(localeTab, 'title', e.target.value)}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('headquartersAnnouncements.body')}
          htmlFor={`body-${localeTab}`}
        >
          <textarea
            id={`body-${localeTab}`}
            className={fieldClassName}
            dir={activeDir}
            lang={localeTab}
            rows={8}
            value={activeDraft.body}
            onChange={(e) => setTranslation(localeTab, 'body', e.target.value)}
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
