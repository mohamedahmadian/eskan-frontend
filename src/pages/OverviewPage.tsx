import {
  Footprints,
  MessageSquare,
  Plus,
  Send,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../lib/api'
import { cardClassName, listShellClassName } from '../components/ui/Form'
import { formatNumber } from '../lib/datetime'
import { usesDedicatedHomeDashboard, isAdmin, isLicenseIssuer } from '../lib/roles'
import { HeadquartersServiceYearsCard } from './dashboard/HeadquartersServiceYearsCard'
import { LicenseIssuerDashboard } from './dashboard/LicenseIssuerDashboard'
import { UserHomeDashboard } from './dashboard/UserHomeDashboard'

const quickTone = {
  teal: 'bg-teal-50 text-teal-700',
  gold: 'bg-gold-50 text-gold-600',
}

function QuickCard({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string
  icon: LucideIcon
  label: string
  tone: keyof typeof quickTone
}) {
  return (
    <Link
      to={to}
      className={`${cardClassName} flex flex-col items-center gap-3 px-4 py-6 text-center transition hover:-translate-y-0.5`}
    >
      <span className={`flex size-12 items-center justify-center rounded-2xl ${quickTone[tone]}`}>
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-medium text-ink-900">{label}</span>
    </Link>
  )
}

function AdminOverview() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get<{ pilgrims: number; caravans: number }>('/stats')
      return data
    },
  })

  return (
    <div className={`${listShellClassName} space-y-8`}>
      <HeadquartersServiceYearsCard />
      <section>
        <h2 className="mb-4 text-sm font-medium text-ink-500">{t('dashboard.quickAccess')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <QuickCard
            to="/pilgrims"
            icon={Users}
            label={t('dashboard.quickPilgrims')}
            tone="teal"
          />
          <QuickCard
            to="/pilgrims/new"
            icon={Plus}
            label={t('dashboard.quickNewPilgrim')}
            tone="gold"
          />
          <QuickCard
            to="/caravans"
            icon={Footprints}
            label={t('dashboard.quickCaravans')}
            tone="teal"
          />
          <QuickCard
            to="/caravans/new"
            icon={Plus}
            label={t('dashboard.quickNewCaravan')}
            tone="gold"
          />
          <QuickCard
            to="/users"
            icon={UserCog}
            label={t('modules.users')}
            tone="gold"
          />
          <QuickCard
            to="/sms/send"
            icon={Send}
            label={t('sms.sendTitle')}
            tone="teal"
          />
          <QuickCard
            to="/sms/settings"
            icon={MessageSquare}
            label={t('sms.settingsTitle')}
            tone="gold"
          />
          <QuickCard
            to="/settings"
            icon={Settings}
            label={t('nav.settings')}
            tone="teal"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-ink-500">{t('dashboard.statsTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className={`${cardClassName} flex items-center gap-4 p-5`}>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-sm text-ink-500">{t('dashboard.pilgrimCount')}</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">
                {stats.data ? formatNumber(stats.data.pilgrims, locale) : '—'}
              </p>
            </div>
          </article>
          <article className={`${cardClassName} flex items-center gap-4 p-5`}>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
              <Footprints className="size-5" />
            </span>
            <div>
              <p className="text-sm text-ink-500">{t('dashboard.caravanCount')}</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">
                {stats.data ? formatNumber(stats.data.caravans, locale) : '—'}
              </p>
            </div>
          </article>
        </div>
      </section>

      <p className={`${cardClassName} px-5 py-4 text-sm text-ink-700`}>
        {t('dashboard.internationalNote')}
      </p>
    </div>
  )
}

export function OverviewPage() {
  const { user } = useAuth()
  if (!isAdmin(user) && isLicenseIssuer(user)) {
    return <LicenseIssuerDashboard />
  }
  if (usesDedicatedHomeDashboard(user)) {
    return <UserHomeDashboard />
  }
  return <AdminOverview />
}
