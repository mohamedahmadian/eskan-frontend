import {
  ArrowLeft,
  Building2,
  CalendarDays,
  HandHeart,
  HeartHandshake,
  Megaphone,
  Newspaper,
  ScrollText,
  Tent,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { DateText } from '../components/ui/DateText'
import { FormEmptyHint } from '../components/ui/FormLayout'
import { api, getImageUrl } from '../lib/api'
import { withNext } from '../lib/auth-redirect'
import { formatGroupedNumber } from '../lib/datetime'
import type {
  AnnouncementAudience,
  HeadquartersAnnouncement,
  HeadquartersNews,
} from '../types/app'
import { announcementAudiences } from '../types/app'
import { LandingShell } from './landing/LandingShell'
import { ShrineMark } from './landing/ShrineMark'

const HONORARY_APPLY_PATH = '/honorary-apply'
const PILGRIMAGE_PATH = '/my-reservations/new'
const PARTICIPATIONS_PATH = '/participations'

type PublicCampaign = {
  id: string
  name: string
  startDate: string
  endDate: string
  description: string | null
  imageId: string | null
  progressPercent: number
  participantCount: number
  purchasedShares: number
  totalShares: number
  sharePrice: number
}

const audienceIcons: Record<AnnouncementAudience, LucideIcon> = {
  PILGRIMS: Users,
  CARAVAN_MANAGERS: Tent,
  ACCOMMODATION_MANAGERS: Building2,
}

function LandingSection({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow?: string
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
      <div className="mb-6 max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-medium tracking-wide text-teal-700">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold text-ink-900 sm:text-2xl">{title}</h2>
        {hint ? <p className="mt-2 text-sm leading-7 text-ink-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

function ServiceCard({
  to,
  icon: Icon,
  title,
  hint,
  action,
}: {
  to: string
  icon: LucideIcon
  title: string
  hint: string
  action: string
}) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-[28px] border border-white bg-white p-5 shadow-[0_12px_32px_rgba(20,40,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(46,189,182,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:p-6"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition group-hover:bg-mint-500 group-hover:text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="mt-4 block text-base font-semibold text-ink-900">{title}</span>
      <span className="mt-2 flex-1 text-sm leading-7 text-ink-500">{hint}</span>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal-700">
        {action}
        <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
      </span>
    </Link>
  )
}

export function LandingPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [audience, setAudience] = useState<AnnouncementAudience>(announcementAudiences.PILGRIMS)

  const volunteerTo = user ? HONORARY_APPLY_PATH : withNext('/register', HONORARY_APPLY_PATH)
  const pilgrimageTo = user ? PILGRIMAGE_PATH : withNext('/register', PILGRIMAGE_PATH)
  const participationsTo = user ? PARTICIPATIONS_PATH : withNext('/register', PARTICIPATIONS_PATH)

  const news = useQuery({
    queryKey: ['public', 'headquarters-news'],
    queryFn: async () => {
      const { data } = await api.get<HeadquartersNews[]>('/headquarters-news/published')
      return data
    },
  })
  const announcements = useQuery({
    queryKey: ['public', 'headquarters-announcements'],
    queryFn: async () => {
      const { data } = await api.get<HeadquartersAnnouncement[]>(
        '/headquarters-announcements/published',
      )
      return data
    },
  })
  const campaigns = useQuery({
    queryKey: ['public', 'participation-campaigns'],
    queryFn: async () => {
      const { data } = await api.get<PublicCampaign[]>('/participation-campaigns/public')
      return data
    },
  })

  const audienceItems = useMemo(
    () => (announcements.data ?? []).filter((item) => item.audience === audience).slice(0, 3),
    [announcements.data, audience],
  )

  return (
    <LandingShell>
      <div className="space-y-16 pb-16 pt-6 sm:space-y-20 sm:pt-8">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <div className="landing-hero relative overflow-hidden rounded-[32px] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
            <div className="landing-hero-pattern pointer-events-none absolute inset-0" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-xl">
                <p className="text-xs font-medium tracking-wide text-mint-300">
                  {t('landing.heroEyebrow')}
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.6rem]">
                  {t('landing.heroTitle')}
                </h1>
                <p className="mt-4 text-sm leading-8 text-white/80 sm:text-base">
                  {t('landing.heroSubtitle')}
                </p>
                <p
                  lang="ar"
                  dir="rtl"
                  className="mt-5 text-sm font-medium text-gold-400"
                >
                  {t('landing.heroBlessing')}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={pilgrimageTo}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-[0_10px_24px_rgba(20,40,40,0.16)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <ScrollText className="size-4" aria-hidden />
                    {t('landing.pilgrimage.action')}
                  </Link>
                  <Link
                    to={volunteerTo}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <HandHeart className="size-4" aria-hidden />
                    {t('landing.volunteer.action')}
                  </Link>
                </div>
              </div>
              <div className="hidden justify-self-center text-white/90 lg:block">
                <ShrineMark className="h-52 w-48" />
              </div>
            </div>
          </div>
        </section>

        <LandingSection title={t('landing.servicesTitle')} hint={t('landing.servicesHint')}>
          <div className="grid gap-4 sm:grid-cols-3">
            <ServiceCard
              to={pilgrimageTo}
              icon={ScrollText}
              title={t('landing.pilgrimage.title')}
              hint={t('landing.pilgrimage.hint')}
              action={t('landing.pilgrimage.action')}
            />
            <ServiceCard
              to={volunteerTo}
              icon={HandHeart}
              title={t('landing.volunteer.title')}
              hint={t('landing.volunteer.hint')}
              action={t('landing.volunteer.action')}
            />
            <ServiceCard
              to={participationsTo}
              icon={HeartHandshake}
              title={t('landing.participations.title')}
              hint={t('landing.participations.hint')}
              action={t('landing.participations.action')}
            />
          </div>
        </LandingSection>

        {campaigns.data?.length ? (
          <LandingSection
            title={t('landing.participations.sectionTitle')}
            hint={t('landing.participations.sectionHint')}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.data.map((item) => (
                <Link
                  key={item.id}
                  to={user ? `/participations/campaigns/${item.id}` : participationsTo}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_12px_32px_rgba(20,40,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(46,189,182,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-e from-teal-500 via-mint-500 to-teal-400">
                    {item.imageId ? (
                      <img
                        src={getImageUrl(item.imageId)}
                        alt=""
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900/50 to-transparent" />
                    <p className="absolute inset-x-4 bottom-3 text-lg font-semibold text-white drop-shadow">
                      {item.name}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    {item.description ? (
                      <p className="line-clamp-2 text-sm leading-6 text-ink-600">{item.description}</p>
                    ) : null}
                    <div className="mt-auto">
                      <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
                        <span>{t('participations.progress')}</span>
                        <span className="font-semibold text-teal-700">
                          {formatGroupedNumber(item.progressPercent, locale)}٪
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-e from-teal-500 to-mint-500"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
                      {t('landing.participations.join')}
                      <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </LandingSection>
        ) : null}

        {news.data?.length ? (
        <LandingSection title={t('landing.news.title')} hint={t('landing.news.hint')}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.data.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/welcome/news/${item.id}`}
                  className="group flex h-full flex-col rounded-[28px] border border-white bg-white p-5 shadow-[0_12px_32px_rgba(20,40,40,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(46,189,182,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <span className="inline-flex items-center gap-2 text-xs text-ink-400">
                    <Newspaper className="size-3.5 text-teal-600" aria-hidden />
                    <DateText value={item.publishedAt} />
                  </span>
                  <span className="mt-3 block text-base font-semibold leading-7 text-ink-900">
                    {item.title}
                  </span>
                  {item.summary ? (
                    <span className="mt-2 line-clamp-2 flex-1 text-sm leading-7 text-ink-500">
                      {item.summary}
                    </span>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700">
                    {t('landing.news.readMore')}
                    <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
        </LandingSection>
        ) : null}

        <LandingSection
          title={t('landing.announcements.title')}
          hint={t('landing.announcements.hint')}
        >
          <div
            role="tablist"
            aria-label={t('landing.announcements.title')}
            className="mb-5 flex flex-wrap gap-2"
          >
            {(Object.keys(audienceIcons) as AnnouncementAudience[]).map((value) => {
              const Icon = audienceIcons[value]
              const selected = audience === value
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setAudience(value)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
                    selected
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'bg-white text-ink-600 ring-1 ring-line hover:bg-teal-50 hover:text-teal-800'
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(`landing.announcements.audiences.${value}`)}
                </button>
              )
            })}
          </div>
          {announcements.isSuccess && !audienceItems.length ? (
            <FormEmptyHint>{t('landing.announcements.empty')}</FormEmptyHint>
          ) : audienceItems.length ? (
            <div className="grid gap-3">
              {audienceItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/welcome/announcements/${item.id}`}
                  className="group flex items-start gap-4 rounded-[24px] border border-white bg-white px-5 py-4 shadow-[0_10px_28px_rgba(20,40,40,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(46,189,182,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Megaphone className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-2 text-xs text-ink-400">
                      <CalendarDays className="size-3.5" aria-hidden />
                      <DateText value={item.publishedAt} />
                    </span>
                    <span className="mt-1 block font-semibold text-ink-900">{item.title}</span>
                    <span className="mt-1 line-clamp-2 text-sm leading-7 text-ink-500">{item.body}</span>
                  </span>
                  <ArrowLeft className="mt-2 size-4 shrink-0 text-ink-300 ltr:rotate-180 group-hover:text-teal-600" aria-hidden />
                </Link>
              ))}
            </div>
          ) : null}
        </LandingSection>
      </div>
    </LandingShell>
  )
}
