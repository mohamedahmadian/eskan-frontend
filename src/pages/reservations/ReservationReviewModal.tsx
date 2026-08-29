import { useMutation } from '@tanstack/react-query'
import { Check, Mars, SlidersHorizontal, StickyNote, UserRound, Users, Venus, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  AppForm,
  Button,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { Reservation, ReservationListItem, ReservationType } from '../../types/app'
import {
  applicantSectionKey,
  canAdjustApprovedCapacity,
  isInsuranceAccepted,
  partyMaxSize,
} from './reservation-steps'

export type ReservationReviewMode = 'approve' | 'reject' | 'adjustCapacity'

function isGroupOrCaravan(type: ReservationType) {
  return type === 'GROUP' || type === 'CARAVAN'
}

function reservationMembers(reservation: ReservationListItem) {
  return 'members' in reservation ? (reservation as Reservation).members : undefined
}

export function ReservationReviewActions({
  reservation,
  onChanged,
  compact,
  stacked,
  initialNote,
  requireRejectReason,
  rejectOnly,
}: {
  reservation: ReservationListItem
  onChanged: () => void
  compact?: boolean
  stacked?: boolean
  initialNote?: string
  requireRejectReason?: boolean
  rejectOnly?: boolean
}) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ReservationReviewMode | null>(null)
  const groupReview = isGroupOrCaravan(reservation.type)
  const showAdjustCapacity = Boolean(
    rejectOnly && canAdjustApprovedCapacity(reservation.type, reservation.status),
  )

  const approve = useMutation({
    mutationFn: async (payload?: { notes?: string; maleCount?: number; femaleCount?: number }) => {
      const { data } = await api.post<Reservation>(`/reservations/${reservation.id}/approve`, {
        ...(payload?.notes ? { notes: payload.notes } : {}),
        ...(payload?.maleCount !== undefined ? { maleCount: payload.maleCount } : {}),
        ...(payload?.femaleCount !== undefined ? { femaleCount: payload.femaleCount } : {}),
      })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.reviewContinued'))
      setMode(null)
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const reject = useMutation({
    mutationFn: async (reason?: string) => {
      const { data } = await api.post<Reservation>(`/reservations/${reservation.id}/reject`, {
        ...(reason ? { reason } : {}),
      })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.rejected'))
      setMode(null)
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const adjustCapacity = useMutation({
    mutationFn: async (payload: { maleCount: number; femaleCount: number }) => {
      const { data } = await api.patch<Reservation>(`/reservations/${reservation.id}/capacity`, {
        maleCount: payload.maleCount,
        femaleCount: payload.femaleCount,
      })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.adjustCapacitySaved'))
      setMode(null)
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const busy = approve.isPending || reject.isPending || adjustCapacity.isPending

  function askApprove() {
    if (groupReview) {
      setMode('approve')
      return
    }
    confirmToast({
      title: t('reservations.reviewContinueConfirm'),
      confirmLabel: t('reservations.approveFile'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => approve.mutate(initialNote && initialNote.length >= 2 ? { notes: initialNote } : undefined),
    })
  }

  function askReject() {
    if (!rejectOnly && groupReview) {
      setMode('reject')
      return
    }
    const mustExplain = Boolean(requireRejectReason || rejectOnly)
    const insurancePaid = reservationMembers(reservation)?.some((item) =>
      isInsuranceAccepted(item.insuranceStatus),
    )
    confirmToast({
      title: t('reservations.rejectConfirm'),
      confirmLabel: t('reservations.rejectFile'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      prompt: mustExplain
        ? {
            label: t('reservations.rejectReason'),
            placeholder: t('reservations.reviewNotesPlaceholder'),
            hint: insurancePaid ? t('reservations.rejectInsuranceWarning') : undefined,
            required: true,
            minLength: 2,
            requiredMessage: t('reservations.rejectReasonRequired'),
          }
        : undefined,
      onConfirm: (reason) => {
        if (mustExplain && (!reason || reason.length < 2)) {
          toast.error(t('reservations.rejectReasonRequired'))
          return
        }
        reject.mutate(reason || (initialNote && initialNote.length >= 2 ? initialNote : undefined))
      },
    })
  }

  const buttonClass = compact
    ? 'h-8 gap-1 !rounded-xl !px-2.5 !py-1 text-xs shadow-none'
    : stacked
      ? 'w-full'
      : undefined

  return (
    <>
      <div
        className={
          stacked
            ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
            : 'flex shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap'
        }
      >
        {rejectOnly ? null : (
          <Button type="button" className={buttonClass} disabled={busy} onClick={askApprove}>
            <Check className={compact ? 'size-3.5' : 'size-4'} aria-hidden />
            {t('reservations.approveFile')}
          </Button>
        )}
        <Button
          type="button"
          variant="danger"
          className={buttonClass}
          disabled={busy}
          onClick={askReject}
        >
          <X className={compact ? 'size-3.5' : 'size-4'} aria-hidden />
          {t('reservations.rejectFile')}
        </Button>
        {showAdjustCapacity ? (
          <Button
            type="button"
            variant="soft"
            className={buttonClass}
            disabled={busy}
            onClick={() => setMode('adjustCapacity')}
          >
            <SlidersHorizontal className={compact ? 'size-3.5' : 'size-4'} aria-hidden />
            {t('reservations.adjustCapacity')}
          </Button>
        ) : null}
      </div>
      {mode ? (
        <ReservationReviewModal
          reservation={reservation}
          mode={mode}
          busy={busy}
          initialNote={initialNote}
          onClose={() => {
            if (!busy) setMode(null)
          }}
          onConfirm={(payload) => {
            if (mode === 'reject') {
              if (!payload.note || payload.note.length < 2) {
                toast.error(t('reservations.rejectReasonRequired'))
                return
              }
              reject.mutate(payload.note)
              return
            }
            if (mode === 'adjustCapacity') {
              adjustCapacity.mutate({
                maleCount: payload.maleCount,
                femaleCount: payload.femaleCount,
              })
              return
            }
            approve.mutate({
              notes: payload.note,
              maleCount: payload.maleCount,
              femaleCount: payload.femaleCount,
            })
          }}
        />
      ) : null}
    </>
  )
}

export function ReservationReviewModal({
  reservation,
  mode,
  busy,
  initialNote,
  onClose,
  onConfirm,
}: {
  reservation: ReservationListItem
  mode: ReservationReviewMode
  busy?: boolean
  initialNote?: string
  onClose: () => void
  onConfirm: (payload: {
    note?: string
    maleCount: number
    femaleCount: number
  }) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const requestedMale = reservation.requestedMaleCount ?? reservation.maleCount
  const requestedFemale = reservation.requestedFemaleCount ?? reservation.femaleCount
  const adjusting = mode === 'adjustCapacity'
  const initialMale = adjusting ? reservation.maleCount : requestedMale
  const initialFemale = adjusting ? reservation.femaleCount : requestedFemale
  const [maleCount, setMaleCount] = useState(String(initialMale))
  const [femaleCount, setFemaleCount] = useState(String(initialFemale))
  const [note, setNote] = useState(initialNote ?? '')
  const rejecting = mode === 'reject'
  const partyName = reservation.caravan?.name?.trim() || reservation.group?.name?.trim() || '—'
  const applicantName =
    reservation.type === 'CARAVAN'
      ? reservation.caravanManager?.fullName || reservation.createdBy?.fullName || '—'
      : reservation.createdBy?.fullName || '—'
  const approvedMale = Number(maleCount) || 0
  const approvedFemale = Number(femaleCount) || 0
  const maxCount = partyMaxSize(reservation.type)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = note.trim()
    if (rejecting && trimmed.length < 2) return
    if (approvedMale < 0 || approvedFemale < 0 || approvedMale + approvedFemale <= 0) return
    if (maxCount && approvedMale + approvedFemale > maxCount) return
    onConfirm({
      note: adjusting ? undefined : trimmed.length >= 2 ? trimmed : undefined,
      maleCount: approvedMale,
      femaleCount: approvedFemale,
    })
  }

  const title = rejecting
    ? t('reservations.rejectConfirm')
    : adjusting
      ? t('reservations.adjustCapacityTitle')
      : t('reservations.reviewContinueConfirm')
  const confirmLabel = rejecting
    ? t('reservations.rejectFile')
    : adjusting
      ? t('reservations.adjustCapacity')
      : t('reservations.approveFile')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        disabled={busy}
        onClick={() => {
          if (!busy) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-review-title"
        className={`relative z-10 w-full max-w-lg p-6 ${cardClassName}`}
      >
        <h2 id="reservation-review-title" className="mb-4 text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <AppForm onSubmit={submit} className="space-y-4" autoFocusFirst={false}>
          <dl className="grid gap-2 sm:grid-cols-2">
            <ReviewFact
              icon={UserRound}
              label={t(applicantSectionKey(reservation.type))}
              value={applicantName}
            />
            <ReviewFact icon={Users} label={t('reservations.partyName')} value={partyName} />
          </dl>

          <section className="space-y-2">
            <p className="text-xs font-semibold text-ink-600">{t('reservations.requestedCounts')}</p>
            <div className="grid grid-cols-2 gap-2">
              <CountChip
                icon={Mars}
                label={t('reservations.male')}
                value={n(requestedMale)}
                tone="teal"
              />
              <CountChip
                icon={Venus}
                label={t('reservations.female')}
                value={n(requestedFemale)}
                tone="mint"
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold text-ink-600">{t('reservations.approvedCounts')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                icon={Mars}
                label={t('reservations.approvedMaleCount')}
                htmlFor="review-male-count"
              >
                <input
                  id="review-male-count"
                  type="number"
                  min={0}
                  max={maxCount}
                  className={fieldClassName}
                  value={maleCount}
                  onChange={(event) => setMaleCount(event.target.value)}
                  required
                  disabled={busy || rejecting}
                />
              </FormField>
              <FormField
                icon={Venus}
                label={t('reservations.approvedFemaleCount')}
                htmlFor="review-female-count"
              >
                <input
                  id="review-female-count"
                  type="number"
                  min={0}
                  max={maxCount}
                  className={fieldClassName}
                  value={femaleCount}
                  onChange={(event) => setFemaleCount(event.target.value)}
                  required
                  disabled={busy || rejecting}
                />
              </FormField>
            </div>
          </section>

          {adjusting ? (
            <p className="text-xs text-ink-500">{t('reservations.adjustCapacityHint')}</p>
          ) : (
            <>
              <FormField
                icon={StickyNote}
                label={rejecting ? t('reservations.rejectReason') : t('reservations.reviewNotes')}
                htmlFor="review-note"
              >
                <textarea
                  id="review-note"
                  className={fieldClassName}
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t('reservations.reviewNotesPlaceholder')}
                  required={rejecting}
                  minLength={rejecting ? 2 : undefined}
                  disabled={busy}
                />
              </FormField>
              {rejecting ? (
                <p className="text-xs text-ink-500">{t('reservations.rejectReasonRequired')}</p>
              ) : (
                <p className="text-xs text-ink-500">{t('reservations.reviewNotesHint')}</p>
              )}
            </>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              <X className="size-4" aria-hidden />
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant={rejecting ? 'danger' : 'primary'} disabled={busy}>
              {rejecting ? <X className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
              {confirmLabel}
            </Button>
          </div>
        </AppForm>
      </div>
    </div>,
    document.body,
  )
}

function ReviewFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-ink-500">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-semibold text-ink-900">{value}</dd>
      </div>
    </div>
  )
}

function CountChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Mars
  label: string
  value: string
  tone: 'teal' | 'mint'
}) {
  const wrap =
    tone === 'teal'
      ? 'border-teal-100 bg-gradient-to-b from-teal-50 to-white'
      : 'border-mint-100 bg-gradient-to-b from-mint-50 to-white'
  const iconWrap = tone === 'teal' ? 'bg-teal-500 text-white' : 'bg-mint-500 text-white'
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 ${wrap}`}>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div>
        <p className="text-[11px] text-ink-500">{label}</p>
        <p className="text-sm font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  )
}
