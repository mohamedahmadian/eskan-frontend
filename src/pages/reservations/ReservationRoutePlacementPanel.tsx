import { Check, Milestone, Phone, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import { AppForm, Button } from '../../components/ui/Form'
import { FormCard, FormFactTile, formCardBodyClassName } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Reservation, ReservationRoutePlacement } from '../../types/app'

export function ReservationRoutePlacementPanel({
  reservation,
}: {
  reservation: Reservation
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const queryClient = useQueryClient()
  const [dates, setDates] = useState<Record<string, string>>({})

  const query = useQuery({
    queryKey: ['reservations', reservation.id, 'route-placement'],
    queryFn: async () => {
      const { data } = await api.get<ReservationRoutePlacement>(
        `/reservations/${reservation.id}/route-placement`,
      )
      return data
    },
  })

  const reserve = useMutation({
    mutationFn: async (payload: { walkingStationId: string; stayDate: string }) => {
      await api.post(`/reservations/${reservation.id}/route-placement`, payload)
    },
    onSuccess: () => {
      toast.success(t('reservations.routePlacementReserved'))
      void queryClient.invalidateQueries({
        queryKey: ['reservations', reservation.id, 'route-placement'],
      })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const cancelStay = useMutation({
    mutationFn: async (stayId: string) => {
      await api.post(`/reservations/${reservation.id}/route-placement/${stayId}/cancel`)
    },
    onSuccess: () => {
      toast.success(t('reservations.routePlacementCancelled'))
      void queryClient.invalidateQueries({
        queryKey: ['reservations', reservation.id, 'route-placement'],
      })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const stages = query.data?.stages ?? []

  return (
    <FormCard icon={Milestone} title={t('reservations.routePlacementTitle')}>
      <div className={formCardBodyClassName}>
        {query.isError ? (
          <p className="text-sm font-medium text-red-700">
            {getApiErrorMessage(query.error, t('common.error'))}
          </p>
        ) : query.isLoading ? (
          <p className="text-sm text-ink-500">{t('common.loading')}</p>
        ) : stages.length ? (
          <div className="space-y-3">
            {stages.map((stage) => {
              const stay = stage.stay
              const date = dates[stage.stationId] ?? stay?.stayDate ?? ''
              return (
                <article
                  key={stage.stationId}
                  className="space-y-3 rounded-2xl border border-teal-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-ink-900">
                        {formatNumber(stage.stageNumber, locale)}. {stage.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-500">{nameOf(stage.city)}</p>
                    </div>
                    <div className="flex gap-2 text-[11px] text-ink-600">
                      <span>
                        {t('walkingStations.maleCount')}: {formatNumber(stage.maleCount, locale)}
                      </span>
                      <span>
                        {t('walkingStations.femaleCount')}: {formatNumber(stage.femaleCount, locale)}
                      </span>
                    </div>
                  </div>
                  {stage.managerName || stage.managerPhone ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormFactTile
                        icon={UserRound}
                        label={t('walkingRoutes.managerName')}
                        value={stage.managerName || ''}
                        empty={!stage.managerName}
                        tone="teal"
                      />
                      <FormFactTile
                        icon={Phone}
                        label={t('walkingRoutes.managerPhone')}
                        copyValue={stage.managerPhone ?? undefined}
                        empty={!stage.managerPhone}
                        tone="mint"
                      />
                    </div>
                  ) : null}
                  {stay ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink-800">
                        {t('reservations.routePlacementStayDate')}:{' '}
                        <DateText value={stay.stayDate} />
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          confirmToast({
                            message: t('reservations.routePlacementConfirmCancel'),
                            confirmLabel: t('common.yes'),
                            confirmVariant: 'danger',
                            onConfirm: () => cancelStay.mutate(stay.id),
                          })
                        }
                      >
                        <X className="size-4" aria-hidden />
                        {t('reservations.routePlacementCancel')}
                      </Button>
                    </div>
                  ) : (
                    <AppForm
                      onSubmit={() => {
                        if (!date) {
                          toast.error(t('reservations.routePlacementDateRequired'))
                          return
                        }
                        reserve.mutate({ walkingStationId: stage.stationId, stayDate: date })
                      }}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <div className="min-w-48 flex-1">
                        <PersianDateField
                          value={date}
                          onChange={(next) =>
                            setDates((current) => ({ ...current, [stage.stationId]: next }))
                          }
                        />
                      </div>
                      <Button type="submit">
                        <Check className="size-4" aria-hidden />
                        {t('reservations.routePlacementReserve')}
                      </Button>
                    </AppForm>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-500">{t('walkingRoutes.stagesEmpty')}</p>
        )}
      </div>
    </FormCard>
  )
}
