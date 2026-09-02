import { Building2, CreditCard, Hash, Landmark, ToggleRight, WalletCards } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { BankAccount } from '../../types/app'

export type BankAccountPayload = {
  bankName: string
  accountNumber: string
  cardNumber: string | null
  iban: string
  isActive: boolean
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function BankAccountForm({
  initial,
  onSubmit,
}: {
  initial?: BankAccount
  onSubmit: (payload: BankAccountPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    bankName: initial?.bankName ?? '',
    accountNumber: initial?.accountNumber ?? '',
    cardNumber: initial?.cardNumber ?? '',
    iban: initial?.iban ?? '',
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
        bankName: values.bankName.trim(),
        accountNumber: values.accountNumber.trim(),
        cardNumber: emptyToNull(values.cardNumber),
        iban: values.iban.trim(),
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
      icon={Landmark}
      title={initial ? initial.bankName : t('bankAccounts.create')}
      subtitle={initial ? undefined : t('bankAccounts.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Building2} label={t('bankAccounts.bankName')} htmlFor="bankName">
          <input
            id="bankName"
            className={fieldClassName}
            value={values.bankName}
            onChange={(e) => set('bankName', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Hash} label={t('bankAccounts.accountNumber')} htmlFor="accountNumber">
          <input
            id="accountNumber"
            className={`${fieldClassName} digit-field`}
            value={values.accountNumber}
            onChange={(e) => set('accountNumber', e.target.value)}
            required
            minLength={4}
            inputMode="numeric"
          />
        </FormField>
        <FormField icon={CreditCard} label={t('bankAccounts.cardNumber')} htmlFor="cardNumber">
          <input
            id="cardNumber"
            className={`${fieldClassName} digit-field`}
            value={values.cardNumber}
            onChange={(e) => set('cardNumber', e.target.value)}
            inputMode="numeric"
          />
        </FormField>
        <FormField icon={WalletCards} label={t('bankAccounts.iban')} htmlFor="iban">
          <input
            id="iban"
            className={`${fieldClassName} digit-field`}
            value={values.iban}
            onChange={(e) => set('iban', e.target.value)}
            required
            minLength={10}
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
          submitLabel={t('bankAccounts.save')}
          cancelLabel={t('bankAccounts.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
