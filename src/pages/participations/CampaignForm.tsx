import {
  AlignLeft,
  CalendarRange,
  Coins,
  ImagePlus,
  Landmark,
  Languages,
  Megaphone,
  ToggleRight,
  Wallet,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { languageDir, languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import { optimizeImageFile } from '../../lib/optimize-image'
import type {
  BankAccount,
  CryptoWallet,
  ParticipationCampaign,
  ParticipationCampaignTranslation,
} from '../../types/app'

export type CampaignTranslationLocale = Exclude<AppLanguage, 'fa'>

export type CampaignPayload = {
  name: string
  startDate: string
  endDate: string
  description: string | null
  imageId: string | null
  isActive: boolean
  totalAmount: number
  sharePrice: number
  bankAccountId: string | null
  cryptoWalletId: string | null
  translations: ParticipationCampaignTranslation[]
}

type TranslationDraft = {
  name: string
  description: string
}

const emptyDraft = (): TranslationDraft => ({ name: '', description: '' })

export const campaignTranslationLocales = (Object.keys(languages) as AppLanguage[]).filter(
  (code): code is CampaignTranslationLocale => code !== 'fa',
)

function draftsFromInitial(
  translations?: ParticipationCampaignTranslation[],
): Record<CampaignTranslationLocale, TranslationDraft> {
  const next = Object.fromEntries(
    campaignTranslationLocales.map((locale) => [locale, emptyDraft()]),
  ) as Record<CampaignTranslationLocale, TranslationDraft>
  for (const item of translations ?? []) {
    if (!campaignTranslationLocales.includes(item.locale as CampaignTranslationLocale)) {
      continue
    }
    next[item.locale as CampaignTranslationLocale] = {
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

export function CampaignForm({
  initial,
  bankAccounts,
  cryptoWallets,
  onSubmit,
}: {
  initial?: ParticipationCampaign
  bankAccounts: BankAccount[]
  cryptoWallets: CryptoWallet[]
  onSubmit: (payload: CampaignPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    startDate: initial?.startDate?.slice(0, 10) ?? '',
    endDate: initial?.endDate?.slice(0, 10) ?? '',
    description: initial?.description ?? '',
    imageId: initial?.imageId ?? '',
    isActive: initial?.isActive ?? true,
    totalAmount: initial?.totalAmount != null ? String(initial.totalAmount) : '',
    sharePrice: initial?.sharePrice != null ? String(initial.sharePrice) : '',
    bankAccountId: initial?.bankAccountId ?? '',
    cryptoWalletId: initial?.cryptoWalletId ?? '',
  })
  const [localeTab, setLocaleTab] = useState<CampaignTranslationLocale>('ar')
  const [translations, setTranslations] = useState(() => draftsFromInitial(initial?.translations))

  const shareCount = useMemo(() => {
    const total = Number(values.totalAmount)
    const price = Number(values.sharePrice)
    if (!Number.isFinite(total) || !Number.isFinite(price) || price <= 0 || total <= 0) {
      return 0
    }
    return Math.floor(total / price)
  }, [values.sharePrice, values.totalAmount])

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setTranslation(
    locale: CampaignTranslationLocale,
    key: keyof TranslationDraft,
    value: string,
  ) {
    setTranslations((current) => ({
      ...current,
      [locale]: { ...current[locale], [key]: value },
    }))
  }

  const payloadTranslations = useMemo(() => {
    return campaignTranslationLocales.flatMap((locale) => {
      const draft = translations[locale]
      if (!isFilled(draft)) return []
      return [
        {
          locale,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
        },
      ]
    })
  }, [translations])

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

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.startDate || !values.endDate) {
      toast.error(t('participationCampaigns.datesRequired'))
      return
    }
    if (!values.bankAccountId && !values.cryptoWalletId) {
      toast.error(t('participationCampaigns.paymentRequired'))
      return
    }
    const totalAmount = Number(values.totalAmount)
    const sharePrice = Number(values.sharePrice)
    if (!Number.isFinite(totalAmount) || !Number.isFinite(sharePrice) || sharePrice > totalAmount) {
      toast.error(t('participationCampaigns.shareCountInvalid'))
      return
    }
    const incomplete = campaignTranslationLocales.find((locale) => {
      const draft = translations[locale]
      return isFilled(draft) && !isComplete(draft)
    })
    if (incomplete) {
      setLocaleTab(incomplete)
      toast.error(t('participationCampaigns.translationIncomplete'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        description: emptyToNull(values.description),
        imageId: emptyToNull(values.imageId),
        isActive: values.isActive,
        totalAmount,
        sharePrice,
        bankAccountId: emptyToNull(values.bankAccountId),
        cryptoWalletId: emptyToNull(values.cryptoWalletId),
        translations: payloadTranslations,
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
      title={initial ? initial.name : t('participationCampaigns.create')}
      subtitle={initial ? undefined : t('participationCampaigns.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormSectionTitle icon={Megaphone}>{t('participationCampaigns.persianContent')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('participationCampaigns.persianHint')}</p>
        <FormField icon={Megaphone} label={t('participationCampaigns.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('participationCampaigns.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>

        <FormSectionTitle icon={Languages}>{t('participationCampaigns.translations')}</FormSectionTitle>
        <p className="-mt-2 text-xs leading-6 text-ink-500">{t('participationCampaigns.translationsHint')}</p>
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
          {campaignTranslationLocales.map((locale) => {
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
          icon={Megaphone}
          label={t('participationCampaigns.name')}
          htmlFor={`name-${localeTab}`}
        >
          <input
            id={`name-${localeTab}`}
            className={fieldClassName}
            dir={languageDir(localeTab)}
            lang={localeTab}
            value={translations[localeTab].name}
            onChange={(e) => setTranslation(localeTab, 'name', e.target.value)}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('participationCampaigns.description')}
          htmlFor={`description-${localeTab}`}
        >
          <textarea
            id={`description-${localeTab}`}
            className={fieldClassName}
            dir={languageDir(localeTab)}
            lang={localeTab}
            rows={4}
            value={translations[localeTab].description}
            onChange={(e) => setTranslation(localeTab, 'description', e.target.value)}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={CalendarRange} label={t('participationCampaigns.startDate')} htmlFor="startDate">
            <PersianDateField
              id="startDate"
              value={values.startDate || undefined}
              onChange={(iso) => set('startDate', iso ?? '')}
            />
          </FormField>
          <FormField icon={CalendarRange} label={t('participationCampaigns.endDate')} htmlFor="endDate">
            <PersianDateField
              id="endDate"
              value={values.endDate || undefined}
              onChange={(iso) => set('endDate', iso ?? '')}
            />
          </FormField>
        </div>
        <FormField icon={ImagePlus} label={t('participationCampaigns.image')} htmlFor="campaign-image">
          <FileDropField
            id="campaign-image"
            accept="image/*"
            uploading={uploading}
            previewUrl={values.imageId ? getImageUrl(values.imageId) : undefined}
            onFile={(file) => void uploadImage(file)}
            onClear={() => set('imageId', '')}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Coins} label={t('participationCampaigns.totalAmount')} htmlFor="totalAmount">
            <input
              id="totalAmount"
              type="number"
              min={1}
              className={fieldClassName}
              value={values.totalAmount}
              onChange={(e) => set('totalAmount', e.target.value)}
              required
            />
          </FormField>
          <FormField icon={Coins} label={t('participationCampaigns.sharePrice')} htmlFor="sharePrice">
            <input
              id="sharePrice"
              type="number"
              min={1}
              className={fieldClassName}
              value={values.sharePrice}
              onChange={(e) => set('sharePrice', e.target.value)}
              required
            />
          </FormField>
        </div>
        {shareCount > 0 ? (
          <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {t('participationCampaigns.shareCountHint', {
              count: formatGroupedNumber(shareCount, locale),
            })}
          </p>
        ) : null}
        <FormField icon={Landmark} label={t('participationCampaigns.bankAccount')} htmlFor="bankAccountId">
          <SearchSelect
            id="bankAccountId"
            value={values.bankAccountId}
            onChange={(next) => set('bankAccountId', next)}
            placeholder={t('participationCampaigns.selectBankAccount')}
            options={[
              { value: '', label: t('participationCampaigns.none') },
              ...bankAccounts.map((item) => ({
                value: item.id,
                label: `${item.bankName} — ${item.accountNumber}`,
              })),
            ]}
          />
        </FormField>
        <FormField icon={Wallet} label={t('participationCampaigns.cryptoWallet')} htmlFor="cryptoWalletId">
          <SearchSelect
            id="cryptoWalletId"
            value={values.cryptoWalletId}
            onChange={(next) => set('cryptoWalletId', next)}
            placeholder={t('participationCampaigns.selectCryptoWallet')}
            options={[
              { value: '', label: t('participationCampaigns.none') },
              ...cryptoWallets.map((item) => ({
                value: item.id,
                label: `${item.label} (${item.currency}${item.network ? ` / ${item.network}` : ''})`,
              })),
            ]}
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
          submitLabel={t('participationCampaigns.save')}
          cancelLabel={t('participationCampaigns.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
