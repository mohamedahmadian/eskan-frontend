import {
  Building2,
  Flag,
  IdCard,
  MapPin,
  Mars,
  MessageCircle,
  Phone,
  Route,
  Share2,
  UserRound,
  Users,
  UsersRound,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  cardClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isAdmin } from '../../lib/roles'
import type { Group } from '../../types/app'

type Tone = 'teal' | 'mint' | 'ink'

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
    icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
  },
  mint: {
    wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
    icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(95,191,122,0.24)]',
  },
  ink: {
    wrap: 'border-line bg-gradient-to-b from-cream-50 to-white',
    icon: 'bg-ink-700 text-white',
  },
}

export function GroupDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { confirmDelete } = useConfirmDelete()
  const fromMine = useLocation().pathname.startsWith('/my-groups')
  const listPath = fromMine ? '/my-groups' : '/groups'
  const query = useQuery({
    queryKey: ['group', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Group>(`/groups/${id}`)
      return data
    },
  })

  const group = query.data
  if (!group) {
    return <LoadingState />
  }

  const country = group.city?.province?.country
    ? nameOf(group.city.province.country)
    : ''
  const province = group.city?.province ? nameOf(group.city.province) : ''
  const city = group.city ? nameOf(group.city) : ''
  const empty = '—'

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('groups.details')}
        subtitle={<EntityNameSubtitle name={group.name} icon={UsersRound} />}
      />

      <section className={`${cardClassName} overflow-hidden`}>
        <header className="relative overflow-hidden bg-gradient-to-l from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
          <div
            className="pointer-events-none absolute -start-8 -top-10 size-32 rounded-full bg-teal-200/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -end-6 -bottom-12 size-28 rounded-full bg-mint-100/70"
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <UsersRound className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-ink-900">{group.name}</h2>
              <p className="mt-1 text-xs leading-6 text-ink-600">
                {t('groups.detailsSubtitle')}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {city ? <MetaChip icon={MapPin} label={city} /> : null}
                <MetaChip
                  icon={Users}
                  label={t('groups.peopleCount', { count: n(group.totalCount) })}
                />
                {group.manager ? (
                  <MetaChip icon={UserRound} label={group.manager.fullName} />
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <SectionTitle icon={Users}>{t('groups.sectionCounts')}</SectionTitle>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <MetricTile
                icon={Mars}
                label={t('groups.maleCount')}
                value={n(group.maleCount)}
                unit={t('groups.people')}
                tone="teal"
              />
              <MetricTile
                icon={Venus}
                label={t('groups.femaleCount')}
                value={n(group.femaleCount)}
                unit={t('groups.people')}
                tone="mint"
              />
              <MetricTile
                icon={Users}
                label={t('groups.totalCount')}
                value={n(group.totalCount)}
                unit={t('groups.people')}
                tone="ink"
              />
            </div>
          </section>

          <section>
            <SectionTitle icon={MapPin}>{t('groups.sectionLocation')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
              <FactTile
                icon={Flag}
                label={t('geo.country')}
                value={country || empty}
                empty={!country}
                tone="teal"
              />
              <FactTile
                icon={MapPin}
                label={t('geo.province')}
                value={province || empty}
                empty={!province}
                tone="mint"
              />
              <FactTile
                icon={Building2}
                label={t('groups.city')}
                value={city || empty}
                empty={!city}
                tone="ink"
              />
            </div>
            <div className="mt-2 sm:mt-3">
              <FactTile
                icon={Route}
                label={t('groups.walkingRoute')}
                value={group.walkingRoute?.name || empty}
                empty={!group.walkingRoute}
                tone="teal"
              />
            </div>
          </section>

          <section>
            <SectionTitle icon={UserRound}>{t('groups.sectionManager')}</SectionTitle>
            {group.manager ? (
              <article className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-sm font-bold text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
                    {personInitials(group.manager.firstName, group.manager.lastName)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-sm font-semibold text-ink-900">
                      {group.manager.fullName}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FactTile
                        icon={IdCard}
                        label={t('users.nationalId')}
                        value={<CopyableDigits value={group.manager.nationalId} empty={empty} />}
                        empty={!group.manager.nationalId}
                        tone="teal"
                      />
                      <FactTile
                        icon={Phone}
                        label={t('users.phone')}
                        value={<CopyableDigits value={group.manager.phone} empty={empty} />}
                        empty={!group.manager.phone}
                        tone="mint"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <EmptyHint>{t('groups.managerEmpty')}</EmptyHint>
            )}
          </section>

          <section>
            <SectionTitle icon={Share2}>{t('groups.sectionSocial')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FactTile
                icon={MessageCircle}
                label={t('groups.eitaa')}
                value={group.eitaa || empty}
                empty={!group.eitaa}
                tone="teal"
              />
              <FactTile
                icon={MessageCircle}
                label={t('groups.bale')}
                value={group.bale || empty}
                empty={!group.bale}
                tone="mint"
              />
              <FactTile
                icon={Share2}
                label={t('groups.telegram')}
                value={group.telegram || empty}
                empty={!group.telegram}
                tone="ink"
              />
              <FactTile
                icon={Share2}
                label={t('groups.instagram')}
                value={group.instagram || empty}
                empty={!group.instagram}
                tone="teal"
              />
            </div>
          </section>
        </div>

        <div className="border-t border-line px-5 py-4 sm:px-6">
          <DetailActions
            className=""
            editTo={`${listPath}/${group.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={isAdmin(user) ? t('groups.delete') : undefined}
            onDelete={
              isAdmin(user)
                ? () =>
                    confirmDelete({
                      message: t('groups.confirmDelete'),
                      successMessage: t('groups.deleted'),
                      path: `/groups/${group.id}`,
                      queryKey: ['groups'],
                      onDeleted: () => navigate(listPath),
                    })
                : undefined
            }
          />
        </div>
      </section>
    </div>
  )
}

function personInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}` || '؟'
}

function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-teal-100">
      <Icon className="size-3 text-teal-600" aria-hidden />
      {label}
    </span>
  )
}

function SectionTitle({
  icon: Icon,
  children,
  className = 'mb-2.5',
}: {
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={`inline-flex items-center gap-2 text-xs font-semibold text-ink-600 ${className}`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {children}
    </h3>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${colors.wrap}`}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${colors.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
      <p className="text-[10px] text-ink-400">{unit}</p>
    </article>
  )
}

function FactTile({
  icon: Icon,
  label,
  value,
  empty,
  tone,
  className = '',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  empty?: boolean
  tone: Tone
  className?: string
}) {
  const colors = toneClass[tone]
  return (
    <article
      className={`relative z-10 flex items-start gap-3 rounded-2xl border px-3 py-3 ${colors.wrap} ${className}`}
    >
      <span
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-500">{label}</p>
        <div
          className={`mt-0.5 text-sm font-semibold break-words ${
            empty ? 'text-ink-400' : 'text-ink-900'
          }`}
        >
          {value}
        </div>
      </div>
    </article>
  )
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line bg-cream-50 px-4 py-6 text-center text-sm text-ink-400">
      {children}
    </p>
  )
}
