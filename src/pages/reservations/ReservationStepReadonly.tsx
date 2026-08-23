import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, cardClassName } from '../../components/ui/Form'
import type { Reservation } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'
import { contactRoles, type ReservationStepCode } from './reservation-steps'
import { ReservationCompleteSummary } from './ReservationCompleteSummary'
import { ReservationInsuranceSummary } from './ReservationInsuranceSummary'
import { ReservationTravelSummary } from './ReservationTravelSummary'

export function ReservationStepReadonly({
  reservation,
  step,
  onBack,
  backLabel,
}: {
  reservation: Reservation
  step: ReservationStepCode
  onBack: () => void
  backLabel?: string
}) {
  const { t } = useTranslation()
  const members = reservation.members ?? []
  const contacts = reservation.caravanContacts ?? []
  const backButton = (
    <Button type="button" variant="ghost" onClick={onBack}>
      <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
      {backLabel ?? t('reservations.backToCurrentStep')}
    </Button>
  )

  if (step === 'travel' || step === 'review') {
    return (
      <ReservationTravelSummary
        reservation={reservation}
        variant={step}
        hint={t('reservations.readonlyHint')}
        readonly
        footer={backButton}
      />
    )
  }

  if (step === 'insurance') {
    return (
      <ReservationInsuranceSummary
        reservation={reservation}
        hint={t('reservations.readonlyHint')}
        readonly
        footer={backButton}
      />
    )
  }

  if (step === 'complete') {
    return <ReservationCompleteSummary reservation={reservation} footer={backButton} />
  }

  return (
    <div className={`${cardClassName} space-y-3 p-6`}>
      <p className="text-sm text-ink-500">{t('reservations.readonlyHint')}</p>
      <h2 className="text-base font-medium text-ink-900">{t(`reservations.steps.${step}`)}</h2>

      {step === 'companions' ? (
        members.length ? (
          <ul className="space-y-1 text-sm text-ink-800">
            {members.map((item) => (
              <li key={item.id}>{item.user.fullName}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">{t('reservations.membersEmpty')}</p>
        )
      ) : null}

      {step === 'contacts' ? (
        <dl className="grid gap-1 text-sm">
          {contactRoles.map((role) => {
            const current = contacts.find((item) => item.role === role)
            return (
              <DetailRow
                key={role}
                label={t(`caravans.contactRoles.${role}`)}
                value={current?.user.fullName ?? t('caravans.contactEmpty')}
              />
            )
          })}
        </dl>
      ) : null}

      {backButton}
    </div>
  )
}
