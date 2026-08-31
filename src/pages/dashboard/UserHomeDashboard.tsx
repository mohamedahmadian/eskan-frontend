import {
  Footprints,
  History,
  Plus,
  ScrollText,
  Tent,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { Button, cardClassName, listShellClassName } from '../../components/ui/Form'
import { RoleBadges } from '../../components/ui/RoleBadges'
import { DateText } from '../../components/ui/DateText'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isCaravanManager, isPilgrim } from '../../lib/roles'
import type {
  ReservationListItem,
  UserHomeCaravan,
  UserHomeCaravanManager,
  UserHomeDashboard as UserHomeDashboardData,
  UserHomePilgrim,
  UserHomeReservationTotals,
} from '../../types/app'
import { createWizardPath, isOwnerCreateDraft } from '../reservations/reservation-steps'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { ReservationStatusBadge } from '../reservations/ReservationStatusBadge'
import { useDeleteOwnerDraft } from '../reservations/useDeleteOwnerDraft'
import { HeadquartersServiceYearsCard } from './HeadquartersServiceYearsCard'
import { PilgrimageRouteCard } from './PilgrimageRouteCard'
import { UserLocationCard } from './UserLocationCard'

const emptyTotals = { all: 0, inProgress: 0, pendingReview: 0, completed: 0 }

const actionTone = {
  teal: 'bg-teal-50 text-teal-700',
  mint: 'bg-mint-100 text-mint-600',
}

function ActionCard({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string
  icon: LucideIcon
  label: string
  tone: keyof typeof actionTone
}) {
  return (
    <Link
      to={to}
      className={`${cardClassName} flex items-center gap-3 px-4 py-4 transition hover:-translate-y-0.5`}
    >
      <span className={`flex size-11 items-center justify-center rounded-2xl ${actionTone[tone]}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-medium text-ink-900">{label}</span>
    </Link>
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
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const deleteDraft = useDeleteOwnerDraft()
  const isDraft = isOwnerCreateDraft(row)
  const canContinue =
    row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && row.status !== 'REJECTED'
  const continueTo = isDraft ? createWizardPath(row.id) : `/my-reservations/${row.id}`
  return (
    <li className="flex flex-col gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <ReservationCodeBadge code={row.code} size="md" />
          <p className="font-medium text-ink-900">
            {t(`reservations.types.${row.type}`)} · {formatNumber(row.year, locale)}
          </p>
        </div>
        <p className="text-xs text-ink-500">
          {nameOf(row.originCity)}
          {row.stayStartDate ? (
            <>
              {' · '}
              <DateText value={row.stayStartDate} />
            </>
          ) : null}
        </p>
        <ReservationStatusBadge status={row.status} />
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
        {isDraft ? (
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => deleteDraft(row.id)}
          >
            <Trash2 className="size-4" aria-hidden />
            {t('reservations.deleteDraft')}
          </Button>
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
    <ul>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          to="/my-reservations/new"
          icon={Plus}
          label={t('dashboard.quickNewFile')}
          tone="teal"
        />
        <ActionCard
          to="/my-reservations"
          icon={ScrollText}
          label={t('dashboard.quickMyFiles')}
          tone="mint"
        />
      </div>
      <ReservationTotals totals={data.totals} locale={locale} />
      <article className={`${cardClassName} p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-ink-700">{t('dashboard.recentFiles')}</h3>
          <Link to="/my-reservations" className="text-sm text-teal-700 hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <ReservationList items={data.recent} empty={t('reservations.empty')} />
      </article>
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
        <ActionCard
          to="/my-caravans/new"
          icon={Plus}
          label={t('caravans.create')}
          tone="teal"
        />
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
      <article className={`${cardClassName} p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-ink-700">{t('dashboard.recentCaravanFiles')}</h3>
          <Link to="/my-reservations" className="text-sm text-teal-700 hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <ReservationList items={data.recentReservations} empty={t('reservations.empty')} />
      </article>
    </section>
  )
}

export function UserHomeDashboard() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const showPilgrim = isPilgrim(user)
  const showManager = isCaravanManager(user)
  const query = useQuery({
    queryKey: ['reservations', 'mine', 'home'],
    queryFn: async () => {
      const { data } = await api.get<UserHomeDashboardData>('/reservations/mine/home')
      return data
    },
  })

  const latestFile =
    query.data?.pilgrim?.recent[0] ?? query.data?.caravanManager?.recentReservations[0]
  const walkingRouteId = latestFile?.walkingRoute?.id

  return (
    <div className={`${listShellClassName} space-y-8`}>
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
            {showPilgrim ? <RoleBadges roles={user?.roles} /> : null}
            <p className="mt-1 text-sm text-ink-500">{t('dashboard.userSubtitle')}</p>
          </div>
        </div>
      </section>

      {walkingRouteId && latestFile ? (
        <PilgrimageRouteCard routeId={walkingRouteId} reservationId={latestFile.id} />
      ) : showPilgrim || showManager ? (
        <div className="w-full md:w-1/2">
          <UserLocationCard />
        </div>
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
    </div>
  )
}
