import { AlignLeft, CalendarDays, ImagePlus, Languages, Newspaper, ToggleRight, Type } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { languageDir, languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { todayIsoDate } from '../../lib/datetime'
import { optimizeImageFile } from '../../lib/optimize-image'
import type { HeadquartersNews, HeadquartersNewsTranslation } from '../../types/app'

export type NewsTranslationLocale = Exclude<AppLanguage, 'fa'>

export type HeadquartersNewsPayload = {
  title: string
  summary: string | null
  body: string
  publishedAt: string
  isPublished: boolean
  imageId: string | null
  translations: HeadquartersNewsTranslation[]
}

type TranslationDraft = {
  title: string
  summary: string
  body: string
}

const emptyDraft = (): TranslationDraft => ({ title: '', summary: '', body: '' })

export const newsTranslationLocales = (Object.keys(languages) as AppLanguage[]).filter(
  (code): code is NewsTranslationLocale => code !== 'fa',
)

function draftsFromInitial(
  translations?: HeadquartersNewsTranslation[],
): Record<NewsTranslationLocale, TranslationDraft> {
  const next = Object.fromEntries(
    newsTranslationLocales.map((locale) => [locale, emptyDraft()]),
  ) as Record<NewsTranslationLocale, TranslationDraft>
  for (const item of translations ?? []) {
    if (!newsTranslationLocales.includes(item.locale as NewsTranslationLocale)) {
      continue
    }
    next[item.locale as NewsTranslationLocale] = {
      title: item.title ?? '',
      summary: item.summary ?? '',
      body: item.body ?? '',
    }
  }
  return next
}

function isFilled(draft: TranslationDraft) {
  return Boolean(draft.title.trim() || draft.summary.trim() || draft.body.trim())
}

function isComplete(draft: TranslationDraft) {
  return draft.title.trim().length >= 2 && draft.body.trim().length >= 2
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
  const [uploading, setUploading] = useState(false)
  const [localeTab, setLocaleTab] = useState<NewsTranslationLocale>('ar')
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    body: initial?.body ?? '',
    publishedAt: initial?.publishedAt ?? todayIsoDate(),
    isPublished: initial?.isPublished ?? true,
    imageId: initial?.imageId ?? '',
  })
  const [translations, setTranslations] = useState(() => draftsFromInitial(initial?.translations))

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function uploadImage(file: File) {
    setUploading(true)
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>('/images', body)
      set('imageId', data.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
    }
  }

  function setTranslation(locale: NewsTranslationLocale, key: keyof TranslationDraft, value: string) {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [key]: value },
    }))
  }

  const payloadTranslations = useMemo(() => {
    return newsTranslationLocales.flatMap((locale) => {
      const draft = translations[locale]
      if (!isFilled(draft)) return []
      return [
        {
          locale,
          title: draft.title.trim(),
          summary: draft.summary.trim() || null,
          body: draft.body.trim(),
        },
      ]
    })
  }, [translations])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.publishedAt) {
      toast.error(t('headquartersNews.publishedAtRequired'))
      return
    }
    const incomplete = newsTranslationLocales.find((locale) => {
      const draft = translations[locale]
      return isFilled(draft) && !isComplete(draft)
    })
    if (incomplete) {
      setLocaleTab(incomplete)
      toast.error(t('headquartersNews.translationIncomplete'))
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
        imageId: values.imageId.trim() || null,
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
      icon={Newspaper}
      title={initial ? initial.title || t('headquartersNews.edit') : t('headquartersNews.create')}
      subtitle={initial ? undefined : t('headquartersNews.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormSectionTitle icon={Type}>{t('headquartersNews.persianContent')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('headquartersNews.persianHint')}</p>
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
        <FormField icon={ImagePlus} label={t('headquartersNews.image')} htmlFor="news-image">
          <FileDropField
            id="news-image"
            accept="image/*"
            uploading={uploading}
            previewUrl={values.imageId ? getImageUrl(values.imageId) : undefined}
            onFile={(file) => void uploadImage(file)}
            onClear={() => set('imageId', '')}
          />
        </FormField>

        <FormSectionTitle icon={Languages}>{t('headquartersNews.translations')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('headquartersNews.translationsHint')}</p>
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
          {newsTranslationLocales.map((locale) => {
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
          label={t('headquartersNews.titleLabel')}
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
          label={t('headquartersNews.summary')}
          htmlFor={`summary-${localeTab}`}
        >
          <input
            id={`summary-${localeTab}`}
            className={fieldClassName}
            dir={activeDir}
            lang={localeTab}
            value={activeDraft.summary}
            onChange={(e) => setTranslation(localeTab, 'summary', e.target.value)}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('headquartersNews.body')}
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
