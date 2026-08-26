import {
  Accessibility,
  Building2,
  Bus,
  CalendarCheck,
  CalendarRange,
  ClipboardCheck,
  CreditCard,
  Footprints,
  History,
  MapPin,
  Phone,
  Shield,
  Smartphone,
  Tent,
  Timer,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  cardClassName,
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
import { elapsedDurationParts, formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type {
  ManagedUser,
  Paginated,
  PilgrimPilgrimageHistoryItem,
} from '../../types/app'
import {
  InsuranceStatusBadge,
  ReservationStatusBadge,
  ReservationTypeBadge,
} from '../reservations/ReservationStatusBadge'
import { RoleUserProfileHeader } from '../users/RoleUserProfileHeader'

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
  if (parts.minutes > 0) {
    chunks.push(t('reservations.elapsedMinute', { count: n(parts.minutes) }))
  }
  if (chunks.length === 0) {
    chunks.push(t('reservations.elapsedSecond', { count: n(parts.seconds) }))
  }
  return chunks.join(t('reservations.elapsedJoin'))
}

export function PilgrimPilgrimageHistoryPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const { page, setPage } = useListParams()
  const geoName = useGeoName()
  const empty = t('reservations.notEntered')

  const pilgrimQuery = useQuery({
    queryKey: ['pilgrims', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`/pilgrims/${id}`)
      return data
    },
  })

  const historyQuery = useQuery({
    queryKey: ['pilgrims', id, 'pilgrimage-history', page],
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<PilgrimPilgrimageHistoryItem>>(
        `/pilgrims/${id}/pilgrimage-history`,
        { params: { page } },
      )
      return data
    },
  })

  const pilgrim = pilgrimQuery.data
  const history = historyQuery.data

  if (!pilgrim) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('pilgrims.details')}
        subtitle={<EntityNameSubtitle name={pilgrim.fullName} icon={UserRound} />}
      />

      <section className={`${cardClassName} overflow-hidden`}>
        <RoleUserProfileHeader user={pilgrim} hideRoles />
      </section>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <History className="size-4" aria-hidden />
          </span>
          <h3 className="text-sm font-semibold text-ink-800">
            {t('pilgrims.pilgrimageHistory')}
          </h3>
        </div>

        {historyQuery.isLoading && !history ? <LoadingState /> : null}

        {history && history.total === 0 ? (
          <FormEmptyHint>{t('pilgrims.historyEmpty')}</FormEmptyHint>
        ) : null}

        {history?.items.map((item) => {
          const n = (value: number) => formatNumber(value, locale)
          const nights = stayNightCount(item.stayStartDate, item.stayEndDate)
          const manager =
            item.caravan?.manager ?? item.caravanManager ?? item.group?.manager ?? null
          const partyIcon: LucideIcon =
            item.type === 'CARAVAN' ? Tent : item.type === 'GROUP' ? Users : UserRound
          const partyTitle =
            item.type === 'CARAVAN'
              ? item.caravan?.name || t('reservations.types.CARAVAN')
              : item.type === 'GROUP'
                ? item.group?.name || t('reservations.types.GROUP')
                : t('reservations.typeFull.INDIVIDUAL')
          const partyCity =
            item.type === 'CARAVAN'
              ? item.caravan?.city
              : item.type === 'GROUP'
                ? item.group?.city
                : null

          return (
            <FormCard
              key={item.id}
              icon={partyIcon}
              title={partyTitle}
              subtitle={t('reservations.year') + ' ' + n(item.year)}
              chips={
                <>
                  <ReservationTypeBadge type={item.type} />
                  <ReservationStatusBadge status={item.status} />
                  {item.insuranceStatus ? (
                    <InsuranceStatusBadge status={item.insuranceStatus} />
                  ) : null}
                </>
              }
            >
              <div className="space-y-6 p-5 sm:p-6">
                {item.type !== 'INDIVIDUAL' ? (
                  <section>
                    <FormSectionTitle icon={partyIcon}>
                      {item.type === 'CARAVAN'
                        ? t('pilgrims.historyCaravan')
                        : t('pilgrims.historyGroup')}
                    </FormSectionTitle>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      <FormFactTile
                        icon={partyIcon}
                        label={
                          item.type === 'CARAVAN'
                            ? t('caravans.name')
                            : t('groups.name')
                        }
                        value={partyTitle}
                        tone="teal"
                      />
                      <FormFactTile
                        icon={MapPin}
                        label={
                          item.type === 'CARAVAN' ? t('caravans.city') : t('groups.city')
                        }
                        value={partyCity ? geoName(partyCity) : empty}
                        empty={!partyCity}
                        tone="mint"
                      />
                      <FormFactTile
                        icon={UserRound}
                        label={
                          item.type === 'CARAVAN'
                            ? t('caravans.manager')
                            : t('groups.manager')
                        }
                        value={manager?.fullName || empty}
                        empty={!manager}
                        tone="ink"
                      />
                      <FormFactTile
                        icon={Phone}
                        label={t('users.phone')}
                        value={
                          manager?.phone ? (
                            <CopyableDigits value={manager.phone} empty={empty} />
                          ) : item.caravan?.officePhone ? (
                            localizeDigits(item.caravan.officePhone, locale)
                          ) : (
                            empty
                          )
                        }
                        empty={!manager?.phone && !item.caravan?.officePhone}
                        tone="teal"
                      />
                      {item.type === 'CARAVAN' && item.caravan?.licenseNumber ? (
                        <FormFactTile
                          icon={ClipboardCheck}
                          label={t('caravans.licenseNumber')}
                          value={localizeDigits(item.caravan.licenseNumber, locale)}
                          tone="mint"
                        />
                      ) : null}
                      {item.type === 'CARAVAN' && item.caravan?.foundedYear ? (
                        <FormFactTile
                          icon={CalendarCheck}
                          label={t('caravans.foundedYear')}
                          value={n(item.caravan.foundedYear)}
                          tone="ink"
                        />
                      ) : null}
                    </div>
                  </section>
                ) : null}

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
                      value={nights ? t('reservations.stayNights', { count: n(nights) }) : empty}
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
                      icon={Smartphone}
                      label={t('reservations.requestsSimCardShort')}
                      value={item.requestsSimCard ? t('common.yes') : t('common.no')}
                      tone="mint"
                    />
                    <FormFactTile
                      icon={CreditCard}
                      label={t('reservations.requestsBankCardShort')}
                      value={item.requestsBankCard ? t('common.yes') : t('common.no')}
                      tone="ink"
                    />
                    <FormFactTile
                      icon={Accessibility}
                      label={t('reservations.specialServices')}
                      value={item.specialServices?.trim() || empty}
                      empty={!item.specialServices?.trim()}
                      tone="teal"
                    />
                    {item.type === 'CARAVAN' ? (
                      <FormFactTile
                        icon={Shield}
                        label={t('reservations.permitTitle')}
                        value={t(`reservations.permitStatuses.${item.permitStatus}`)}
                        tone="mint"
                      />
                    ) : null}
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

                <Link to={`/reservations/${item.id}`}>
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
