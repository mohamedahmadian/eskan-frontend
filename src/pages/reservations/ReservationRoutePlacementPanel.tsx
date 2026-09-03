import {
  Check,
  CircleCheck,
  CircleDashed,
  MapPin,
  Milestone,
  Phone,
  Sparkles,
  UserRound,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  cardClassName,
} from '../../components/ui/Form'
import { FormCard, FormCardHeader, FormFactTile, formCardBodyClassName } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Reservation, ReservationRoutePlacement } from '../../types/app'
import {
  ReservationPlacementSmsButton,
  buildRoutePlacementSmsBody,
  reservationSmsPhone,
} from './ReservationPlacementSms'

const stationMeals = ['LUNCH', 'DINNER'] as const
type StationMeal = (typeof stationMeals)[number]

const stationCountTone = {
  teal: {
    wrap: 'bg-white text-teal-800 ring-teal-200',
    icon: 'bg-teal-500 text-white',
  },
  mint: {
    wrap: 'bg-white text-mint-800 ring-mint-200',
    icon: 'bg-mint-500 text-white',
  },
  ink: {
    wrap: 'bg-white text-ink-700 ring-line',
    icon: 'bg-ink-600 text-white',
  },
} as const

function StationCountBadge({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: keyof typeof stationCountTone
}) {
  const colors = stationCountTone[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ${colors.wrap}`}
    >
      <span className={`flex size-4 shrink-0 items-center justify-center rounded-full ${colors.icon}`}>
        <Icon className="size-2.5" aria-hidden />
      </span>
      <span className="font-bold tabular-nums">{value}</span>
      <span>{label}</span>
    </span>
  )
}

function StationCapacitySummary({
  maleCount,
  femaleCount,
  occupiedMaleCount,
  occupiedFemaleCount,
}: {
  maleCount: number
  femaleCount: number
  occupiedMaleCount: number
  occupiedFemaleCount: number
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const maleLabel = t('userGenders.MALE')
  const femaleLabel = t('userGenders.FEMALE')
  const genderLine = (male: number, female: number) => (
    <span className="flex flex-wrap items-center gap-x-3">
      <span>
        {maleLabel} : {formatNumber(male, locale)}
      </span>
      <span>
        {femaleLabel} : {formatNumber(female, locale)}
      </span>
    </span>
  )

  return (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-1 text-start text-[11px] text-ink-600">
      <span className="font-medium text-ink-700">
        {t('reservations.routePlacementTotalCapacity')}
      </span>
      {genderLine(maleCount, femaleCount)}
      <span className="font-medium text-ink-700">
        {t('reservations.routePlacementAllocated')}
      </span>
      {genderLine(occupiedMaleCount, occupiedFemaleCount)}
    </div>
  )
}

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
  const [meals, setMeals] = useState<Record<string, StationMeal | ''>>({})
  const [autoOpen, setAutoOpen] = useState(false)

  const query = useQuery({
    queryKey: ['reservations', reservation.id, 'route-placement'],
    queryFn: async () => {
      const { data } = await api.get<ReservationRoutePlacement>(
        `/reservations/${reservation.id}/route-placement`,
      )
      return data
    },
  })

  function refreshPlacement() {
    void queryClient.invalidateQueries({
      queryKey: ['reservations', reservation.id, 'route-placement'],
    })
  }

  const reserve = useMutation({
    mutationFn: async (payload: {
      walkingStationId: string
      stayDate: string
      mealType: StationMeal
    }) => {
      await api.post(`/reservations/${reservation.id}/route-placement`, payload)
    },
    onSuccess: () => {
      toast.success(t('reservations.routePlacementReserved'))
      refreshPlacement()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const cancelStay = useMutation({
    mutationFn: async (stayId: string) => {
      await api.post(`/reservations/${reservation.id}/route-placement/${stayId}/cancel`)
    },
    onSuccess: () => {
      toast.success(t('reservations.routePlacementCancelled'))
      refreshPlacement()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const stages = query.data?.stages ?? []
  const reservedCount = stages.filter((stage) => stage.stay).length
  const unreservedCount = stages.length - reservedCount
  const mealOptions = stationMeals.map((value) => ({
    value,
    label: t(`reservations.stationMeals.${value}`),
  }))

  return (
    <FormCard
      icon={Milestone}
      title={t('reservations.routePlacementTitle')}
      chips={
        query.data ? (
          <>
            <StationCountBadge
              icon={Milestone}
              label={t('reservations.routePlacementStatTotal')}
              value={formatNumber(stages.length, locale)}
              tone="teal"
            />
            <StationCountBadge
              icon={CircleCheck}
              label={t('reservations.routePlacementStatReserved')}
              value={formatNumber(reservedCount, locale)}
              tone="mint"
            />
            <StationCountBadge
              icon={CircleDashed}
              label={t('reservations.routePlacementStatUnreserved')}
              value={formatNumber(unreservedCount, locale)}
              tone="ink"
            />
          </>
        ) : null
      }
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ReservationPlacementSmsButton
            title={t('reservations.smsPreviewTitle')}
            phone={reservationSmsPhone(reservation)}
            body={buildRoutePlacementSmsBody(stages, t)}
          />
          {stages.length ? (
            <Button type="button" variant="soft" onClick={() => setAutoOpen(true)}>
              <Sparkles className="size-4" aria-hidden />
              {t('reservations.routePlacementAuto')}
            </Button>
          ) : null}
        </div>
      }
    >
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
              const meal = meals[stage.stationId] ?? stay?.mealType ?? ''
              return (
                <article
                  key={stage.stationId}
                  className={`space-y-3 rounded-2xl border bg-white p-4 ${
                    stay
                      ? 'border-2 border-teal-500 shadow-[0_8px_20px_rgba(46,189,182,0.12)]'
                      : 'border-teal-100'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-ink-900">
                        {formatNumber(stage.stageNumber, locale)}. {stage.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink-500">{nameOf(stage.city)}</p>
                    </div>
                    <StationCapacitySummary
                      maleCount={stage.maleCount}
                      femaleCount={stage.femaleCount}
                      occupiedMaleCount={stage.occupiedMaleCount ?? 0}
                      occupiedFemaleCount={stage.occupiedFemaleCount ?? 0}
                    />
                  </div>
                  {stage.managerName || stage.managerPhone || stage.address ? (
                    <div className="grid gap-2 md:grid-cols-3">
                      <FormFactTile
                        compact
                        icon={UserRound}
                        label={t('walkingStations.managerName')}
                        value={stage.managerName || ''}
                        empty={!stage.managerName}
                        tone="teal"
                      />
                      <FormFactTile
                        compact
                        icon={Phone}
                        label={t('walkingRoutes.managerPhone')}
                        copyValue={stage.managerPhone ?? undefined}
                        empty={!stage.managerPhone}
                        tone="mint"
                      />
                      <FormFactTile
                        compact
                        icon={MapPin}
                        label={t('walkingStations.address')}
                        value={stage.address || ''}
                        empty={!stage.address}
                        tone="ink"
                      />
                    </div>
                  ) : null}
                  {stay ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <p className="w-full max-w-[300px] rounded-2xl border border-line bg-cream-50 px-3 py-2.5 text-sm font-medium text-ink-800">
                        {t('reservations.routePlacementStayDate')}:{' '}
                        <DateText value={stay.stayDate} />
                      </p>
                      <p className="w-full max-w-[200px] rounded-2xl border border-line bg-cream-50 px-3 py-2.5 text-sm font-medium text-ink-800">
                        {t('reservations.stationMeal')}:{' '}
                        {t(`reservations.stationMeals.${stay.mealType}`)}
                      </p>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() =>
                          confirmToast({
                            title: t('reservations.routePlacementConfirmCancel'),
                            confirmLabel: t('common.yes'),
                            cancelLabel: t('common.cancel'),
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
                        if (meal !== 'LUNCH' && meal !== 'DINNER') {
                          toast.error(t('reservations.stationMealRequired'))
                          return
                        }
                        reserve.mutate({
                          walkingStationId: stage.stationId,
                          stayDate: date,
                          mealType: meal,
                        })
                      }}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <div className="w-full max-w-[300px]">
                        <PersianDateField
                          value={date}
                          onChange={(next) =>
                            setDates((current) => ({ ...current, [stage.stationId]: next }))
                          }
                        />
                      </div>
                      <div className="w-full max-w-[200px]">
                        <SearchSelect
                          value={meal}
                          onChange={(next) =>
                            setMeals((current) => ({
                              ...current,
                              [stage.stationId]: next as StationMeal,
                            }))
                          }
                          options={mealOptions}
                          placeholder={t('reservations.selectStationMeal')}
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
      {autoOpen ? (
        <AutoReserveStationsModal
          reservation={reservation}
          onClose={() => setAutoOpen(false)}
          onDone={() => {
            setAutoOpen(false)
            refreshPlacement()
          }}
        />
      ) : null}
    </FormCard>
  )
}

function AutoReserveStationsModal({
  reservation,
  onClose,
  onDone,
}: {
  reservation: Reservation
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [stayDate, setStayDate] = useState(reservation.walkingStartDate ?? '')
  const [mealType, setMealType] = useState<StationMeal | ''>('')

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

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ReservationRoutePlacement>(
        `/reservations/${reservation.id}/route-placement/auto`,
        { stayDate, mealType },
      )
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.routePlacementAutoOk'))
      onDone()
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
        aria-labelledby="auto-reserve-title"
        className={`relative z-10 flex max-h-[min(90vh,44rem)] w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <FormCardHeader
          icon={Sparkles}
          title={<span id="auto-reserve-title">{t('reservations.routePlacementAuto')}</span>}
          subtitle={t('reservations.routePlacementAutoHint')}
          action={
            <Button type="button" variant="ghost" className="size-8 !p-0" onClick={onClose}>
              <X className="size-4" aria-hidden />
            </Button>
          }
        />
        <AppForm
          className={formCardBodyClassName}
          onSubmit={() => {
            if (!stayDate) {
              toast.error(t('reservations.routePlacementDateRequired'))
              return
            }
            if (mealType !== 'LUNCH' && mealType !== 'DINNER') {
              toast.error(t('reservations.stationMealRequired'))
              return
            }
            confirmToast({
              title: t('reservations.routePlacementAutoConfirm'),
              confirmLabel: t('common.yes'),
              cancelLabel: t('common.cancel'),
              onConfirm: () => save.mutate(),
            })
          }}
        >
          <FormField icon={Milestone} label={t('reservations.routePlacementStayDate')}>
            <PersianDateField value={stayDate} onChange={(next) => setStayDate(next ?? '')} />
          </FormField>
          <FormField icon={UtensilsCrossed} label={t('reservations.stationMeal')}>
            <SearchSelect
              value={mealType}
              onChange={(next) => setMealType(next as StationMeal)}
              options={stationMeals.map((value) => ({
                value,
                label: t(`reservations.stationMeals.${value}`),
              }))}
              placeholder={t('reservations.selectStationMeal')}
            />
          </FormField>
          <FormActions
            submitLabel={t('reservations.routePlacementAuto')}
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
