import {
  Building2,
  Bus,
  CalendarCheck,
  CalendarRange,
  ClipboardCheck,
  Footprints,
  History,
  MapPin,
  Mars,
  Phone,
  Shield,
  Tent,
  Timer,
  UserRound,
  Users,
  Venus,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { PaginationBar } from '../../components/ui/ListControls'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import { elapsedDurationParts, formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type {
  Caravan,
  CaravanPilgrimageHistoryItem,
  Paginated,
} from '../../types/app'
import {
  ReservationStatusBadge,
  ReservationTypeBadge,
} from '../reservations/ReservationStatusBadge'

function stayNightCount(start: string | null, end: string | null) {
  if (!start || !end) return 0
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const nights = Math.round((toUtc(end) - toUtc(start)) / 86_400_000)
  return nights > 0 ? nights : 0
}

function completionDurationLabel(
  createdAt: string,
  completedAt: string,
  locale: string,
  t: (key: string, options?: { count?: string }) => string,
) {
  const endMs = Date.parse(completedAt)
  if (!Number.isFinite(endMs)) return null
  const parts = elapsedDurationParts(createdAt, endMs)
  if (!parts) return null
  const n = (value: number) => formatNumber(value, locale)
  const chunks: string[] = []
  if (parts.days > 0) {
    chunks.push(t('reservations.elapsedDay', { count: n(parts.days) }))
  }
  if (parts.hours > 0) {
    chunks.push(t('reservations.elapsedHour', { count: n(parts.hours) }))
  }
  if (parts.minutes > 0 || chunks.length === 0) {
    chunks.push(t('reservations.elapsedMinute', { count: n(parts.minutes) }))
  }
  return chunks.join(t('reservations.elapsedJoin'))
}

export function CaravanPilgrimageHistoryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const { page, setPage } = useListParams()
  const geoName = useGeoName()
  const fromMyCaravans = useLocation().pathname.startsWith('/my-caravans/')
  const empty = t('reservations.notEntered')

  const caravanQuery = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })

  const historyQuery = useQuery({
    queryKey: ['caravans', id, 'pilgrimage-history', page],
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<CaravanPilgrimageHistoryItem>>(
        `/caravans/${id}/pilgrimage-history`,
        { params: { page } },
      )
      return data
    },
  })

  const caravan = caravanQuery.data
  const history = historyQuery.data

  if (!caravan) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('caravanPilgrimageHistory.title')}
        subtitle={<EntityNameSubtitle name={caravan.name} icon={Tent} />}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <History className="size-4" aria-hidden />
          </span>
          <h3 className="text-sm font-semibold text-ink-800">
            {t('caravanPilgrimageHistory.listSubtitle')}
          </h3>
        </div>

        {historyQuery.isLoading && !history ? <LoadingState /> : null}

        {history && history.total === 0 ? (
          <FormEmptyHint>{t('caravanPilgrimageHistory.historyEmpty')}</FormEmptyHint>
        ) : null}

        {history?.items.map((item) => {
          const n = (value: number) => formatNumber(value, locale)
          const nights = stayNightCount(item.stayStartDate, item.stayEndDate)
          const reservationPath = fromMyCaravans
            ? `/my-reservations/${item.id}`
            : `/reservations/${item.id}`

          return (
            <FormCard
              key={item.id}
              icon={ClipboardCheck}
              title={t('caravanPilgrimageHistory.fileTitle', { year: n(item.year) })}
              subtitle={
                item.originCity
                  ? geoName(item.originCity)
                  : t('reservations.year') + ' ' + n(item.year)
              }
              chips={
                <>
                  <ReservationTypeBadge type={item.type} />
                  <ReservationStatusBadge status={item.status} />
                </>
              }
            >
              <div className="space-y-6 p-5 sm:p-6">
                <section>
                  <FormSectionTitle icon={ClipboardCheck}>
                    {t('pilgrims.historyReservation')}
                  </FormSectionTitle>
                  <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                    <FormFactTile
                      icon={CalendarCheck}
                      label={t('reservations.year')}
                      value={n(item.year)}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={MapPin}
                      label={t('reservations.originCity')}
                      value={item.originCity ? geoName(item.originCity) : empty}
                      empty={!item.originCity}
                      tone="mint"
                    />
                    <FormFactTile
                      icon={CalendarRange}
                      label={t('reservations.stayStartDateShort')}
                      value={
                        item.stayStartDate ? (
                          <DateText value={item.stayStartDate} />
                        ) : (
                          empty
                        )
                      }
                      empty={!item.stayStartDate}
                      tone="ink"
                    />
                    <FormFactTile
                      icon={CalendarRange}
                      label={t('reservations.stayEndDateShort')}
                      value={
                        item.stayEndDate ? <DateText value={item.stayEndDate} /> : empty
                      }
                      empty={!item.stayEndDate}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={Footprints}
                      label={t('reservations.walkingStartDateShort')}
                      value={
                        item.walkingStartDate ? (
                          <DateText value={item.walkingStartDate} />
                        ) : (
                          empty
                        )
                      }
                      empty={!item.walkingStartDate}
                      tone="mint"
                    />
                    <FormFactTile
                      icon={CalendarCheck}
                      label={t('pilgrims.historyNights')}
                      value={
                        nights ? t('reservations.stayNights', { count: n(nights) }) : empty
                      }
                      empty={!nights}
                      tone="ink"
                    />
                    <FormFactTile
                      icon={MapPin}
                      label={t('reservations.walkingRoute')}
                      value={item.walkingRoute?.name || empty}
                      empty={!item.walkingRoute}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={Users}
                      label={t('reservations.totalCount')}
                      value={t('caravans.peopleCount', { count: n(item.totalCount) })}
                      tone="mint"
                    />
                    <FormFactTile
                      icon={Mars}
                      label={t('reservations.maleCount')}
                      value={t('caravans.peopleCount', { count: n(item.maleCount) })}
                      tone="ink"
                    />
                    <FormFactTile
                      icon={Venus}
                      label={t('reservations.femaleCount')}
                      value={t('caravans.peopleCount', { count: n(item.femaleCount) })}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={Users}
                      label={t('caravanPilgrimageHistory.memberCount')}
                      value={t('caravans.peopleCount', { count: n(item.memberCount) })}
                      tone="mint"
                    />
                    <FormFactTile
                      icon={Building2}
                      label={t('reservations.requestsAccommodationShort')}
                      value={
                        item.requestsAccommodation ? t('common.yes') : t('common.no')
                      }
                      tone="ink"
                    />
                    <FormFactTile
                      icon={Bus}
                      label={t('reservations.requestsBusShort')}
                      value={item.requestsBus ? t('common.yes') : t('common.no')}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={Shield}
                      label={t('reservations.permitTitle')}
                      value={t(`reservations.permitStatuses.${item.permitStatus}`)}
                      tone="mint"
                    />
                    <FormFactTile
                      icon={UserRound}
                      label={t('caravans.manager')}
                      value={item.caravanManager?.fullName || empty}
                      empty={!item.caravanManager}
                      tone="ink"
                    />
                    <FormFactTile
                      icon={Phone}
                      label={t('users.phone')}
                      value={
                        item.caravanManager?.phone ? (
                          <CopyableDigits
                            value={item.caravanManager.phone}
                            empty={empty}
                          />
                        ) : (
                          empty
                        )
                      }
                      empty={!item.caravanManager?.phone}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={CalendarCheck}
                      label={t('reservations.createdAt')}
                      value={<DateText value={item.createdAt} withTime />}
                      tone="ink"
                    />
                    <FormFactTile
                      icon={CalendarCheck}
                      label={t('reservations.completedAt')}
                      value={
                        item.completedAt ? (
                          <DateText value={item.completedAt} withTime />
                        ) : (
                          empty
                        )
                      }
                      empty={!item.completedAt}
                      tone="teal"
                    />
                    <FormFactTile
                      icon={Timer}
                      label={t('pilgrims.historyCompletionDuration')}
                      value={
                        item.completedAt
                          ? completionDurationLabel(
                              item.createdAt,
                              item.completedAt,
                              locale,
                              t,
                            ) || empty
                          : empty
                      }
                      empty={!item.completedAt}
                      tone="mint"
                    />
                  </div>
                </section>

                <Link to={reservationPath}>
                  <Button type="button" variant="soft">
                    <ClipboardCheck className="size-4" aria-hidden />
                    {t('pilgrims.viewReservation')}
                  </Button>
                </Link>
              </div>
            </FormCard>
          )
        })}

        {history ? (
          <PaginationBar
            page={history.page}
            pageSize={history.pageSize}
            total={history.total}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </div>
  )
}
