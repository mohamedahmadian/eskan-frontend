import {
  CalendarDays,
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
import { useAuth } from '../../auth/AuthProvider'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  cardClassName,
} from '../../components/ui/Form'
import { FormCard, FormCardHeader, FormEmptyHint, FormFactTile, formCardBodyClassName } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isAdmin } from '../../lib/roles'
import type {
  Reservation,
  ReservationRoutePlacement,
  ReservationRoutePlacementDay,
  ReservationRoutePlacementStage,
  ReservationRoutePlacementStay,
} from '../../types/app'
import {
  ReservationPlacementSmsButton,
  buildRoutePlacementSmsBody,
  reservationSmsPhone,
} from './ReservationPlacementSms'

const stationMeals = ['LUNCH', 'DINNER'] as const
type StationMeal = (typeof stationMeals)[number]
type RoutePlacementMode = 'station' | 'date'

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

function stationStaysOf(stage: ReservationRoutePlacementStage): ReservationRoutePlacementStay[] {
  if (stage.stays?.length) return stage.stays
  return stage.stay ? [stage.stay] : []
}

function RoutePlacementModeTabs({
  mode,
  onChange,
}: {
  mode: RoutePlacementMode
  onChange: (next: RoutePlacementMode) => void
}) {
  const { t } = useTranslation()
  const tabs = [
    { id: 'station' as const, icon: Milestone, label: t('reservations.routePlacementModeStation') },
    { id: 'date' as const, icon: CalendarDays, label: t('reservations.routePlacementModeDate') },
  ]
  return (
    <nav className={`grid grid-cols-2 gap-2 p-2 ${cardClassName}`}>
      {tabs.map((item) => {
        const Icon = item.icon
        const active = mode === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl px-2 py-3 text-center text-xs font-semibold leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:px-3 sm:text-sm ${
              active
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function ReservationRoutePlacementPanel({
  reservation,
}: {
  reservation: Reservation
}) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const canManage = isAdmin(user)
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<RoutePlacementMode>('station')
  const [dates, setDates] = useState<Record<string, string>>({})
  const [meals, setMeals] = useState<Record<string, StationMeal | ''>>({})
  const [dateStations, setDateStations] = useState<Record<string, string>>({})
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
      assignBy?: RoutePlacementMode
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
  const days = query.data?.days ?? []
  const reservedCount = stages.filter((stage) => stationStaysOf(stage).length).length
  const unreservedCount = stages.length - reservedCount
  const mealSlotCount = days.length * 2
  const reservedMealCount = days.reduce(
    (sum, day) => sum + (day.lunch ? 1 : 0) + (day.dinner ? 1 : 0),
    0,
  )
  const mealOptions = stationMeals.map((value) => ({
    value,
    label: t(`reservations.stationMeals.${value}`),
  }))
  const stationOptions = stages.map((stage) => ({
    value: stage.stationId,
    label: `${formatNumber(stage.stageNumber, locale)}. ${stage.name}`,
  }))

  return (
    <FormCard
      icon={Milestone}
      title={t('reservations.routePlacementTitle')}
      subtitle={
        canManage
          ? mode === 'date'
            ? t('reservations.routePlacementDateHint')
            : undefined
          : t('reservations.routePlacementOwnerHint')
      }
      chips={
        query.data ? (
          mode === 'date' ? (
            <>
              <StationCountBadge
                icon={CalendarDays}
                label={t('reservations.routePlacementStatTotalDays')}
                value={formatNumber(days.length, locale)}
                tone="teal"
              />
              <StationCountBadge
                icon={CircleCheck}
                label={t('reservations.routePlacementStatReserved')}
                value={formatNumber(reservedMealCount, locale)}
                tone="mint"
              />
              <StationCountBadge
                icon={CircleDashed}
                label={t('reservations.routePlacementStatUnreserved')}
                value={formatNumber(mealSlotCount - reservedMealCount, locale)}
                tone="ink"
              />
            </>
          ) : (
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
          )
        ) : null
      }
      action={
        canManage ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReservationPlacementSmsButton
              title={t('reservations.smsPreviewTitle')}
              phone={reservationSmsPhone(reservation)}
              body={buildRoutePlacementSmsBody(stages, t)}
            />
            {stages.length && (mode === 'station' || days.length) ? (
              <Button type="button" variant="soft" onClick={() => setAutoOpen(true)}>
                <Sparkles className="size-4" aria-hidden />
                {t('reservations.routePlacementAuto')}
              </Button>
            ) : null}
          </div>
        ) : undefined
      }
    >
      <div className={formCardBodyClassName}>
        {query.isError ? (
          <p className="text-sm font-medium text-red-700">
            {getApiErrorMessage(query.error, t('common.error'))}
          </p>
        ) : query.isLoading ? (
          <p className="text-sm text-ink-500">{t('common.loading')}</p>
        ) : (
          <div className="space-y-4">
            <RoutePlacementModeTabs mode={mode} onChange={setMode} />
            {mode === 'date' ? (
              <RoutePlacementDateList
                days={days}
                stages={stages}
                canManage={canManage}
                stationOptions={stationOptions}
                dateStations={dateStations}
                onStationChange={(key, next) =>
                  setDateStations((current) => ({ ...current, [key]: next }))
                }
                onReserve={(payload) =>
                  reserve.mutate({ ...payload, assignBy: 'date' })
                }
                onCancel={(stayId) => cancelStay.mutate(stayId)}
              />
            ) : stages.length ? (
              <div className="space-y-3">
                {stages.map((stage) => {
                  const stays = stationStaysOf(stage)
                  const date = dates[stage.stationId] ?? stays[0]?.stayDate ?? ''
                  const meal = meals[stage.stationId] ?? stays[0]?.mealType ?? ''
                  return (
                    <article
                      key={stage.stationId}
                      className={`space-y-3 rounded-2xl border bg-white p-4 ${
                        stays.length
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
                        {canManage ? (
                          <StationCapacitySummary
                            maleCount={stage.maleCount}
                            femaleCount={stage.femaleCount}
                            occupiedMaleCount={stage.occupiedMaleCount ?? 0}
                            occupiedFemaleCount={stage.occupiedFemaleCount ?? 0}
                          />
                        ) : null}
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
                      {stays.length ? (
                        <div className="space-y-2">
                          {stays.map((stay) => (
                            <div key={stay.id} className="flex flex-wrap items-end gap-3">
                              <p className="w-full max-w-[300px] rounded-2xl border border-line bg-cream-50 px-3 py-2.5 text-sm font-medium text-ink-800">
                                {t('reservations.routePlacementStayDate')}:{' '}
                                <DateText value={stay.stayDate} />
                              </p>
                              <p className="w-full max-w-[200px] rounded-2xl border border-line bg-cream-50 px-3 py-2.5 text-sm font-medium text-ink-800">
                                {t('reservations.stationMeal')}:{' '}
                                {t(`reservations.stationMeals.${stay.mealType}`)}
                              </p>
                              {canManage ? (
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
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : canManage ? (
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
                              assignBy: 'station',
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
                      ) : (
                        <FormEmptyHint>{t('reservations.routePlacementPendingStay')}</FormEmptyHint>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-500">{t('walkingRoutes.stagesEmpty')}</p>
            )}
          </div>
        )}
      </div>
      {canManage && autoOpen ? (
        <AutoReserveStationsModal
          reservation={reservation}
          assignBy={mode}
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

function RoutePlacementDateList({
  days,
  stages,
  canManage,
  stationOptions,
  dateStations,
  onStationChange,
  onReserve,
  onCancel,
}: {
  days: ReservationRoutePlacementDay[]
  stages: ReservationRoutePlacementStage[]
  canManage: boolean
  stationOptions: { value: string; label: string }[]
  dateStations: Record<string, string>
  onStationChange: (key: string, next: string) => void
  onReserve: (payload: {
    walkingStationId: string
    stayDate: string
    mealType: StationMeal
  }) => void
  onCancel: (stayId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()

  if (!stages.length) {
    return <p className="text-sm text-ink-500">{t('walkingRoutes.stagesEmpty')}</p>
  }
  if (!days.length) {
    return <FormEmptyHint>{t('reservations.routePlacementDatesMissing')}</FormEmptyHint>
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const filled = Boolean(day.lunch || day.dinner)
        return (
          <article
            key={day.stayDate}
            className={`space-y-3 rounded-2xl border bg-white p-4 ${
              filled
                ? 'border-2 border-teal-500 shadow-[0_8px_20px_rgba(46,189,182,0.12)]'
                : 'border-teal-100'
            }`}
          >
            <h3 className="text-sm font-semibold text-ink-900">
              <DateText value={day.stayDate} />
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {stationMeals.map((mealType) => {
                const slot = mealType === 'LUNCH' ? day.lunch : day.dinner
                const key = `${day.stayDate}:${mealType}`
                const selected = dateStations[key] ?? slot?.station.stationId ?? ''
                return (
                  <div
                    key={mealType}
                    className="space-y-3 rounded-2xl border border-line bg-cream-50 p-3"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                      <UtensilsCrossed className="size-4 text-teal-600" aria-hidden />
                      {t(`reservations.stationMeals.${mealType}`)}
                    </p>
                    {slot ? (
                      <>
                        <div className="grid gap-2">
                          <FormFactTile
                            compact
                            icon={Milestone}
                            label={t('walkingStations.name')}
                            value={`${formatNumber(slot.station.stageNumber, locale)}. ${slot.station.name}`}
                            tone="teal"
                          />
                          <FormFactTile
                            compact
                            icon={MapPin}
                            label={t('walkingStations.address')}
                            value={
                              slot.station.address || nameOf(slot.station.city) || ''
                            }
                            empty={!slot.station.address && !nameOf(slot.station.city)}
                            tone="ink"
                          />
                        </div>
                        {canManage ? (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() =>
                              confirmToast({
                                title: t('reservations.routePlacementConfirmCancel'),
                                confirmLabel: t('common.yes'),
                                cancelLabel: t('common.cancel'),
                                confirmVariant: 'danger',
                                onConfirm: () => onCancel(slot.stay.id),
                              })
                            }
                          >
                            <X className="size-4" aria-hidden />
                            {t('reservations.routePlacementCancel')}
                          </Button>
                        ) : null}
                      </>
                    ) : canManage ? (
                      <AppForm
                        onSubmit={() => {
                          if (!selected) {
                            toast.error(t('reservations.routePlacementStationRequired'))
                            return
                          }
                          onReserve({
                            walkingStationId: selected,
                            stayDate: day.stayDate,
                            mealType,
                          })
                        }}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <SearchSelect
                            value={selected}
                            onChange={(next) => onStationChange(key, next)}
                            options={stationOptions}
                            placeholder={t('reservations.routePlacementSelectStation')}
                          />
                        </div>
                        <Button type="submit">
                          <Check className="size-4" aria-hidden />
                          {t('reservations.routePlacementReserve')}
                        </Button>
                      </AppForm>
                    ) : (
                      <FormEmptyHint>{t('reservations.routePlacementPendingMeal')}</FormEmptyHint>
                    )}
                  </div>
                )
              })}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function AutoReserveStationsModal({
  reservation,
  assignBy,
  onClose,
  onDone,
}: {
  reservation: Reservation
  assignBy: RoutePlacementMode
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
        { stayDate, mealType, assignBy },
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
          subtitle={
            assignBy === 'date'
              ? t('reservations.routePlacementAutoHintDate')
              : t('reservations.routePlacementAutoHint')
          }
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
          <FormField icon={CalendarDays} label={t('reservations.routePlacementStayDate')}>
            <PersianDateField
              value={stayDate}
              onChange={(next) => setStayDate(next ?? '')}
              minDate={assignBy === 'date' ? reservation.walkingStartDate ?? undefined : undefined}
              maxDate={assignBy === 'date' ? reservation.stayStartDate ?? undefined : undefined}
            />
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
