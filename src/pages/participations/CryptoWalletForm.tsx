import { Coins, Network, Tag, ToggleRight, Wallet } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { cryptoCurrencies, type CryptoWallet } from '../../types/app'

export type CryptoWalletPayload = {
  currency: string
  network: string | null
  address: string
  label: string
  isActive: boolean
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function CryptoWalletForm({
  initial,
  onSubmit,
}: {
  initial?: CryptoWallet
  onSubmit: (payload: CryptoWalletPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    currency: initial?.currency ?? '',
    network: initial?.network ?? '',
    address: initial?.address ?? '',
    label: initial?.label ?? '',
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
        currency: values.currency,
        network: emptyToNull(values.network),
        address: values.address.trim(),
        label: values.label.trim(),
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
      icon={Wallet}
      title={initial ? initial.label : t('cryptoWallets.create')}
      subtitle={initial ? undefined : t('cryptoWallets.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Tag} label={t('cryptoWallets.label')} htmlFor="label">
          <input
            id="label"
            className={fieldClassName}
            value={values.label}
            onChange={(e) => set('label', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Coins} label={t('cryptoWallets.currency')} htmlFor="currency">
          <SearchSelect
            id="currency"
            value={values.currency}
            required
            onChange={(next) => set('currency', next)}
            placeholder={t('cryptoWallets.selectCurrency')}
            options={[
              { value: '', label: t('cryptoWallets.selectCurrency') },
              ...cryptoCurrencies.map((currency) => ({
                value: currency,
                label: t(`cryptoCurrencies.${currency}`),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Network} label={t('cryptoWallets.network')} htmlFor="network">
          <input
            id="network"
            className={fieldClassName}
            value={values.network}
            onChange={(e) => set('network', e.target.value)}
          />
        </FormField>
        <FormField icon={Wallet} label={t('cryptoWallets.address')} htmlFor="address">
          <input
            id="address"
            className={`${fieldClassName} digit-field`}
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
            required
            minLength={8}
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
          submitLabel={t('cryptoWallets.save')}
          cancelLabel={t('cryptoWallets.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
