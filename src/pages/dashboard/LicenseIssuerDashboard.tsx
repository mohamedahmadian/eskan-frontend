import { Building, FileCheck, Phone, Stamp, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { cardClassName, listShellClassName } from '../../components/ui/Form'

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

export function LicenseIssuerDashboard() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const organization = user?.issuingOrganization

  return (
    <div className={`${listShellClassName} space-y-8`}>
      <section className={`${cardClassName} overflow-hidden`}>
        <div className="h-1.5 bg-gradient-to-l from-teal-400 to-mint-300" />
        <div className="flex items-start gap-3 px-5 py-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Stamp className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900">
              {t('dashboard.welcomeUser', { name: user?.fullName ?? '' })}
            </h2>
            <p className="mt-1 text-sm text-ink-500">{t('dashboard.licenseSubtitle')}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink-500">{t('dashboard.licenseOrganization')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className={`${cardClassName} flex items-center gap-4 p-5`}>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Building className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink-500">{t('dashboard.organizationName')}</p>
              <p className="mt-1 truncate text-lg font-semibold text-ink-900">
                {organization?.name || '—'}
              </p>
            </div>
          </article>
          <article className={`${cardClassName} flex items-center gap-4 p-5`}>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
              <Phone className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink-500">{t('dashboard.organizationPhone')}</p>
              <p className="mt-1 truncate text-lg font-semibold text-ink-900" dir="ltr">
                {organization?.phone ? localizeDigits(organization.phone, locale) : '—'}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-ink-500">{t('dashboard.quickAccess')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            to="/licenses/new"
            icon={Stamp}
            label={t('menus.issueLicense')}
            tone="teal"
          />
          <ActionCard
            to="/licenses/issued"
            icon={FileCheck}
            label={t('menus.issuedLicenses')}
            tone="mint"
          />
        </div>
      </section>
    </div>
  )
}
