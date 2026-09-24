import {
  CalendarDays,
  DoorOpen,
  Flag,
  Footprints,
  HandHeart,
  HeartHandshake,
  History,
  IdCard,
  MapPin,
  Plus,
  ScrollText,
  Tent,
  Trash2,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { Button, cardClassName, listShellClassName } from '../../components/ui/Form'
import { FormFactTile } from '../../components/ui/FormLayout'
import { RoleBadges } from '../../components/ui/RoleBadges'
import { DateText } from '../../components/ui/DateText'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import { useCaravanCreateQuota } from '../caravans/caravan-create-quota'
import { useGeoName } from '../../lib/geo'
import { publicProfilePath } from '../../lib/public-profile'
import {
  hasNoRoles,
  isAccommodationManager,
  isCaravanManager,
  isHonoraryServant,
  isPilgrim,
} from '../../lib/roles'
import type {
  ReservationListItem,
  UserHomeCaravan,
  UserHomeCaravanManager,
  UserHomeDashboard as UserHomeDashboardData,
  UserHomePilgrim,
  UserHomeReservationTotals,
} from '../../types/app'
import {
  canOwnerHardDelete,
  createWizardPath,
  isOwnerCreateDraft,
} from '../reservations/reservation-steps'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { ReservationStatusBadge } from '../reservations/ReservationStatusBadge'
import { useDeleteOwnerDraft } from '../reservations/useDeleteOwnerDraft'
import { HeadquartersServiceYearsCard } from './HeadquartersServiceYearsCard'
import { PilgrimCardModal } from './PilgrimCardModal'
import { ManagerLatestCaravanCard } from './ManagerLatestCaravanCard'
import { PilgrimageRouteCard } from './PilgrimageRouteCard'
import { UserLocationCard } from './UserLocationCard'

const emptyTotals = { all: 0, inProgress: 0, pendingReview: 0, completed: 0 }

const actionTone = {
  teal: 'bg-teal-50 text-teal-700',
  mint: 'bg-mint-100 text-mint-600',
}

function ActionCard({
  to,
  onClick,
  icon: Icon,
  label,
  tone,
  pulse = false,
}: {
  to?: string
  onClick?: () => void
  icon: LucideIcon
  label: string
  tone: keyof typeof actionTone
  pulse?: boolean
}) {
  const className = `${cardClassName} flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-start transition hover:-translate-y-0.5 ${
    pulse ? 'tasharof-card' : ''
  }`
  const body = (
    <>
      <span className={`flex size-11 items-center justify-center rounded-2xl ${actionTone[tone]}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 text-sm font-medium leading-6 text-ink-900">{label}</span>
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}

function StatTile({
  label,
  value,
  locale,
}: {
  label: string
  value: number
  locale: string
}) {
  return (
    <article className={`${cardClassName} p-4`}>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink-900">{formatNumber(value, locale)}</p>
    </article>
  )
}

function ReservationTotals({
  totals,
  locale,
}: {
  totals: UserHomeReservationTotals
  locale: string
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label={t('reservations.dashboardAll')} value={totals.all} locale={locale} />
      <StatTile
        label={t('reservations.dashboardInProgress')}
        value={totals.inProgress}
        locale={locale}
      />
      <StatTile
        label={t('reservations.dashboardPending')}
        value={totals.pendingReview}
        locale={locale}
      />
      <StatTile
        label={t('reservations.dashboardCompleted')}
        value={totals.completed}
        locale={locale}
      />
    </div>
  )
}

function ReservationRow({ row }: { row: ReservationListItem }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const deleteDraft = useDeleteOwnerDraft()
  const isDraft = isOwnerCreateDraft(row)
  const canDelete = canOwnerHardDelete(row, user?.id)
  const canContinue =
    row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && row.status !== 'REJECTED'
  const continueTo = isDraft ? createWizardPath(row.id) : `/my-reservations/${row.id}`
  const TypeIcon = row.type === 'CARAVAN' ? Tent : row.type === 'GROUP' ? Users : UserRound
  const partyName = row.caravan?.name ?? row.group?.name ?? null
  const origin = row.originCity ? nameOf(row.originCity) : ''
  const empty = '—'
  return (
    <li className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/60 to-white p-3.5 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
            <TypeIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ReservationCodeBadge code={row.code} size="sm" />
              <ReservationStatusBadge status={row.status} />
            </div>
            <p className="truncate text-sm font-semibold text-ink-900">
              {partyName || t(`reservations.types.${row.type}`)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link to={continueTo}>
            <Button type="button" variant={canContinue ? 'primary' : 'ghost'}>
              <ScrollText className="size-4" aria-hidden />
              {isDraft
                ? t('reservations.draftResume')
                : canContinue
                  ? t('dashboard.continueFile')
                  : t('common.view')}
            </Button>
          </Link>
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() =>
                deleteDraft(row.id, undefined, row.status === 'CANCELLED' ? 'cancelled' : 'draft')
              }
            >
              <Trash2 className="size-4" aria-hidden />
              {t('reservations.deleteDraft')}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <FormFactTile
          icon={TypeIcon}
          label={t('dashboard.latestFileKind')}
          value={t(`reservations.types.${row.type}`)}
          tone="teal"
          compact
        />
        <FormFactTile
          icon={CalendarDays}
          label={t('dashboard.latestFileYear')}
          value={formatNumber(row.year, locale)}
          tone="mint"
          compact
        />
        <FormFactTile
          icon={MapPin}
          label={t('reservations.originCity')}
          value={origin || empty}
          empty={!origin}
          tone="ink"
          compact
        />
        <FormFactTile
          icon={Flag}
          label={t('dashboard.latestFileArrival')}
          value={row.stayStartDate ? <DateText value={row.stayStartDate} /> : empty}
          empty={!row.stayStartDate}
          tone="teal"
          compact
        />
        {row.stayEndDate ? (
          <FormFactTile
            icon={DoorOpen}
            label={t('dashboard.latestFileDeparture')}
            value={<DateText value={row.stayEndDate} />}
            tone="mint"
            compact
          />
        ) : null}
      </div>
    </li>
  )
}

function ReservationList({
  items,
  empty,
}: {
  items: ReservationListItem[]
  empty: string
}) {
  if (!items.length) {
    return <p className="text-sm text-ink-500">{empty}</p>
  }
  return (
    <ul className="space-y-3">
      {items.map((row) => (
        <ReservationRow key={row.id} row={row} />
      ))}
    </ul>
  )
}

function PilgrimSection({ data, locale }: { data: UserHomePilgrim; locale: string }) {
  const { t } = useTranslation()
  return (
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <UserRound className="size-4 text-teal-600" aria-hidden />
          {t('dashboard.pilgrimSection')}
        </h2>
        <p className="mt-1 text-xs text-ink-400">{t('dashboard.pilgrimHint')}</p>
      </div>
      <ReservationTotals totals={data.totals} locale={locale} />
      {data.recent.length ? (
        <article className={`${cardClassName} p-5`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-ink-700">{t('dashboard.recentFiles')}</h3>
            <Link to="/my-reservations" className="text-sm text-teal-700 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <ReservationList items={data.recent} empty={t('reservations.empty')} />
        </article>
      ) : null}
    </section>
  )
}

function CaravanRow({ caravan }: { caravan: UserHomeCaravan }) {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  return (
    <li className="flex flex-col gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-ink-900">{caravan.name}</p>
        <p className="text-xs text-ink-500">
          {nameOf(caravan.city)} · {caravan.isActive ? t('geo.active') : t('geo.inactive')}
        </p>
      </div>
      <Link to={`/my-caravans/${caravan.id}/pilgrimage-history`} className="shrink-0">
        <Button type="button" variant="soft">
          <History className="size-4" aria-hidden />
          {t('dashboard.openHistory')}
        </Button>
      </Link>
    </li>
  )
}

function ManagerSection({ data, locale }: { data: UserHomeCaravanManager; locale: string }) {
  const { t } = useTranslation()
  const quota = useCaravanCreateQuota()
  return (
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <Tent className="size-4 text-teal-600" aria-hidden />
          {t('dashboard.managerSection')}
        </h2>
        <p className="mt-1 text-xs text-ink-400">{t('dashboard.managerHint')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {quota.data?.allowed !== false ? (
          <ActionCard
            to="/my-caravans/new"
            icon={Plus}
            label={t('caravans.create')}
            tone="teal"
          />
        ) : null}
        <ActionCard
          to="/my-caravans"
          icon={Tent}
          label={t('dashboard.quickMyCaravans')}
          tone="mint"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('dashboard.quickMyCaravans')} value={data.caravanCount} locale={locale} />
        <StatTile label={t('dashboard.activeCaravans')} value={data.activeCaravanCount} locale={locale} />
        <StatTile label={t('dashboard.caravanFiles')} value={data.totals.all} locale={locale} />
        <StatTile
          label={t('reservations.dashboardInProgress')}
          value={data.totals.inProgress}
          locale={locale}
        />
      </div>
      <article className={`${cardClassName} p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-ink-700">{t('dashboard.recentCaravans')}</h3>
          <Link to="/my-caravans" className="text-sm text-teal-700 hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        {data.recentCaravans.length ? (
          <ul>
            {data.recentCaravans.map((caravan) => (
              <CaravanRow key={caravan.id} caravan={caravan} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">{t('myCaravans.empty')}</p>
        )}
      </article>
      {data.recentReservations.length ? (
        <article className={`${cardClassName} p-5`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-ink-700">{t('dashboard.recentCaravanFiles')}</h3>
            <Link to="/my-reservations" className="text-sm text-teal-700 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <ReservationList items={data.recentReservations} empty={t('reservations.empty')} />
        </article>
      ) : null}
    </section>
  )
}

export function UserHomeDashboard() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const showPilgrim = isPilgrim(user)
  const showManager = isCaravanManager(user)
  const showStarter = hasNoRoles(user)
  const showPilgrimHome = showPilgrim || showStarter
  const [cardOpen, setCardOpen] = useState(false)
  const isManagerUser = isCaravanManager(user) || isAccommodationManager(user)
  const showIdCard = showPilgrimHome || isManagerUser
  const showHonorary = isHonoraryServant(user)
  const honoraryServices = user?.honoraryServices ?? []
  const showAssignedFiles = honoraryServices.length > 0
  const showRouteHome = showPilgrim || showManager
  const query = useQuery({
    queryKey: ['reservations', 'mine', 'home', user?.id],
    enabled: showRouteHome,
    queryFn: async () => {
      const { data } = await api.get<UserHomeDashboardData>('/reservations/mine/home')
      return data
    },
  })

  const latestFile = showRouteHome
    ? query.data?.pilgrim?.recent[0] ?? query.data?.caravanManager?.recentReservations[0]
    : undefined
  const walkingRouteId = latestFile?.walkingRoute?.id
  const managerFile = showManager ? query.data?.caravanManager?.recentReservations[0] : undefined
  const hasCurrentYearFile = query.data?.hasCurrentYearFile === true
  const showQuickActions = !hasCurrentYearFile && !(showRouteHome && query.isLoading)

  return (
    <div className={`${listShellClassName} flex flex-1 flex-col gap-8`}>
      <section className={`${cardClassName} overflow-hidden`}>
        <div className="h-1.5 bg-gradient-to-e from-teal-400 to-mint-300" />
        <div className="flex items-start gap-3 px-5 py-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            {showManager && !showPilgrim ? (
              <Footprints className="size-5" aria-hidden />
            ) : (
              <UserRound className="size-5" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900">
              {t('dashboard.welcomeUser', { name: user?.fullName ?? '' })}
            </h2>
            {showPilgrim || showHonorary ? <RoleBadges roles={user?.roles} /> : null}
            {showPilgrimHome ? (
              <p className="mt-1 text-sm text-ink-500">{t('dashboard.pilgrimWelcome')}</p>
            ) : (
              <p className="mt-1 text-sm text-ink-500">
                {t(
                  showHonorary && !showManager
                    ? 'dashboard.honorarySubtitle'
                    : 'dashboard.userSubtitle',
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      {showHonorary ? (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-ink-800">{t('dashboard.honoraryServices')}</h3>
            <p className="mt-0.5 text-xs text-ink-500">{t('dashboard.honoraryServicesHint')}</p>
          </div>
          {honoraryServices.length ? (
            <div className="flex flex-wrap gap-2">
              {honoraryServices.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-sm font-medium text-mint-800 ring-1 ring-mint-100"
                >
                  <HeartHandshake className="size-3.5" aria-hidden />
                  {item.name}
                </span>
              ))}
            </div>
          ) : (
            <p className={`${cardClassName} px-4 py-3 text-sm text-ink-600`}>
              {t('dashboard.honoraryServicesEmpty')}
            </p>
          )}
          {showAssignedFiles ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionCard
                to="/translator-reservations"
                icon={HandHeart}
                label={t('dashboard.translatorFiles')}
                tone="teal"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {showQuickActions ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {showPilgrimHome ? (
              <>
                <ActionCard
                  to="/my-reservations/new"
                  icon={CalendarDays}
                  label={t('dashboard.tasharofCurrentYear', {
                    year: formatNumber(currentPersianYear(), locale),
                  })}
                  tone="teal"
                  pulse
                />
                <ActionCard
                  to="/my-reservations"
                  icon={ScrollText}
                  label={t('dashboard.quickMyFiles')}
                  tone="mint"
                />
              </>
            ) : null}
            {user?.id ? (
              showIdCard ? (
                <ActionCard
                  onClick={() => setCardOpen(true)}
                  icon={IdCard}
                  label={t(isManagerUser ? 'dashboard.quickManagerCard' : 'dashboard.quickPilgrimCard')}
                  tone="teal"
                />
              ) : (
                <ActionCard
                  to={publicProfilePath(user.id)}
                  icon={IdCard}
                  label={t('dashboard.quickPublicCard')}
                  tone="teal"
                />
              )
            ) : null}
            <ActionCard
              to="/honorary-apply"
              icon={HandHeart}
              label={t('dashboard.honoraryApplyServant')}
              tone="mint"
            />
          </div>
        </section>
      ) : null}

      {showManager && managerFile?.caravan ? (
        <ManagerLatestCaravanCard
          reservationId={managerFile.id}
          caravanId={managerFile.caravan.id}
          fileCode={managerFile.code}
        />
      ) : null}

      {showRouteHome && walkingRouteId && latestFile ? (
        <PilgrimageRouteCard
          routeId={walkingRouteId}
          reservationId={latestFile.id}
          file={latestFile}
        />
      ) : showRouteHome ? (
        <UserLocationCard />
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-ink-500">{t('common.loading')}</p>
      ) : query.isError ? (
        <p className={`${cardClassName} px-5 py-4 text-sm text-ink-700`}>{t('common.error')}</p>
      ) : (
        <>
          {showPilgrim ? (
            <PilgrimSection
              data={query.data?.pilgrim ?? { totals: emptyTotals, recent: [] }}
              locale={locale}
            />
          ) : null}
          {showManager ? (
            <ManagerSection
              data={
                query.data?.caravanManager ?? {
                  caravanCount: 0,
                  activeCaravanCount: 0,
                  totals: emptyTotals,
                  recentCaravans: [],
                  recentReservations: [],
                }
              }
              locale={locale}
            />
          ) : null}
        </>
      )}

      <HeadquartersServiceYearsCard />
      {cardOpen ? (
        <PilgrimCardModal
          variant={isManagerUser ? 'manager' : 'pilgrim'}
          onClose={() => setCardOpen(false)}
        />
      ) : null}
    </div>
  )
}
