import { ArrowRight, Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { InKindContent } from '../participations/InKindContent'
import { LandingPageHeader } from './LandingPageHeader'
import { LandingShell } from './LandingShell'

export function PublicInKindPage() {
  const { t } = useTranslation()

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
        <Link
          to="/participations"
          className="inline-flex items-center gap-2 rounded-2xl text-sm font-medium text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t('common.back')}
        </Link>
        <div className="mt-6 mb-8">
          <LandingPageHeader
            icon={Gift}
            eyebrow={t('landing.participations.inKindTitle')}
            title={t('landing.participations.inKindPageTitle')}
            subtitle={t('landing.participations.inKindPageHint')}
          />
        </div>
        <article className="overflow-hidden rounded-[28px] border border-white bg-white p-5 shadow-[0_12px_32px_rgba(20,40,40,0.06)] sm:p-8">
          <InKindContent />
        </article>
      </div>
    </LandingShell>
  )
}
