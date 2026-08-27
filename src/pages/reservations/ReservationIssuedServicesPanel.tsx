import {
  Banknote,
  Calendar,
  CreditCard,
  Landmark,
  Smartphone,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCardHeader, formCardBodyClassName } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { toLatinDigits } from '../../lib/datetime'
import type { Reservation } from '../../types/app'
import { BANK_CODES, SIM_OPERATOR_CODES } from './reservation-service-options'

export type IssuedServiceSection = 'sim' | 'bank'

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

export function ReservationIssuedServicesModal({
  reservation,
  section,
  onChanged,
  onClose,
}: {
  reservation: Reservation
  section: IssuedServiceSection
  onChanged: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const isSim = section === 'sim'
  const cancelled = reservation.status === 'CANCELLED'
  const [draft, setDraft] = useState<IssuedDraft>(() => draftFromReservation(reservation))

  useEffect(() => {
    setDraft(draftFromReservation(reservation))
  }, [reservation.id, reservation.updatedAt, section])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, string | number | null> = isSim
        ? {
            simCardNumber: toLatinDigits(draft.simCardNumber).trim() || null,
            simCardOperator: draft.simCardOperator || null,
            simCardDeliveredAt: draft.simCardDeliveredAt || null,
            simCardInitialCharge: optionalNumber(draft.simCardInitialCharge),
          }
        : {
            bankCardNumber: toLatinDigits(draft.bankCardNumber).replace(/\s/g, '') || null,
            bankCardIban:
              toLatinDigits(draft.bankCardIban).replace(/\s/g, '').toUpperCase() || null,
            bankCardBank: draft.bankCardBank || null,
            bankCardDeliveredAt: draft.bankCardDeliveredAt || null,
            bankCardInitialBalance: optionalNumber(draft.bankCardInitialBalance),
          }
      const { data } = await api.patch<Reservation>(`/reservations/${reservation.id}`, body)
      return data
    },
    onSuccess: () => {
      toast.success(
        t(isSim ? 'reservations.issuedSimSaved' : 'reservations.issuedBankSaved'),
      )
      onChanged()
      onClose()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const operatorOptions = SIM_OPERATOR_CODES.map((code) => ({
    value: code,
    label: t(`reservations.simOperators.${code}`),
  }))
  const bankOptions = BANK_CODES.map((code) => ({
    value: code,
    label: t(`reservations.banks.${code}`),
  }))

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(isSim ? 'reservations.trackSimCard' : 'reservations.trackMobile')}
        className={`relative z-10 flex max-h-[min(90vh,44rem)] w-full max-w-2xl flex-col overflow-hidden ${cardClassName}`}
      >
        <FormCardHeader
          icon={isSim ? Smartphone : CreditCard}
          title={t(isSim ? 'reservations.trackSimCard' : 'reservations.trackMobile')}
          subtitle={t(
            isSim ? 'reservations.issuedSimSubtitle' : 'reservations.issuedBankSubtitle',
          )}
          action={
            <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.cancel')}>
              <X className="size-4" aria-hidden />
            </Button>
          }
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AppForm
            onSubmit={() => {
              if (!cancelled) save.mutate()
            }}
            className={formCardBodyClassName}
          >
            {isSim ? (
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
            ) : (
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
            )}

            {cancelled ? null : (
              <FormActions
                submitLabel={t('common.save')}
                cancelLabel={t('common.cancel')}
                submitting={save.isPending}
                onCancel={onClose}
              />
            )}
          </AppForm>
        </div>
      </div>
    </div>,
    document.body,
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
