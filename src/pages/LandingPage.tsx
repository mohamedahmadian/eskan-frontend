import { ArrowLeft, HandHeart, ScrollText, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthGuestLayout } from '../components/auth/AuthGuestLayout'
import { cardClassName } from '../components/ui/Form'
import { withNext } from '../lib/auth-redirect'

const HONORARY_APPLY_PATH = '/honorary-apply'
const PILGRIMAGE_PATH = '/my-reservations/new'

function CapabilityCard({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string
  icon: LucideIcon
  title: string
  hint: string
}) {
  return (
    <Link
      to={to}
      className={`${cardClassName} group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 group-hover:bg-mint-500 group-hover:text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-ink-900">{title}</span>
        <span className="mt-1 block text-sm leading-7 text-ink-500">{hint}</span>
      </span>
      <ArrowLeft className="mt-1 size-4 shrink-0 text-ink-300 ltr:rotate-180 group-hover:text-teal-600" aria-hidden />
    </Link>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const volunteerTo = user ? HONORARY_APPLY_PATH : withNext('/register', HONORARY_APPLY_PATH)
  const pilgrimageTo = user ? PILGRIMAGE_PATH : withNext('/register', PILGRIMAGE_PATH)

  return (
    <AuthGuestLayout full showAuthLinks>
      <div className="space-y-8 py-4 sm:py-8">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-semibold text-ink-900 sm:text-3xl">{t('landing.heroTitle')}</h1>
          <p className="mt-3 text-sm leading-8 text-ink-500 sm:text-base">{t('landing.heroSubtitle')}</p>
        </section>
        <section>
          <h2 className="mb-4 text-center text-sm font-medium text-ink-500">{t('landing.capabilities')}</h2>
          <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            <CapabilityCard
              to={volunteerTo}
              icon={HandHeart}
              title={t('landing.volunteer.title')}
              hint={t('landing.volunteer.hint')}
            />
            <CapabilityCard
              to={pilgrimageTo}
              icon={ScrollText}
              title={t('landing.pilgrimage.title')}
              hint={t('landing.pilgrimage.hint')}
            />
          </div>
        </section>
      </div>
    </AuthGuestLayout>
  )
}
