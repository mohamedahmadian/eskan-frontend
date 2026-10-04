import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, Eye, FileBadge, FileImage, ShieldAlert, StickyNote, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, Button, FormField, LoadingState, fieldClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatDate } from '../../lib/datetime'
import type { Reservation, ReservationPermitOption } from '../../types/app'
import { IssuedLicenseStatusBadge } from '../licenses/license-ui'

export function ReservationReviewPermitStep({
  reservationId,
  onChanged,
  onNext,
  onCancel,
  onViewLicense,
}: {
  reservationId: string
  onChanged: () => void
  onNext: () => void
  onCancel: () => void
  onViewLicense: (license: ReservationPermitOption) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const query = useQuery({
    queryKey: ['reservations', reservationId],
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${reservationId}`)
      return data
    },
  })

  function afterDecision(data: Reservation) {
    queryClient.setQueryData(['reservations', reservationId], data)
    void queryClient.invalidateQueries({ queryKey: ['reservations', reservationId] })
    setRejecting(false)
    setReason('')
    onChanged()
  }

  const approve = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Reservation>(`/reservations/${reservationId}/permit/approve`)
      return data
    },
    onSuccess: (data) => {
      toast.success(t('reservations.permitApproved'))
      afterDecision(data)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const reject = useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<Reservation>(`/reservations/${reservationId}/permit/reject`, {
        reason: text,
      })
      return data
    },
    onSuccess: (data) => {
      toast.success(t('reservations.permitRejected'))
      afterDecision(data)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  if (query.isLoading) return <LoadingState />

  const reservation = query.data
  if (!reservation) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-700" role="alert">
          {t('common.error')}
        </p>
        <StepFooter onCancel={onCancel} onNext={onNext} />
      </div>
    )
  }

  const busy = approve.isPending || reject.isPending
  const status = reservation.permitStatus
  const fileOpen =
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED' &&
    reservation.status !== 'COMPLETED'
  const reRejectable = fileOpen && status === 'APPROVED'
  const reviewable =
    reRejectable ||
    (fileOpen &&
      (status === 'PENDING' || status === 'REJECTED') &&
      Boolean(reservation.issuedLicenseId || reservation.permitImageId))
  const awaitingDecision = reviewable && status === 'PENDING'
  const license = reservation.permitSource === 'ISSUED_LICENSE' ? reservation.issuedLicense : null
  const imageId = reservation.permitSource === 'UPLOAD' ? reservation.permitImageId : null

  function submitReject(event: FormEvent) {
    event.preventDefault()
    const trimmed = reason.trim()
    if (trimmed.length < 2) {
      toast.error(t('reservations.permitRejectReasonRequired'))
      return
    }
    reject.mutate(trimmed)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-6 text-ink-500">{t('reservations.reviewPermitHint')}</p>

      <section className="space-y-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
            <FileBadge className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900">{t('reservations.permitTitle')}</p>
            <p className="text-xs text-ink-500">{t(`reservations.permitStatuses.${status}`)}</p>
          </div>
          <PermitStatusPill status={status} />
        </div>

        {reservation.permitSource === 'CONFIRMED' ? (
          <p className="rounded-2xl border border-teal-100 bg-white px-3 py-3 text-sm leading-7 text-ink-800">
            {t('reservations.permitConfirmedSaved')}
          </p>
        ) : null}

        {license ? (
          <div className="rounded-2xl border border-teal-100 bg-white px-3 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink-800">
                {license.organization?.name || t('reservations.permitUnknownOrg')}
              </p>
              <IssuedLicenseStatusBadge status={license.status} />
            </div>
            <p className="mt-1 text-xs text-ink-500">
              {t('licenses.issuedAt')}: {formatDate(license.issuedAt, locale)}
            </p>
            {license.description ? (
              <p className="mt-1 text-xs leading-5 text-ink-700">{license.description}</p>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="mt-3"
              onClick={() => onViewLicense(license)}
            >
              <Eye className="size-4" aria-hidden />
              {t('reservations.permitViewLicense')}
            </Button>
          </div>
        ) : null}

        {imageId ? (
          <div className="rounded-2xl border border-teal-100 bg-white px-3 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-700">
              <FileImage className="size-3.5 text-teal-600" aria-hidden />
              {t('reservations.permitImage')}
            </p>
            <a href={getImageUrl(imageId)} target="_blank" rel="noreferrer">
              <img
                src={getImageUrl(imageId)}
                alt={t('reservations.permitImage')}
                className="max-h-56 w-full rounded-xl bg-cream-50 object-contain"
              />
            </a>
          </div>
        ) : null}

        {status === 'REJECTED' ? (
          <div
            className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5"
            role="alert"
          >
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1 text-xs leading-6 text-red-800">
              <p>
                <Trans
                  i18nKey={
                    reservation.permitReviewedBy
                      ? 'reservations.permitRejectedByHint'
                      : 'reservations.permitRejectedAtHint'
                  }
                  values={{
                    date: reservation.permitReviewedAt
                      ? formatDate(reservation.permitReviewedAt, locale)
                      : '—',
                    name: reservation.permitReviewedBy?.fullName ?? '',
                  }}
                  components={{ b: <span className="font-semibold" /> }}
                />
              </p>
              {reservation.permitRejectionReason ? (
                <p className="whitespace-pre-line text-ink-800">
                  <span className="font-semibold text-red-700">{t('reservations.rejectionReason')}:</span>{' '}
                  {reservation.permitRejectionReason}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {status === 'NONE' ? (
          <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-6 text-amber-800">
            {t('reservations.reviewPermitNone')}
          </p>
        ) : null}

        {reviewable && !rejecting ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {reRejectable ? null : (
              <Button type="button" className="w-full" disabled={busy} onClick={() => approve.mutate()}>
                <Check className="size-4" aria-hidden />
                {t('reservations.approvePermit')}
              </Button>
            )}
            {status === 'PENDING' || reRejectable ? (
              <Button
                type="button"
                variant="danger"
                className="w-full"
                disabled={busy}
                onClick={() => setRejecting(true)}
              >
                <X className="size-4" aria-hidden />
                {t(reRejectable ? 'reservations.reRejectPermit' : 'reservations.rejectPermit')}
              </Button>
            ) : null}
          </div>
        ) : null}

        {reviewable && rejecting ? (
          <AppForm onSubmit={submitReject} className="space-y-3" autoFocusFirst>
            <FormField
              icon={StickyNote}
              label={t('reservations.permitRejectReason')}
              htmlFor="review-permit-reject-reason"
            >
              <textarea
                id="review-permit-reject-reason"
                className={fieldClassName}
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('reservations.permitRejectReasonPlaceholder')}
                required
                minLength={2}
                disabled={busy}
              />
            </FormField>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setRejecting(false)
                  setReason('')
                }}
              >
                <X className="size-4" aria-hidden />
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="danger" disabled={busy}>
                <X className="size-4" aria-hidden />
                {t(reRejectable ? 'reservations.reRejectPermit' : 'reservations.rejectPermit')}
              </Button>
            </div>
          </AppForm>
        ) : null}
      </section>

      {awaitingDecision ? (
        <p className="text-xs font-medium text-amber-700">{t('reservations.reviewPermitDecideFirst')}</p>
      ) : null}

      <StepFooter
        onCancel={onCancel}
        onNext={onNext}
        nextDisabled={busy || awaitingDecision || rejecting}
      />
    </div>
  )
}

function StepFooter({
  onCancel,
  onNext,
  nextDisabled,
}: {
  onCancel: () => void
  onNext: () => void
  nextDisabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        <X className="size-4" aria-hidden />
        {t('common.cancel')}
      </Button>
      <Button type="button" disabled={nextDisabled} onClick={onNext}>
        {t('reservations.reviewGoToFile')}
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
      </Button>
    </div>
  )
}

export function PermitStatusPill({ status }: { status: Reservation['permitStatus'] }) {
  const { t } = useTranslation()
  const tone =
    status === 'APPROVED'
      ? 'bg-mint-100 text-emerald-800'
      : status === 'REJECTED'
        ? 'bg-red-50 text-red-700'
        : status === 'PENDING'
          ? 'bg-amber-50 text-amber-800'
          : 'bg-cream-100 text-ink-700'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {t(`reservations.permitStatuses.${status}`)}
    </span>
  )
}
