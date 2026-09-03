import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Mars,
  Milestone,
  Route,
  Tent,
  UserRound,
  Venus,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, cardClassName, listShellClassName, LoadingState } from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { api, getApiErrorMessage } from '../../lib/api'
import {
  addDaysIso,
  formatGregorianDate,
  formatHijriDate,
  formatJalaliDate,
  formatNumber,
  formatWeekday,
  todayIsoDate,
} from '../../lib/datetime'
import type { StationStayFile, WalkingStation } from '../../types/app'

function stayPersonName(stay: StationStayFile) {
  const person = stay.reservation.person
  if (person) {
    const first = person.firstName?.trim()
    const last = person.lastName?.trim()
    if (first || last) return [first, last].filter(Boolean).join(' ')
    return person.fullName
  }
  return stay.reservation.createdBy.fullName
}

export function StationManagerDashboard() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const today = todayIsoDate()
  const [stationId, setStationId] = useState<string>('')
  const [centerDate, setCenterDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDaysIso(centerDate, index - 3)),
    [centerDate],
  )
  const from = days[0]
  const to = days[6]

  const stationsQuery = useQuery({
    queryKey: ['walking-stations', 'mine', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<WalkingStation[]>('/walking-stations/mine')
      return data
    },
  })

  const stations = stationsQuery.data ?? []
  const activeStationId = stationId || stations[0]?.id || ''

  const staysQuery = useQuery({
    queryKey: ['walking-stations', activeStationId, 'stays', from, to],
    enabled: Boolean(activeStationId),
    queryFn: async () => {
      const { data } = await api.get<{ items: StationStayFile[] }>(
        `/walking-stations/${activeStationId}/stays`,
        { params: { from, to } },
      )
      return data.items
    },
  })

  const setPresence = useMutation({
    mutationFn: async ({ stayId, present }: { stayId: string; present: boolean }) => {
      await api.patch(`/walking-stations/${activeStationId}/stays/${stayId}`, { present })
    },
    onSuccess: () => {
      toast.success(t('stationDashboard.presenceUpdated'))
      void queryClient.invalidateQueries({
        queryKey: ['walking-stations', activeStationId, 'stays'],
      })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const stays = staysQuery.data ?? []
  const reservedStays = stays.filter((item) => item.status === 'RESERVED')
  const dayStays = reservedStays.filter((item) => item.stayDate === selectedDate)
  const statsByDate = useMemo(() => {
    const map = new Map<string, { total: number; present: number; absent: number }>()
    for (const day of days) {
      map.set(day, { total: 0, present: 0, absent: 0 })
    }
    for (const stay of reservedStays) {
      const row = map.get(stay.stayDate)
      if (!row) continue
      row.total += 1
      if (stay.present) row.present += 1
      else row.absent += 1
    }
    return map
  }, [days, reservedStays])
  const selectedStats = statsByDate.get(selectedDate) ?? { total: 0, present: 0, absent: 0 }

  if (stationsQuery.isLoading) {
    return <LoadingState />
  }

  if (!stations.length) {
    return (
      <div className={`${listShellClassName} space-y-6`}>
        <FormEmptyHint>{t('stationDashboard.empty')}</FormEmptyHint>
      </div>
    )
  }

  return (
    <div className={`${listShellClassName} space-y-5`}>
      <nav className="flex gap-2">
        {stations.map((station) => {
          const active = station.id === activeStationId
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => setStationId(station.id)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                active
                  ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                  : 'border border-line bg-white text-ink-700 hover:bg-cream-100'
              }`}
            >
              <Milestone className={`size-4 shrink-0 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
              <span className="truncate">{station.name}</span>
            </button>
          )
        })}
      </nav>

      <div className={`${cardClassName} space-y-3 p-4 sm:p-5`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-line bg-white text-teal-700 hover:bg-cream-50"
              onClick={() => {
                const next = addDaysIso(centerDate, -7)
                setCenterDate(next)
                setSelectedDate(addDaysIso(selectedDate, -7))
              }}
              aria-label={t('stationDashboard.prevDays')}
            >
              <ChevronRight className="size-5 rtl:rotate-0" aria-hidden />
            </button>
            <p className="text-sm font-medium text-ink-600">
              {formatJalaliDate(from, locale)} — {formatJalaliDate(to, locale)}
            </p>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-line bg-white text-teal-700 hover:bg-cream-50"
              onClick={() => {
                const next = addDaysIso(centerDate, 7)
                setCenterDate(next)
                setSelectedDate(addDaysIso(selectedDate, 7))
              }}
              aria-label={t('stationDashboard.nextDays')}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((date) => {
              const stats = statsByDate.get(date) ?? { total: 0, present: 0, absent: 0 }
              const selected = date === selectedDate
              const isToday = date === today
              const hasFiles = stats.total > 0
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-2xl border-2 p-1.5 text-center transition sm:p-2 ${
                    selected
                      ? hasFiles
                        ? 'border-emerald-500 bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.24)]'
                        : 'border-teal-400 bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.24)]'
                      : hasFiles
                        ? 'border-emerald-500 bg-cream-50 text-ink-800 hover:bg-white'
                        : isToday
                          ? 'border-mint-300 bg-mint-50 text-ink-800'
                          : 'border-line bg-cream-50 text-ink-800 hover:border-teal-200 hover:bg-white'
                  }`}
                >
                  <span className={`text-[10px] font-medium ${selected ? 'text-white/80' : 'text-ink-500'}`}>
                    {isToday ? t('stationDashboard.today') : formatWeekday(date, locale)}
                  </span>
                  <span className="text-sm font-bold leading-tight sm:text-base">
                    {formatJalaliDate(date, locale)}
                  </span>
                  <span
                    className={`text-[9px] leading-tight sm:text-[10px] ${selected ? 'text-white/75' : 'text-ink-500'}`}
                    dir="rtl"
                  >
                    {formatHijriDate(date, locale)}
                  </span>
                  <span
                    className={`text-[9px] leading-tight sm:text-[10px] ${selected ? 'text-white/75' : 'text-ink-500'}`}
                    dir="ltr"
                  >
                    {formatGregorianDate(date, locale)}
                  </span>
                  <span
                    className={`mt-0.5 text-lg font-extrabold leading-none sm:text-xl ${
                      selected ? 'text-white' : 'text-teal-700'
                    }`}
                  >
                    {formatNumber(stats.total, locale)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DashboardStat
            label={t('stationDashboard.files')}
            value={formatNumber(selectedStats.total, locale)}
            tone="teal"
          />
          <DashboardStat
            label={t('stationDashboard.total')}
            value={formatNumber(selectedStats.total, locale)}
            tone="ink"
          />
          <DashboardStat
            label={t('stationDashboard.present')}
            value={formatNumber(selectedStats.present, locale)}
            tone="mint"
          />
          <DashboardStat
            label={t('stationDashboard.absent')}
            value={formatNumber(selectedStats.absent, locale)}
            tone="rose"
          />
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink-600">{t('stationDashboard.dayList')}</h2>
          <DateText value={selectedDate} />
        </div>
        {staysQuery.isLoading ? (
          <LoadingState />
        ) : dayStays.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {dayStays.map((stay) => (
              <StayCard
                key={stay.id}
                stay={stay}
                locale={locale}
                pending={
                  setPresence.isPending && setPresence.variables?.stayId === stay.id
                }
                onSetPresence={(present) => setPresence.mutate({ stayId: stay.id, present })}
              />
            ))}
          </div>
        ) : (
          <FormEmptyHint>{t('stationDashboard.dayEmpty')}</FormEmptyHint>
        )}
      </section>
    </div>
  )
}

function DashboardStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'teal' | 'mint' | 'ink' | 'rose'
}) {
  const tones = {
    teal: 'bg-teal-50 text-teal-800',
    mint: 'bg-mint-50 text-mint-800',
    ink: 'bg-cream-100 text-ink-800',
    rose: 'bg-rose-50 text-rose-800',
  }
  return (
    <article className={`flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 ${tones[tone]}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </article>
  )
}

function StayCard({
  stay,
  locale,
  pending,
  onSetPresence,
}: {
  stay: StationStayFile
  locale: string
  pending: boolean
  onSetPresence: (present: boolean) => void
}) {
  const { t } = useTranslation()
  const name = stayPersonName(stay)
  const reserved = stay.status === 'RESERVED'
  return (
    <article className={`${cardClassName} overflow-hidden`}>
      <div className="h-1.5 bg-gradient-to-e from-teal-400 to-mint-300" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 font-semibold text-ink-900">
              <UserRound className="size-4 text-teal-600" aria-hidden />
              {name}
            </p>
            <div className="mt-1.5">
              <ReservationCodeBadge code={stay.reservation.code} size="sm" />
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
              stay.present
                ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                : 'bg-rose-100 text-rose-700 ring-rose-200'
            }`}
          >
            {stay.present ? t('walkingStations.present') : t('walkingStations.absent')}
          </span>
        </div>
        {stay.reservation.partyName ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-700">
            <Tent className="size-3.5 text-mint-600" aria-hidden />
            {stay.reservation.partyName}
          </p>
        ) : (
          <p className="text-sm text-ink-500">{t(`reservations.types.${stay.reservation.type}`)}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-2.5 py-1.5 text-sm text-sky-800">
            <Mars className="size-3.5" aria-hidden />
            {formatNumber(stay.maleCount, locale)}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 px-2.5 py-1.5 text-sm text-pink-800">
            <Venus className="size-3.5" aria-hidden />
            {formatNumber(stay.femaleCount, locale)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-teal-600" aria-hidden />
            {stay.reservation.walkingStartDate ? (
              <DateText value={stay.reservation.walkingStartDate} />
            ) : (
              '—'
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Route className="size-3.5 text-mint-600" aria-hidden />
            {stay.reservation.walkingRoute?.name || '—'}
          </span>
        </div>
        {reserved ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant={stay.present ? 'primary' : 'ghost'}
              className="flex-1"
              disabled={pending || stay.present}
              onClick={() => onSetPresence(true)}
            >
              <Check className="size-4" aria-hidden />
              {t('stationDashboard.setPresent')}
            </Button>
            <Button
              type="button"
              variant={!stay.present ? 'danger' : 'ghost'}
              className="flex-1"
              disabled={pending || !stay.present}
              onClick={() => onSetPresence(false)}
            >
              <X className="size-4" aria-hidden />
              {t('stationDashboard.setAbsent')}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
