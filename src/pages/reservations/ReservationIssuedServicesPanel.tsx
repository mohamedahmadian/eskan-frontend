import {
  Banknote,
  Calendar,
  CreditCard,
  Landmark,
  Smartphone,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  fieldClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { toLatinDigits } from '../../lib/datetime'
import type { Reservation } from '../../types/app'
import { BANK_CODES, SIM_OPERATOR_CODES } from './reservation-service-options'

type IssuedDraft = {
  simCardNumber: string
  simCardOperator: string
  simCardDeliveredAt: string
  simCardInitialCharge: string
  bankCardNumber: string
  bankCardIban: string
  bankCardBank: string
  bankCardDeliveredAt: string
  bankCardInitialBalance: string
}

function draftFromReservation(reservation: Reservation): IssuedDraft {
  return {
    simCardNumber: reservation.simCardNumber ?? '',
    simCardOperator: reservation.simCardOperator ?? '',
    simCardDeliveredAt: reservation.simCardDeliveredAt ?? '',
    simCardInitialCharge:
      reservation.simCardInitialCharge != null ? String(reservation.simCardInitialCharge) : '',
    bankCardNumber: reservation.bankCardNumber ?? '',
    bankCardIban: reservation.bankCardIban ?? '',
    bankCardBank: reservation.bankCardBank ?? '',
    bankCardDeliveredAt: reservation.bankCardDeliveredAt ?? '',
    bankCardInitialBalance:
      reservation.bankCardInitialBalance != null
        ? String(reservation.bankCardInitialBalance)
        : '',
  }
}

function optionalNumber(value: string) {
  const latin = toLatinDigits(value).trim()
  if (!latin) return null
  const parsed = Number(latin)
  return Number.isFinite(parsed) ? parsed : null
}

export function ReservationIssuedServicesPanel({
  reservation,
  onChanged,
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const showSim =
    reservation.requestsSimCard ||
    Boolean(
      reservation.simCardNumber ||
        reservation.simCardOperator ||
        reservation.simCardDeliveredAt ||
        reservation.simCardInitialCharge != null,
    )
  const showBank =
    reservation.requestsBankCard ||
    Boolean(
      reservation.bankCardNumber ||
        reservation.bankCardIban ||
        reservation.bankCardBank ||
        reservation.bankCardDeliveredAt ||
        reservation.bankCardInitialBalance != null,
    )
  const cancelled = reservation.status === 'CANCELLED'
  const [draft, setDraft] = useState<IssuedDraft>(() => draftFromReservation(reservation))

  useEffect(() => {
    setDraft(draftFromReservation(reservation))
  }, [reservation.id, reservation.updatedAt])

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, string | number | null> = {}
      if (showSim) {
        body.simCardNumber = toLatinDigits(draft.simCardNumber).trim() || null
        body.simCardOperator = draft.simCardOperator || null
        body.simCardDeliveredAt = draft.simCardDeliveredAt || null
        body.simCardInitialCharge = optionalNumber(draft.simCardInitialCharge)
      }
      if (showBank) {
        body.bankCardNumber = toLatinDigits(draft.bankCardNumber).replace(/\s/g, '') || null
        body.bankCardIban = toLatinDigits(draft.bankCardIban).replace(/\s/g, '').toUpperCase() || null
        body.bankCardBank = draft.bankCardBank || null
        body.bankCardDeliveredAt = draft.bankCardDeliveredAt || null
        body.bankCardInitialBalance = optionalNumber(draft.bankCardInitialBalance)
      }
      const { data } = await api.patch<Reservation>(`/reservations/${reservation.id}`, body)
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.issuedServicesSaved'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  if (!showSim && !showBank) return null

  const operatorOptions = SIM_OPERATOR_CODES.map((code) => ({
    value: code,
    label: t(`reservations.simOperators.${code}`),
  }))
  const bankOptions = BANK_CODES.map((code) => ({
    value: code,
    label: t(`reservations.banks.${code}`),
  }))

  return (
    <FormCard
      className="mb-4"
      icon={CreditCard}
      title={t('reservations.issuedServicesTitle')}
      subtitle={t('reservations.issuedServicesSubtitle')}
    >
      <AppForm
        onSubmit={() => {
          if (!cancelled) save.mutate()
        }}
        className={formCardBodyClassName}
      >
        {showSim ? (
          <div className="space-y-4">
            <FormSectionTitle icon={Smartphone}>
              {t('reservations.issuedSimTitle')}
            </FormSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={Smartphone}
                label={t('reservations.simCardNumber')}
                htmlFor="issued-sim-number"
              >
                <input
                  id="issued-sim-number"
                  className={fieldClassName}
                  dir="ltr"
                  inputMode="numeric"
                  value={draft.simCardNumber}
                  disabled={cancelled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      simCardNumber: toLatinDigits(event.target.value),
                    }))
                  }
                />
              </FormField>
              <FormField icon={Smartphone} label={t('reservations.simCardOperator')}>
                <SearchSelect
                  value={draft.simCardOperator}
                  onChange={(simCardOperator) =>
                    setDraft((current) => ({ ...current, simCardOperator }))
                  }
                  options={operatorOptions}
                  placeholder={t('reservations.simCardOperator')}
                  disabled={cancelled}
                />
              </FormField>
              <FormField
                icon={Calendar}
                label={t('reservations.simCardDeliveredAt')}
                htmlFor="issued-sim-delivered"
              >
                {cancelled ? (
                  <p className="text-sm text-ink-800">
                    {draft.simCardDeliveredAt ? (
                      <DateText value={draft.simCardDeliveredAt} />
                    ) : (
                      t('reservations.notEntered')
                    )}
                  </p>
                ) : (
                  <PersianDateField
                    id="issued-sim-delivered"
                    value={draft.simCardDeliveredAt}
                    onChange={(next) =>
                      setDraft((current) => ({ ...current, simCardDeliveredAt: next ?? '' }))
                    }
                  />
                )}
              </FormField>
              <FormField
                icon={Banknote}
                label={t('reservations.simCardInitialCharge')}
                htmlFor="issued-sim-charge"
              >
                <input
                  id="issued-sim-charge"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  dir="ltr"
                  value={draft.simCardInitialCharge}
                  disabled={cancelled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      simCardInitialCharge: toLatinDigits(event.target.value),
                    }))
                  }
                />
              </FormField>
            </div>
          </div>
        ) : null}

        {showBank ? (
          <div className="space-y-4">
            <FormSectionTitle icon={CreditCard}>
              {t('reservations.issuedBankTitle')}
            </FormSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={CreditCard}
                label={t('reservations.bankCardNumber')}
                htmlFor="issued-bank-number"
              >
                <input
                  id="issued-bank-number"
                  className={fieldClassName}
                  dir="ltr"
                  inputMode="numeric"
                  value={draft.bankCardNumber}
                  disabled={cancelled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      bankCardNumber: toLatinDigits(event.target.value),
                    }))
                  }
                />
              </FormField>
              <FormField
                icon={CreditCard}
                label={t('reservations.bankCardIban')}
                htmlFor="issued-bank-iban"
              >
                <input
                  id="issued-bank-iban"
                  className={fieldClassName}
                  dir="ltr"
                  value={draft.bankCardIban}
                  disabled={cancelled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      bankCardIban: toLatinDigits(event.target.value).toUpperCase(),
                    }))
                  }
                />
              </FormField>
              <FormField icon={Landmark} label={t('reservations.bankCardBank')}>
                <SearchSelect
                  value={draft.bankCardBank}
                  onChange={(bankCardBank) =>
                    setDraft((current) => ({ ...current, bankCardBank }))
                  }
                  options={bankOptions}
                  placeholder={t('reservations.bankCardBank')}
                  disabled={cancelled}
                />
              </FormField>
              <FormField
                icon={Calendar}
                label={t('reservations.bankCardDeliveredAt')}
                htmlFor="issued-bank-delivered"
              >
                {cancelled ? (
                  <p className="text-sm text-ink-800">
                    {draft.bankCardDeliveredAt ? (
                      <DateText value={draft.bankCardDeliveredAt} />
                    ) : (
                      t('reservations.notEntered')
                    )}
                  </p>
                ) : (
                  <PersianDateField
                    id="issued-bank-delivered"
                    value={draft.bankCardDeliveredAt}
                    onChange={(next) =>
                      setDraft((current) => ({ ...current, bankCardDeliveredAt: next ?? '' }))
                    }
                  />
                )}
              </FormField>
              <FormField
                icon={Banknote}
                label={t('reservations.bankCardInitialBalance')}
                htmlFor="issued-bank-balance"
              >
                <input
                  id="issued-bank-balance"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  dir="ltr"
                  value={draft.bankCardInitialBalance}
                  disabled={cancelled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      bankCardInitialBalance: toLatinDigits(event.target.value),
                    }))
                  }
                />
              </FormField>
            </div>
          </div>
        ) : null}

        {cancelled ? null : (
          <FormActions submitLabel={t('common.save')} submitting={save.isPending} />
        )}
      </AppForm>
    </FormCard>
  )
}

export function simOperatorLabel(code: string | null | undefined, t: (key: string) => string) {
  if (!code) return ''
  const key = `reservations.simOperators.${code}`
  const label = t(key)
  return label === key ? code : label
}

export function bankLabel(code: string | null | undefined, t: (key: string) => string) {
  if (!code) return ''
  const key = `reservations.banks.${code}`
  const label = t(key)
  return label === key ? code : label
}
