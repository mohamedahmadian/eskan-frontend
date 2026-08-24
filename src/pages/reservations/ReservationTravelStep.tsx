import { Check } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import { AppForm, Button, cardClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import type { Country, Reservation } from '../../types/app'
import {
  ReservationTravelFields,
  travelDatesError,
  type TravelValues,
} from './ReservationTravelFields'

export function ReservationTravelStep({
  reservation,
  onChanged,
  mode = 'owner',
}: {
  reservation: Reservation
  onChanged: () => void
  mode?: 'owner' | 'admin'
}) {
  const { t } = useTranslation()
  const locked = mode === 'owner' && Boolean(reservation.basicInfoLockedAt)
  const [values, setValues] = useState<TravelValues>({
    provinceId: reservation.originCity?.provinceId ?? '',
    originCityId: reservation.originCity?.id ?? '',
    walkingRouteId: reservation.walkingRoute?.id ?? '',
    stayStartDate: reservation.stayStartDate ?? '',
    stayEndDate: reservation.stayEndDate ?? '',
    walkingStartDate: reservation.walkingStartDate ?? '',
    maleCount: String(reservation.maleCount),
    femaleCount: String(reservation.femaleCount),
    caravanId: reservation.caravan?.id ?? '',
    groupId: reservation.group?.id ?? '',
    requestsAccommodation: reservation.requestsAccommodation ?? true,
    requestsBus: reservation.requestsBus ?? true,
  })
  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', {
        params: { activeOnly: true },
      })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''

  const submit = useMutation({
    mutationFn: async () => {
      if (!locked) {
        await api.patch(`/reservations/${reservation.id}`, travelPayload(reservation.type, values))
      }
      if (mode === 'owner') {
        await api.post(`/reservations/${reservation.id}/submit`)
      }
    },
    onSuccess: () => {
      toast.success(t(mode === 'admin' ? 'reservations.updated' : 'reservations.submitted'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  function assertTravelDates() {
    const dateError = travelDatesError(values, t)
    if (dateError) {
      toast.error(dateError)
      return false
    }
    return true
  }

  return (
    <AppForm
      autoFocusFirst={false}
      onSubmit={(event) => {
        event.preventDefault()
        if (!assertTravelDates()) return
        if (!locked && reservation.type === 'GROUP' && !values.groupId) {
          toast.error(t('reservations.groupRequired'))
          return
        }
        if (!locked && reservation.type === 'CARAVAN' && !values.caravanId) {
          toast.error(t('reservations.caravanRequired'))
          return
        }
        if (mode === 'admin') {
          submit.mutate()
          return
        }
        confirmToast({
          title: t('reservations.confirmSubmitForReview'),
          confirmLabel: t('reservations.submitTravel'),
          cancelLabel: t('common.cancel'),
          onConfirm: () => submit.mutate(),
        })
      }}
      className={`space-y-4 p-6 ${cardClassName}`}
    >
      {mode === 'admin' ? (
        <p className="text-sm text-ink-500">{t('reservations.adminEditHint')}</p>
      ) : locked ? (
        <p className="text-sm text-ink-500">{t('reservations.lockedHint')}</p>
      ) : null}
      <ReservationTravelFields
        values={values}
        onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        type={reservation.type}
        locked={locked}
        iranId={iranId}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submit.isPending}>
          <Check className="size-4" aria-hidden />
          {t(mode === 'admin' ? 'reservations.saveTravel' : 'reservations.submitTravel')}
        </Button>
      </div>
    </AppForm>
  )
}

function travelPayload(type: Reservation['type'], values: TravelValues) {
  return {
    originCityId: values.originCityId || null,
    walkingRouteId: values.walkingRouteId || null,
    stayStartDate: values.stayStartDate || null,
    stayEndDate: values.stayEndDate || null,
    walkingStartDate: values.walkingStartDate || null,
    requestsAccommodation: values.requestsAccommodation,
    requestsBus: values.requestsBus,
    maleCount: Number(values.maleCount) || 0,
    femaleCount: Number(values.femaleCount) || 0,
    caravanId: type === 'CARAVAN' ? values.caravanId || null : null,
    groupId: type === 'GROUP' ? values.groupId || null : null,
  }
}
