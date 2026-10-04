import { Check, Eye, FileBadge, FileImage, ShieldAlert, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, cardClassName } from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatDate } from '../../lib/datetime'
import type { Reservation } from '../../types/app'
import { IssuedLicenseStatusBadge } from '../licenses/license-ui'
import {
  IssuedLicenseViewModal,
  ReservationCaravanLicenseStep,
  type CaravanPermitDraft,
} from './ReservationCaravanLicenseStep'

export function ReservationPermitPanel({
  reservation,
  mode,
  onChanged,
}: {
  reservation: Reservation
  mode: 'admin' | 'user'
  onChanged: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const status = reservation.permitStatus
  const admin = mode === 'admin'
  const [editing, setEditing] = useState(false)
  const [viewingLicense, setViewingLicense] = useState(false)
  const [draft, setDraft] = useState<CaravanPermitDraft>({
    source: reservation.permitSource ?? '',
    issuedLicenseId: reservation.issuedLicenseId ?? '',
    permitImageId: reservation.permitImageId ?? '',
  })

  const approve = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Reservation>(`/reservations/${reservation.id}/permit/approve`)
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.permitApproved'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const reject = useMutation({
    mutationFn: async (reason?: string) => {
      const { data } = await api.post<Reservation>(`/reservations/${reservation.id}/permit/reject`, {
        reason,
      })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.permitRejected'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const savePermit = useMutation({
    mutationFn: async () => {
      const body =
        draft.source === 'CONFIRMED'
          ? { permitConfirmed: true, issuedLicenseId: null, permitImageId: null }
          : draft.source === 'ISSUED_LICENSE'
            ? { permitConfirmed: false, issuedLicenseId: draft.issuedLicenseId || null, permitImageId: null }
            : { permitConfirmed: false, issuedLicenseId: null, permitImageId: draft.permitImageId || null }
      const { data } = await api.patch<Reservation>(`/reservations/${reservation.id}/permit`, body)
      return data
    },
    onSuccess: (data) => {
      toast.success(
        t(
          !admin
            ? 'reservations.permitResubmitted'
            : data.permitSource === 'CONFIRMED'
              ? 'reservations.permitApproved'
              : 'reservations.permitSaved',
        ),
      )
      setEditing(false)
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  if (reservation.type !== 'CARAVAN') return null

  const busy = approve.isPending || reject.isPending || savePermit.isPending
  const fileOpen =
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED' &&
    reservation.status !== 'COMPLETED'
  const canReview =
    admin &&
    fileOpen &&
    (status === 'PENDING' || status === 'REJECTED') &&
    Boolean(reservation.issuedLicenseId || reservation.permitImageId)
  const canReRejectApproved = admin && fileOpen && status === 'APPROVED'
  const canResubmit =
    (admin || status !== 'APPROVED') &&
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED' &&
    reservation.status !== 'COMPLETED'
  const viewableLicense =
    reservation.permitSource === 'ISSUED_LICENSE' ? reservation.issuedLicense : null
  const viewableImageId =
    reservation.permitSource === 'UPLOAD' ? reservation.permitImageId : null
  const canView = Boolean(viewableLicense || viewableImageId)

  function viewPermit() {
    if (viewableLicense) {
      setViewingLicense(true)
      return
    }
    if (viewableImageId) window.open(getImageUrl(viewableImageId), '_blank', 'noopener,noreferrer')
  }

  return (
    <section className={`${cardClassName} space-y-3 p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <FileBadge className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900">{t('reservations.permitTitle')}</p>
          <p className="text-xs text-ink-500">{t(`reservations.permitStatuses.${status}`)}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            reservation.hasPermit
              ? 'bg-mint-100 text-emerald-800'
              : status === 'REJECTED'
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-800'
          }`}
        >
          {reservation.hasPermit ? t('reservations.hasPermitYes') : t('reservations.hasPermitNo')}
        </span>
      </div>

      {editing && reservation.caravanId ? (
        <div className="space-y-3">
          <ReservationCaravanLicenseStep
            caravanId={reservation.caravanId}
            year={reservation.year}
            value={draft}
            allowConfirmed={admin}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                if (draft.source === 'CONFIRMED') {
                  savePermit.mutate()
                  return
                }
                if (draft.source === 'ISSUED_LICENSE' && !draft.issuedLicenseId) {
                  toast.error(t('reservations.permitIssuedRequired'))
                  return
                }
                if (draft.source === 'UPLOAD' && !draft.permitImageId) {
                  toast.error(t('reservations.permitImageRequired'))
                  return
                }
                if (!draft.source) {
                  toast.error(t('reservations.permitRequired'))
                  return
                }
                savePermit.mutate()
              }}
            >
              <Check className="size-4" aria-hidden />
              {t(admin ? 'reservations.permitSave' : 'reservations.permitResubmit')}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              <X className="size-4" aria-hidden />
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {reservation.permitSource === 'CONFIRMED' ? (
            <p className="rounded-2xl border border-teal-100 bg-teal-50/80 px-3 py-3 text-sm leading-7 text-ink-800">
              {t('reservations.permitConfirmedSaved')}
            </p>
          ) : null}

          {reservation.permitSource === 'ISSUED_LICENSE' && reservation.issuedLicense ? (
            <div className="rounded-2xl border border-teal-100 bg-cream-50/80 px-3 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink-800">
                  {reservation.issuedLicense.organization?.name || t('reservations.permitUnknownOrg')}
                </p>
                <IssuedLicenseStatusBadge status={reservation.issuedLicense.status} />
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {t('licenses.issuedAt')}: {formatDate(reservation.issuedLicense.issuedAt, locale)}
              </p>
              {reservation.issuedLicense.description ? (
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  {reservation.issuedLicense.description}
                </p>
              ) : null}
            </div>
          ) : null}

          {reservation.permitSource === 'UPLOAD' && reservation.permitImageId ? (
            <div className="rounded-2xl border border-teal-100 bg-cream-50/80 px-3 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <FileImage className="size-3.5 text-teal-600" aria-hidden />
                {t('reservations.permitImage')}
              </p>
              <a href={getImageUrl(reservation.permitImageId)} target="_blank" rel="noreferrer">
                <img
                  src={getImageUrl(reservation.permitImageId)}
                  alt=""
                  className="max-h-48 w-full rounded-xl object-contain bg-white"
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
                    <span className="font-semibold text-red-700">
                      {t('reservations.rejectionReason')}:
                    </span>{' '}
                    {reservation.permitRejectionReason}
                  </p>
                ) : null}
                {!admin ? (
                  <p className="font-medium">{t('reservations.permitRejectedUploadNew')}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {!reservation.hasPermit && status === 'PENDING' ? (
            <p className="text-xs leading-5 text-ink-500">{t('reservations.permitPendingHint')}</p>
          ) : null}

          {status === 'NONE' ? (
            <p className="text-xs leading-5 text-ink-500">{t('reservations.permitRequired')}</p>
          ) : null}

          {canResubmit || canView ? (
            <div className="flex flex-wrap items-center gap-2">
              {canResubmit ? (
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => {
                    setDraft({
                      source: reservation.permitSource ?? '',
                      issuedLicenseId: reservation.issuedLicenseId ?? '',
                      permitImageId: reservation.permitImageId ?? '',
                    })
                    setEditing(true)
                  }}
                >
                  <FileBadge className="size-4" aria-hidden />
                  {t(
                    admin
                      ? status === 'NONE'
                        ? 'reservations.permitAdd'
                        : 'reservations.permitChange'
                      : status === 'NONE'
                        ? 'reservations.permitResubmit'
                        : 'reservations.permitChange',
                  )}
                </Button>
              ) : null}
              {canView ? (
                <Button type="button" variant="ghost" onClick={viewPermit}>
                  <Eye className="size-4" aria-hidden />
                  {t('reservations.permitViewLicense')}
                </Button>
              ) : null}
            </div>
          ) : null}

          {canReview || canReRejectApproved ? (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {canReview ? (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    confirmToast({
                      title: t('reservations.confirmApprovePermit'),
                      confirmLabel: t('reservations.approvePermit'),
                      cancelLabel: t('common.cancel'),
                      onConfirm: () => approve.mutate(),
                    })
                  }}
                >
                  <Check className="size-4" aria-hidden />
                  {t('reservations.approvePermit')}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => {
                  confirmToast({
                    title: t(
                      canReRejectApproved
                        ? 'reservations.confirmReRejectPermit'
                        : 'reservations.confirmRejectPermit',
                    ),
                    confirmLabel: t(
                      canReRejectApproved ? 'reservations.reRejectPermit' : 'reservations.rejectPermit',
                    ),
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                    onConfirm: () => reject.mutate(undefined),
                  })
                }}
              >
                <X className="size-4" aria-hidden />
                {t(canReRejectApproved ? 'reservations.reRejectPermit' : 'reservations.rejectPermit')}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {viewingLicense && viewableLicense ? (
        <IssuedLicenseViewModal item={viewableLicense} onClose={() => setViewingLicense(false)} />
      ) : null}
    </section>
  )
}
