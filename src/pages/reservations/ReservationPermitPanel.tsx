import { BadgeCheck, Check, FileBadge, FileImage, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, cardClassName } from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatDate } from '../../lib/datetime'
import type { Reservation } from '../../types/app'
import {
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
        draft.source === 'ISSUED_LICENSE'
          ? { issuedLicenseId: draft.issuedLicenseId || null, permitImageId: null }
          : { issuedLicenseId: null, permitImageId: draft.permitImageId || null }
      const { data } = await api.patch<Reservation>(`/reservations/${reservation.id}/permit`, body)
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.permitResubmitted'))
      setEditing(false)
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  if (reservation.type !== 'CARAVAN') return null

  const busy = approve.isPending || reject.isPending || savePermit.isPending
  const canReview =
    admin &&
    (status === 'PENDING' || status === 'REJECTED') &&
    Boolean(reservation.issuedLicenseId || reservation.permitImageId) &&
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED' &&
    reservation.status !== 'COMPLETED'
  const canResubmit =
    !admin &&
    status !== 'APPROVED' &&
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED' &&
    reservation.status !== 'COMPLETED'

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
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
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
              {t('reservations.permitResubmit')}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              <X className="size-4" aria-hidden />
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {reservation.permitSource === 'ISSUED_LICENSE' && reservation.issuedLicense ? (
            <div className="rounded-2xl border border-teal-100 bg-cream-50/80 px-3 py-3 text-sm">
              <p className="font-medium text-ink-800">
                {reservation.issuedLicense.organization?.name || t('reservations.permitUnknownOrg')}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {t('licenses.issuedAt')}: {formatDate(reservation.issuedLicense.issuedAt, locale)}
              </p>
              {reservation.issuedLicense.description ? (
                <p className="mt-1 text-xs leading-5 text-ink-600">
                  {reservation.issuedLicense.description}
                </p>
              ) : null}
              {reservation.issuedLicense.fileId ? (
                <a
                  href={getImageUrl(reservation.issuedLicense.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-700 underline-offset-2 hover:underline"
                >
                  <BadgeCheck className="size-3.5" aria-hidden />
                  {t('reservations.permitViewIssuedFile')}
                </a>
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

          {status === 'REJECTED' && reservation.permitRejectionReason ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
              {reservation.permitRejectionReason}
            </p>
          ) : null}

          {!reservation.hasPermit && status === 'PENDING' ? (
            <p className="text-xs leading-5 text-ink-500">{t('reservations.permitPendingHint')}</p>
          ) : null}

          {status === 'NONE' ? (
            <p className="text-xs leading-5 text-ink-500">{t('reservations.permitRequired')}</p>
          ) : null}

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
              {t(status === 'NONE' ? 'reservations.permitResubmit' : 'reservations.permitChange')}
            </Button>
          ) : null}

          {canReview ? (
            <div className="flex flex-wrap gap-2 pt-1">
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
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => {
                  confirmToast({
                    title: t('reservations.confirmRejectPermit'),
                    confirmLabel: t('reservations.rejectPermit'),
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                    onConfirm: () => reject.mutate(undefined),
                  })
                }}
              >
                <X className="size-4" aria-hidden />
                {t('reservations.rejectPermit')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
