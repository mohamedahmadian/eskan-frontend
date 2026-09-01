import {
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  HandHeart,
  IdCard,
  Phone,
  RotateCcw,
  Smartphone,
  StickyNote,
  Tent,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
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
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { OpenUserPanelButton } from '../../components/auth/OpenUserPanelButton'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { canAssignReservationHonorary, showReservationHonoraryAssignments } from '../../lib/honorary-services'
import { isAdmin } from '../../lib/roles'
import type { Reservation, ReservationPerson, ReservationStatus } from '../../types/app'
import {
  currentStepFromStatus,
  isInsuranceAccepted,
  ownerFlowSteps,
  validRewindStatuses,
  applicantHintKey,
  applicantSectionKey,
  type ReservationStepCode,
} from './reservation-steps'
import { ReservationReviewActions } from './ReservationReviewModal'
import { ReservationStatusBadge } from './ReservationStatusBadge'
import { ReservationSectionHeader, ReservationTitleMeta } from './ReservationSectionHeader'
import { ReservationWizardShell } from './ReservationWizardShell'
import { ReservationTravelSummary } from './ReservationTravelSummary'
import { ReservationTravelStep } from './ReservationTravelStep'
import { ReservationContactsStep } from './ReservationContactsStep'
import { CompanionsStep } from './ReservationCompanionsStep'
import { ReservationStepReadonly } from './ReservationStepReadonly'
import { ReservationCompleteSummary } from './ReservationCompleteSummary'
import { ReservationPlacementPanel } from './ReservationPlacementPanel'
import { InsuranceStep } from './ReservationInsuranceStep'
import { ReservationPermitPanel } from './ReservationPermitPanel'
import {
  ReservationIssuedServicesModal,
  type IssuedServiceSection,
} from './ReservationIssuedServicesPanel'
import {
  ReservationHonoraryAssignModal,
  ReservationHonoraryBox,
} from './ReservationHonoraryAssign'

function personName(person?: ReservationPerson | null) {
  return person?.fullName || '—'
}

export function ReservationAdminDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const admin = isAdmin(user)
  const translatorView = pathname.startsWith('/translator-reservations')

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
    ? currentStepFromStatus(reservation.status, reservation.type, reservation)
    : 'travel'
  const cancelled = reservation?.status === 'CANCELLED'
  const [viewedStep, setViewedStep] = useState<ReservationStepCode | null>(
    cancelled ? null : currentStep,
  )
  const [toolPanel, setToolPanel] = useState<'return' | null>(null)
  const [issuedModal, setIssuedModal] = useState<IssuedServiceSection | null>(null)
  const [honoraryModal, setHonoraryModal] = useState(false)

  useEffect(() => {
    setViewedStep(cancelled ? null : currentStep)
  }, [cancelled, currentStep])

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['reservations', id] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', 'admin'] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', 'assigned'] })
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
  const rewindTargets = admin ? validRewindStatuses(reservation.type, reservation.status) : []
  const headerBtnClass = 'h-8 gap-1 !rounded-xl !px-2.5 !py-1 text-xs shadow-none'
  const showHonoraryAssign = admin && canAssignReservationHonorary(reservation)
  const fileInfoOnly = !admin || translatorView

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
        backTo={translatorView ? '/translator-reservations' : undefined}
        action={
          admin ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {pendingReview ? (
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
            ) : null}
            <Button
              type="button"
              variant={issuedModal === 'sim' ? 'primary' : 'ghost'}
              className={headerBtnClass}
              aria-pressed={issuedModal === 'sim'}
              onClick={() => {
                setToolPanel(null)
                setHonoraryModal(false)
                setIssuedModal((current) => (current === 'sim' ? null : 'sim'))
              }}
            >
              <Smartphone className="size-3.5" aria-hidden />
              {t('reservations.trackSimCard')}
            </Button>
            <Button
              type="button"
              variant={issuedModal === 'bank' ? 'primary' : 'ghost'}
              className={headerBtnClass}
              aria-pressed={issuedModal === 'bank'}
              onClick={() => {
                setToolPanel(null)
                setHonoraryModal(false)
                setIssuedModal((current) => (current === 'bank' ? null : 'bank'))
              }}
            >
              <CreditCard className="size-3.5" aria-hidden />
              {t('reservations.trackMobile')}
            </Button>
            {showHonoraryAssign ? (
              <Button
                type="button"
                variant={honoraryModal ? 'primary' : 'ghost'}
                className={headerBtnClass}
                aria-pressed={honoraryModal}
                onClick={() => {
                  setToolPanel(null)
                  setIssuedModal(null)
                  setHonoraryModal((current) => !current)
                }}
              >
                <HandHeart className="size-3.5" aria-hidden />
                {t('reservations.assignHonorary')}
              </Button>
            ) : null}
            {rewindTargets.length ? (
              <Button
                type="button"
                variant={toolPanel === 'return' ? 'primary' : 'soft'}
                className={headerBtnClass}
                aria-pressed={toolPanel === 'return'}
                onClick={() => {
                  setIssuedModal(null)
                  setHonoraryModal(false)
                  setToolPanel((current) => (current === 'return' ? null : 'return'))
                }}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {t('reservations.returnForCorrection')}
              </Button>
            ) : null}
          </div>
          ) : undefined
        }
      />

      {toolPanel === 'return' && rewindTargets.length ? (
        <ReturnForCorrectionCard
          key={`${reservation.id}-${reservation.status}`}
          reservation={reservation}
          returnOptions={rewindTargets}
          onChanged={() => {
            setToolPanel(null)
            refresh()
          }}
          onClose={() => setToolPanel(null)}
        />
      ) : null}

      {issuedModal ? (
        <ReservationIssuedServicesModal
          reservation={reservation}
          section={issuedModal}
          onChanged={refresh}
          onClose={() => setIssuedModal(null)}
        />
      ) : null}

      {honoraryModal ? (
        <ReservationHonoraryAssignModal
          reservation={reservation}
          onChanged={() => {
            setHonoraryModal(false)
            refresh()
          }}
          onClose={() => setHonoraryModal(false)}
        />
      ) : null}

      <ApplicantCard
        person={
          reservation.type === 'CARAVAN' && reservation.caravanManager
            ? reservation.caravanManager
            : reservation.createdBy
        }
        type={reservation.type}
      />

      {admin &&
      !fileInfoOnly &&
      reservation.status !== 'COMPLETED' &&
      showReservationHonoraryAssignments(reservation, showHonoraryAssign) ? (
        <div className="mb-4">
          <ReservationHonoraryBox
            reservation={reservation}
            canAssign={showHonoraryAssign}
            onChanged={refresh}
            onAssign={() => {
              setIssuedModal(null)
              setToolPanel(null)
              setHonoraryModal(true)
            }}
          />
        </div>
      ) : null}

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

      {fileInfoOnly ? (
        <ReservationCompleteSummary
          reservation={reservation}
          variant={cancelled ? 'cancelled' : 'complete'}
          audience="admin"
          canAssignHonorary={showHonoraryAssign}
          onAssignHonorary={() => {
            setIssuedModal(null)
            setToolPanel(null)
            setHonoraryModal(true)
          }}
          onHonoraryChanged={refresh}
        />
      ) : (
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
              canAssignHonorary={showHonoraryAssign}
              onAssignHonorary={() => {
                setIssuedModal(null)
                setToolPanel(null)
                setHonoraryModal(true)
              }}
              onHonoraryChanged={refresh}
            />
          )
        ) : (
          <AdminEditableStep
            reservation={reservation}
            step={viewedStep ?? currentStep}
            onGoToStep={setViewedStep}
            onChanged={refresh}
            canAssignHonorary={showHonoraryAssign}
            onAssignHonorary={() => {
              setIssuedModal(null)
              setToolPanel(null)
              setHonoraryModal(true)
            }}
            footer={
              viewedStep &&
              viewedStep !== currentStep &&
              !ownerFlowSteps(reservation.type, reservation).includes(viewedStep) ? (
                <Button type="button" variant="ghost" onClick={() => setViewedStep(currentStep)}>
                  <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
                  {t('reservations.backToCurrentStep')}
                </Button>
              ) : null
            }
          />
        )}
      </ReservationWizardShell>
      )}

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
    </div>
  )
}

