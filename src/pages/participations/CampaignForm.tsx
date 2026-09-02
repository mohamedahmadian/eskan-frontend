import {
  AlignLeft,
  CalendarRange,
  Coins,
  ImagePlus,
  Landmark,
  Megaphone,
  ToggleRight,
  Wallet,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import { optimizeImageFile } from '../../lib/optimize-image'
import type { BankAccount, CryptoWallet, ParticipationCampaign } from '../../types/app'

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
        <FormField icon={AlignLeft} label={t('participationCampaigns.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
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
