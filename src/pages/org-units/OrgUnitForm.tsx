import { AlignLeft, Building, Languages, MessageCircle, Phone, Send, Type } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { languageDir, languages, type AppLanguage } from '../../i18n'
import { getApiErrorMessage } from '../../lib/api'
import type { OrgUnit, OrgUnitTranslation } from '../../types/app'
import { UnitManagerPicker, type UnitManagerChoice } from './UnitManagerPicker'

export type UnitTranslationLocale = Exclude<AppLanguage, 'fa'>

export type OrgUnitPayload = {
  name: string
  phone: string | null
  description: string | null
  eitaaChannel: string | null
  telegramChannel: string | null
  managerUserId: string | null
  translations: OrgUnitTranslation[]
}

type TranslationDraft = {
  name: string
  description: string
}

const emptyDraft = (): TranslationDraft => ({ name: '', description: '' })

export const unitTranslationLocales = (Object.keys(languages) as AppLanguage[]).filter(
  (code): code is UnitTranslationLocale => code !== 'fa',
)

function draftsFromInitial(
  translations?: OrgUnitTranslation[],
): Record<UnitTranslationLocale, TranslationDraft> {
  const next = Object.fromEntries(
    unitTranslationLocales.map((locale) => [locale, emptyDraft()]),
  ) as Record<UnitTranslationLocale, TranslationDraft>
  for (const item of translations ?? []) {
    if (!unitTranslationLocales.includes(item.locale as UnitTranslationLocale)) {
      continue
    }
    next[item.locale as UnitTranslationLocale] = {
      name: item.name ?? '',
      description: item.description ?? '',
    }
  }
  return next
}

function isFilled(draft: TranslationDraft) {
  return Boolean(draft.name.trim() || draft.description.trim())
}

function isComplete(draft: TranslationDraft) {
  return draft.name.trim().length >= 2
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
  const [localeTab, setLocaleTab] = useState<UnitTranslationLocale>('ar')
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
  const [translations, setTranslations] = useState(() => draftsFromInitial(initial?.translations))

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setTranslation(locale: UnitTranslationLocale, key: keyof TranslationDraft, value: string) {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [key]: value },
    }))
  }

  const payloadTranslations = useMemo(() => {
    return unitTranslationLocales.flatMap((locale) => {
      const draft = translations[locale]
      if (!isFilled(draft)) return []
      return [
        {
          locale,
          name: draft.name.trim(),
          description: emptyToNull(draft.description),
        },
      ]
    })
  }, [translations])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const incomplete = unitTranslationLocales.find((locale) => {
      const draft = translations[locale]
      return isFilled(draft) && !isComplete(draft)
    })
    if (incomplete) {
      setLocaleTab(incomplete)
      toast.error(t('orgUnits.translationIncomplete'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        phone: emptyToNull(values.phone),
        description: emptyToNull(values.description),
        eitaaChannel: emptyToNull(values.eitaaChannel),
        telegramChannel: emptyToNull(values.telegramChannel),
        managerUserId: manager?.id ?? null,
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
      icon={Building}
      title={initial ? initial.name || t('orgUnits.edit') : t('orgUnits.create')}
      subtitle={initial ? undefined : t('orgUnits.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormSectionTitle icon={Type}>{t('orgUnits.persianContent')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('orgUnits.persianHint')}</p>
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
        <FormField icon={AlignLeft} label={t('orgUnits.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>

        <FormSectionTitle icon={Languages}>{t('orgUnits.translations')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('orgUnits.translationsHint')}</p>
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
          {unitTranslationLocales.map((locale) => {
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
          icon={Building}
          label={t('orgUnits.name')}
          htmlFor={`name-${localeTab}`}
        >
          <input
            id={`name-${localeTab}`}
            className={fieldClassName}
            dir={activeDir}
            lang={localeTab}
            value={activeDraft.name}
            onChange={(e) => setTranslation(localeTab, 'name', e.target.value)}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('orgUnits.description')}
          htmlFor={`description-${localeTab}`}
        >
          <textarea
            id={`description-${localeTab}`}
            className={fieldClassName}
            dir={activeDir}
            lang={localeTab}
            rows={3}
            value={activeDraft.description}
            onChange={(e) => setTranslation(localeTab, 'description', e.target.value)}
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