function receptionSearchPath(person: ReservationPerson) {
  const q = person.fullName.trim() || person.nationalId?.trim() || ''
  if (q.length < 2) return null
  return `/reception?q=${encodeURIComponent(q)}`
}

function ApplicantCard({
  person,
  type,
}: {
  person: ReservationPerson
  type: Reservation['type']
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const Icon = type === 'CARAVAN' ? Tent : type === 'GROUP' ? Users : UserRound
  const searchTo =
    hasMenuAccess('/reception', user?.modules ?? []) ? receptionSearchPath(person) : null
  return (
    <section className={`${cardClassName} mb-4 overflow-hidden`}>
      <ReservationSectionHeader
        icon={Icon}
        title={t(applicantSectionKey(type))}
        hint={t(applicantHintKey(type))}
        action={<OpenUserPanelButton userId={person.id} status={person.status} />}
      />
      <div className="grid gap-2 p-5 sm:grid-cols-3 sm:gap-3 sm:p-6">
        <ApplicantTile
          icon={UserRound}
          label={t('users.fullName')}
          value={personName(person)}
          to={searchTo}
          toLabel={t('reception.openFromFile')}
        />
        <ApplicantTile
          icon={Phone}
          label={t('users.phone')}
          value={<CopyableDigits value={person.phone} />}
        />
        <ApplicantTile
          icon={IdCard}
          label={t('users.nationalId')}
          value={<CopyableDigits value={person.nationalId} />}
        />
      </div>
    </section>
  )
}

function ApplicantTile({
  icon: Icon,
  label,
  value,
  to,
  toLabel,
}: {
  icon: typeof UserRound
  label: string
  value: ReactNode
  to?: string | null
  toLabel?: string
}) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-500">{label}</p>
        <p
          className={`mt-0.5 break-words text-sm font-semibold ${
            to ? 'text-teal-800 underline-offset-2 group-hover:underline' : 'text-ink-900'
          }`}
        >
          {value}
        </p>
      </div>
    </>
  )
  const className =
    'flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-3'
  if (to) {
    return (
      <Link
        to={to}
        title={toLabel}
        aria-label={toLabel}
        className={`group ${className} transition hover:border-teal-300 hover:shadow-[0_8px_16px_rgba(46,189,182,0.12)]`}
      >
        {body}
      </Link>
    )
  }
  return <div className={className}>{body}</div>
}

