import {
  ArrowRight,
  ClipboardCheck,
  IdCard,
  Phone,
  RotateCcw,
  StickyNote,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormField,
  LoadingState,
  PageHeader,
  cardClassName,
  fieldClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import type { Reservation, ReservationPerson, ReservationStatus } from '../../types/app'
import {
  currentStepFromStatus,
  isInsuranceAccepted,
  ownerFlowSteps,
  validRewindStatuses,
  type ReservationStepCode,
} from './reservation-steps'
import { ReservationReviewActions } from './ReservationReviewModal'
import { ReservationStatusBadge } from './ReservationStatusBadge'
import { ReservationSectionHeader, ReservationTitleMeta } from './ReservationSectionHeader'
import { ReservationTimeline } from './ReservationTimeline'
import { ReservationWizardShell } from './ReservationWizardShell'
import { ReservationTravelSummary } from './ReservationTravelSummary'
import { ReservationTravelStep } from './ReservationTravelStep'
import { ReservationContactsStep } from './ReservationContactsStep'
import { CompanionsStep } from './ReservationCompanionsStep'
import { ReservationStepReadonly } from './ReservationStepReadonly'
import { ReservationCompleteSummary } from './ReservationCompleteSummary'
import { InsuranceStep } from './ReservationInsuranceStep'
import { ReservationPermitPanel } from './ReservationPermitPanel'

function personName(person?: ReservationPerson | null) {
  return person?.fullName || '—'
}

export function ReservationAdminDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['reservations', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${id}`)
      return data
    },
  })

  const reservation = query.data
  const currentStep = reservation
    ? currentStepFromStatus(reservation.status, reservation.type)
    : 'travel'
  const cancelled = reservation?.status === 'CANCELLED'
  const [viewedStep, setViewedStep] = useState<ReservationStepCode | null>(
    cancelled ? null : currentStep,
  )

  useEffect(() => {
    setViewedStep(cancelled ? null : currentStep)
  }, [cancelled, currentStep])

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['reservations', id] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', 'admin'] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', 'dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', id, 'insurance'] })
  }

  if (!id || query.isLoading) return <LoadingState />
  if (query.isError || !reservation) {
    return <p className="text-sm text-red-700">{t('common.error')}</p>
  }

  const rejected = reservation.status === 'REJECTED'
  const pendingReview = reservation.status === 'PENDING_MANAGEMENT_REVIEW'
  const canRejectMidStage =
    !rejected && reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED'
  const rewindTargets = validRewindStatuses(reservation.type, reservation.status)

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={`${t('reservations.wizard')} ${formatNumber(reservation.year, locale)}`}
        subtitle={
          <ReservationTitleMeta
            reservation={reservation}
            extra={<ReservationStatusBadge status={reservation.status} />}
          />
        }
        action={
          pendingReview ? (
            <ReservationReviewActions
              reservation={reservation}
              onChanged={refresh}
              compact
              requireRejectReason
            />
          ) : canRejectMidStage ? (
            <ReservationReviewActions
              reservation={reservation}
              onChanged={refresh}
              compact
              rejectOnly
              requireRejectReason
            />
          ) : null
        }
      />

      <ApplicantCard
        person={
          reservation.type === 'CARAVAN' && reservation.caravanManager
            ? reservation.caravanManager
            : reservation.createdBy
        }
        locale={locale}
        caravanApplicant={reservation.type === 'CARAVAN' && Boolean(reservation.caravanManager)}
      />

      {rejected && reservation.rejectionReason ? (
        <div className={`${cardClassName} mb-4 flex items-start gap-3 border-red-100 p-4`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <X className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-red-700">{t('reservations.rejectedTitle')}</p>
            <p className="mt-1 text-sm text-ink-800">{reservation.rejectionReason}</p>
          </div>
        </div>
      ) : null}

      <ReservationWizardShell
        reservation={reservation}
        viewedStep={viewedStep}
        onViewStep={setViewedStep}
        audience="admin"
      >
        {reservation.status === 'CANCELLED' ? (
          viewedStep ? (
            <ReservationStepReadonly
              reservation={reservation}
              step={viewedStep}
              audience="admin"
              onBack={() => setViewedStep(null)}
              backLabel={t('reservations.backToFileInfo')}
            />
          ) : (
            <ReservationCompleteSummary
              reservation={reservation}
              variant="cancelled"
              audience="admin"
            />
          )
        ) : (
          <AdminEditableStep
            reservation={reservation}
            step={viewedStep ?? currentStep}
            onGoToStep={setViewedStep}
            onChanged={refresh}
            footer={
              viewedStep &&
              viewedStep !== currentStep &&
              !ownerFlowSteps(reservation.type).includes(viewedStep) ? (
                <Button type="button" variant="ghost" onClick={() => setViewedStep(currentStep)}>
                  <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
                  {t('reservations.backToCurrentStep')}
                </Button>
              ) : null
            }
          />
        )}
      </ReservationWizardShell>

      {rewindTargets.length ? (
        <ReturnForCorrectionCard
          key={`${reservation.id}-${reservation.status}`}
          reservation={reservation}
          returnOptions={rewindTargets}
          onChanged={refresh}
        />
      ) : null}

      {reservation.managementNotes || reservation.caravanManagerNotes ? (
        <section className={`${cardClassName} mt-4 overflow-hidden`}>
          <ReservationSectionHeader icon={StickyNote} title={t('reservations.notesSection')} />
          <div className="space-y-3 p-5 sm:p-6">
            {reservation.managementNotes ? (
              <p className="text-sm leading-7 text-ink-800">
                <span className="font-medium text-ink-600">{t('reservations.managementNotes')}: </span>
                {reservation.managementNotes}
              </p>
            ) : null}
            {reservation.caravanManagerNotes ? (
              <p className="text-sm leading-7 text-ink-800">
                <span className="font-medium text-ink-600">
                  {t('reservations.caravanManagerNotes')}:{' '}
                </span>
                {reservation.caravanManagerNotes}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="mt-4">
        <ReservationTimeline reservation={reservation} />
      </div>
    </div>
  )
}

function ApplicantCard({
  person,
  locale,
  caravanApplicant,
}: {
  person: ReservationPerson
  locale: string
  caravanApplicant?: boolean
}) {
  const { t } = useTranslation()
  return (
    <section className={`${cardClassName} mb-4 overflow-hidden`}>
      <ReservationSectionHeader
        icon={UserRound}
        title={t('reservations.applicantSection')}
        hint={t(
          caravanApplicant
            ? 'reservations.applicantHintCaravan'
            : 'reservations.applicantHint',
        )}
      />
      <dl className="grid gap-2 p-5 sm:grid-cols-3 sm:gap-3 sm:p-6">
        <ApplicantTile icon={UserRound} label={t('users.fullName')} value={personName(person)} />
        <ApplicantTile
          icon={Phone}
          label={t('users.phone')}
          value={person.phone ? localizeDigits(person.phone, locale) : '—'}
          ltr={Boolean(person.phone)}
        />
        <ApplicantTile
          icon={IdCard}
          label={t('users.nationalId')}
          value={person.nationalId ? localizeDigits(person.nationalId, locale) : '—'}
          ltr={Boolean(person.nationalId)}
        />
      </dl>
    </section>
  )
}

function ApplicantTile({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: typeof UserRound
  label: string
  value: string
  ltr?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-ink-500">{label}</dt>
        <dd
          className="mt-0.5 break-words text-sm font-semibold text-ink-900"
          dir={ltr ? 'ltr' : undefined}
        >
          {value}
        </dd>
      </div>
    </div>
  )
}

function AdminEditableStep({
  reservation,
  step,
  onChanged,
  onGoToStep,
  footer,
}: {
  reservation: Reservation
  step: ReservationStepCode
  onChanged: () => void
  onGoToStep?: (step: ReservationStepCode) => void
  footer?: ReactNode
}) {
  const { t } = useTranslation()
  const back = footer ? <div className="mt-3">{footer}</div> : null

  if (step === 'travel') {
    return (
      <div>
        <ReservationTravelStep reservation={reservation} onChanged={onChanged} mode="admin" />
        {back}
      </div>
    )
  }
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <ReservationTravelSummary
          reservation={reservation}
          variant="review"
          hint={t('reservations.reviewDecisionHint')}
          footer={
            <>
              <ReviewDecisionForm reservation={reservation} onChanged={onChanged} />
              {footer}
            </>
          }
        />
        <ReservationPermitPanel reservation={reservation} mode="admin" onChanged={onChanged} />
      </div>
    )
  }
  if (step === 'companions') {
    return (
      <div>
        <CompanionsStep
          reservation={reservation}
          onChanged={onChanged}
          onGoToStep={onGoToStep}
          mode="admin"
        />
        {back}
      </div>
    )
  }
  if (step === 'contacts') {
    return (
      <div>
        <ReservationContactsStep
          reservation={reservation}
          onChanged={onChanged}
          onGoToStep={onGoToStep}
          mode="admin"
        />
        {back}
      </div>
    )
  }
  if (step === 'insurance') {
    return (
      <div>
        <InsuranceStep
          reservation={reservation}
          onChanged={onChanged}
          onGoToStep={onGoToStep}
          mode="admin"
        />
        {back}
      </div>
    )
  }
  return <ReservationCompleteSummary reservation={reservation} audience="admin" footer={footer} />
}

function ReviewDecisionForm({
  reservation,
  onChanged,
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [decisionNote, setDecisionNote] = useState('')
  const pendingReview = reservation.status === 'PENDING_MANAGEMENT_REVIEW'

  if (!pendingReview) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-800">
        <ClipboardCheck className="size-4 text-teal-700" aria-hidden />
        {t('reservations.reviewDecision')}
      </div>
      <FormField icon={StickyNote} label={t('reservations.reviewNotes')} htmlFor="decision-note">
        <textarea
          id="decision-note"
          className={fieldClassName}
          rows={2}
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
          placeholder={t('reservations.reviewNotesPlaceholder')}
        />
      </FormField>
      <p className="text-xs text-ink-500">{t('reservations.reviewNotesHint')}</p>
      <ReservationReviewActions
        reservation={reservation}
        onChanged={onChanged}
        stacked
        initialNote={decisionNote.trim()}
      />
    </div>
  )
}

function ReturnForCorrectionCard({
  reservation,
  returnOptions,
  onChanged,
}: {
  reservation: Reservation
  returnOptions: ReservationStatus[]
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const defaultTarget =
    reservation.status === 'COMPLETED' && returnOptions.includes('COMPANIONS')
      ? 'COMPANIONS'
      : ''
  const [returnStatus, setReturnStatus] = useState(defaultTarget)
  const hasAcceptedInsurance = reservation.members?.some((item) =>
    isInsuranceAccepted(item.insuranceStatus),
  )
  const hintKey =
    reservation.status === 'REJECTED'
      ? 'reservations.returnHint'
      : reservation.status === 'COMPLETED'
        ? 'reservations.returnHintCompleted'
        : 'reservations.returnHintInProgress'

  const returnTo = useMutation({
    mutationFn: async (status: ReservationStatus) => {
      const { data } = await api.post<Reservation>(`/reservations/${reservation.id}/return`, {
        status,
      })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.returned'))
      setReturnStatus('')
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  function submitReturn(event: FormEvent) {
    event.preventDefault()
    if (!returnStatus) return
    confirmToast({
      title: t('reservations.returnConfirm'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => returnTo.mutate(returnStatus as ReservationStatus),
    })
  }

  return (
    <section className={`${cardClassName} mt-4`}>
      <ReservationSectionHeader
        icon={RotateCcw}
        title={t('reservations.returnForCorrection')}
        hint={t(hintKey)}
      />
      <div className="p-5 sm:p-6">
        {hasAcceptedInsurance ? (
          <p className="mb-3 text-sm leading-6 text-ink-600">{t('reservations.returnInsuranceHint')}</p>
        ) : null}
        <AppForm onSubmit={submitReturn} className="space-y-3" autoFocusFirst={false}>
          <FormField icon={RotateCcw} label={t('reservations.returnTarget')}>
            <SearchSelect
              value={returnStatus}
              onChange={setReturnStatus}
              options={returnOptions.map((status) => ({
                value: status,
                label: t(`reservations.statuses.${status}`),
              }))}
              placeholder={t('reservations.returnTarget')}
            />
          </FormField>
          <Button type="submit" disabled={!returnStatus || returnTo.isPending}>
            <RotateCcw className="size-4" aria-hidden />
            {t('reservations.returnForCorrection')}
          </Button>
        </AppForm>
      </div>
    </section>
  )
}
