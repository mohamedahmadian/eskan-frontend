import { HandHeart, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  cardClassName,
} from '../../components/ui/Form'
import { FormCardHeader, formCardBodyClassName } from '../../components/ui/FormLayout'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { confirmToast } from '../../components/ui/confirmToast'
import { api, getApiErrorMessage } from '../../lib/api'
import { canAssignReservationHonorary } from '../../lib/honorary-services'
import { formatNumber } from '../../lib/datetime'
import type {
  HonoraryServantPerson,
  HonoraryServiceType,
  Reservation,
  ReservationHonoraryAssignment,
} from '../../types/app'

export function ReservationHonoraryBox({
  reservation,
  canAssign,
  onAssign,
  onChanged,
}: {
  reservation: Reservation
  canAssign?: boolean
  onAssign?: () => void
  onChanged?: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const items = reservation.honoraryAssignments ?? []
  if (!items.length) return null
  const allowAssign = Boolean(canAssign && canAssignReservationHonorary(reservation))

  function confirmRemove(item: ReservationHonoraryAssignment) {
    confirmToast({
      title: t('reservations.confirmRemoveHonorary'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/reservations/${reservation.id}/honorary-assignments/${item.id}`)
          toast.success(t('reservations.honoraryRemoved'))
          onChanged?.()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
          <HandHeart className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ink-500">{t('reservations.honoraryAssignments')}</p>
          <p className="mt-0.5 text-sm font-semibold text-ink-900">
            {t('reservations.honoraryAssignmentsCount', {
              count: formatNumber(items.length, locale),
            })}
          </p>
        </div>
        {allowAssign && onAssign ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 shrink-0 gap-1 !rounded-xl !px-2.5 !py-1 text-xs shadow-none"
            onClick={onAssign}
          >
            <UserRound className="size-3.5" aria-hidden />
            {t('reservations.addHonoraryAssignment')}
          </Button>
        ) : null}
      </div>
      <ul className="divide-y divide-teal-100/80 border-t border-teal-100 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink-500">{item.serviceType.name}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-900">{item.user.fullName}</p>
              {item.user.phone ? (
                <div className="mt-0.5">
                  <CopyableDigits value={item.user.phone} />
                </div>
              ) : null}
            </div>
            {allowAssign ? (
              <Button
                type="button"
                variant="ghost"
                className="size-8 shrink-0 !p-0 text-red-600"
                aria-label={t('common.delete')}
                onClick={() => confirmRemove(item)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function ReservationHonoraryAssignModal({
  reservation,
  onChanged,
  onClose,
}: {
  reservation: Reservation
  onChanged: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [userId, setUserId] = useState('')

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

  const typesQuery = useQuery({
    queryKey: ['honorary-service-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<HonoraryServiceType[] | { items: HonoraryServiceType[] }>(
        '/honorary-service-types',
      )
      return Array.isArray(data) ? data : data.items
    },
  })

  const types = typesQuery.data ?? []

  const candidatesQuery = useQuery({
    queryKey: ['honorary-servants', 'candidates', serviceTypeId],
    enabled: Boolean(serviceTypeId),
    queryFn: async () => {
      const { data } = await api.get<{ items: HonoraryServantPerson[] }>(
        '/honorary-servants/candidates',
        { params: { serviceTypeId } },
      )
      return data
    },
  })

  const assignedIds = new Set(
    (reservation.honoraryAssignments ?? [])
      .filter((item) => item.serviceType.id === serviceTypeId)
      .map((item) => item.user.id),
  )
  const candidates = (candidatesQuery.data?.items ?? []).filter((item) => !assignedIds.has(item.id))

  const save = useMutation({
    mutationFn: async () => {
      if (!serviceTypeId) {
        throw new Error(t('reservations.honoraryServiceTypeRequired'))
      }
      if (!userId) {
        throw new Error(t('reservations.honoraryServantRequired'))
      }
      const { data } = await api.post<Reservation>(
        `/reservations/${reservation.id}/honorary-assignments`,
        { userId, serviceTypeId },
      )
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.honoraryAssigned'))
      onChanged()
      onClose()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

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
        aria-label={t('reservations.honoraryPickerTitle')}
        className={`relative z-10 flex max-h-[min(90vh,44rem)] w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <FormCardHeader
          icon={HandHeart}
          title={t('reservations.honoraryPickerTitle')}
          subtitle={t('reservations.honoraryPickerHint')}
          action={
            <Button type="button" variant="ghost" className="size-8 !p-0" onClick={onClose}>
              <X className="size-4" aria-hidden />
            </Button>
          }
        />
        <AppForm
          className={formCardBodyClassName}
          onSubmit={() => {
            if (!serviceTypeId) {
              toast.error(t('reservations.honoraryServiceTypeRequired'))
              return
            }
            if (!userId) {
              toast.error(t('reservations.honoraryServantRequired'))
              return
            }
            save.mutate()
          }}
        >
          <FormField
            icon={HandHeart}
            label={t('honoraryServiceTypes.name')}
            htmlFor="reservation-honorary-service"
          >
            <SearchSelect
              id="reservation-honorary-service"
              value={serviceTypeId}
              required
              onChange={(next) => {
                setServiceTypeId(next)
                setUserId('')
              }}
              placeholder={t('reservations.selectHonoraryService')}
              options={types.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </FormField>
          <FormField
            icon={UserRound}
            label={t('reservations.honoraryServant')}
            htmlFor="reservation-honorary-user"
          >
            <SearchSelect
              id="reservation-honorary-user"
              value={userId}
              required
              onChange={setUserId}
              placeholder={t('reservations.selectHonoraryServant')}
              options={candidates.map((item) => ({
                value: item.id,
                label: item.fullName,
              }))}
            />
          </FormField>
          {typesQuery.isError || candidatesQuery.isError ? (
            <p className="text-sm text-red-700">{t('common.error')}</p>
          ) : null}
          {!typesQuery.isLoading && types.length === 0 ? (
            <p className="text-sm text-ink-500">{t('reservations.noHonoraryServiceTypes')}</p>
          ) : null}
          {serviceTypeId && !candidatesQuery.isLoading && candidates.length === 0 ? (
            <p className="text-sm text-ink-500">{t('reservations.noHonoraryCandidates')}</p>
          ) : null}
          <FormActions
            submitLabel={t('common.save')}
            cancelLabel={t('common.cancel')}
            onCancel={onClose}
            submitting={save.isPending}
          />
        </AppForm>
      </div>
    </div>,
    document.body,
  )
}