function AdminEditableStep({
  reservation,
  step,
  onChanged,
  onGoToStep,
  footer,
  canAssignHonorary,
  onAssignHonorary,
}: {
  reservation: Reservation
  step: ReservationStepCode
  onChanged: () => void
  onGoToStep?: (step: ReservationStepCode) => void
  footer?: ReactNode
  canAssignHonorary?: boolean
  onAssignHonorary?: () => void
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
          audience="admin"
          hint={t('reservations.reviewDecisionHint')}
          footer={
            <>
              <ReviewDecisionForm reservation={reservation} onChanged={onChanged} />
              {footer}
            </>
          }
        />
        {reservation.type === 'CARAVAN' ? (
          <ReservationPermitPanel reservation={reservation} mode="admin" onChanged={onChanged} />
        ) : null}
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
  if (step === 'placement') {
    return <ReservationPlacementPanel reservation={reservation} footer={footer} />
  }
  return (
    <ReservationCompleteSummary
      reservation={reservation}
      audience="admin"
      footer={footer}
      canAssignHonorary={canAssignHonorary}
      onAssignHonorary={onAssignHonorary}
      onHonoraryChanged={onChanged}
    />
  )
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
  onClose,
}: {
  reservation: Reservation
  returnOptions: ReservationStatus[]
  onChanged: () => void
  onClose?: () => void
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
    <section className={`${cardClassName} relative mb-4 overflow-hidden`}>
      {onClose ? (
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={onClose}
          className="absolute end-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-2xl text-ink-500 transition hover:bg-white/80 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
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
