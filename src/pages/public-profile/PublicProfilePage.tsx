import {
  Building2,
  CalendarDays,
  Download,
  History,
  MapPin,
  Tent,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { toDataURL } from 'qrcode'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import { Button, LoadingState } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { LandingShell } from '../landing/LandingShell'
import { useGeoName } from '../../lib/geo'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { publicAccommodationPath } from '../../lib/public-place'
import { publicProfileUrl } from '../../lib/public-profile'
import type { PublicProfile } from '../../types/app'
import { PublicProfileCard } from './PublicProfileCard'

const pngOptions = {
  pixelRatio: 3,
  backgroundColor: '#ffffff',
  cacheBust: true,
}

type ProfileTab = 'caravans' | 'accommodations' | 'pilgrimages'

export function PublicProfilePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const cardRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [tab, setTab] = useState<ProfileTab | null>(null)
  const geoName = useGeoName()

  const query = useQuery({
    queryKey: ['public', 'profile', id],
    enabled: Boolean(id),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<PublicProfile>(
        `/public/profiles/${encodeURIComponent(id ?? '')}`,
      )
      return data
    },
  })

  const profile = query.data
  const shareUrl = id ? publicProfileUrl(id) : ''

  useEffect(() => {
    if (!shareUrl) {
      setQrUrl(null)
      return
    }
    let cancelled = false
    toDataURL(shareUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f6e6a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [shareUrl])

  const tabs = useMemo(() => {
    if (!profile) return []
    const items: { id: ProfileTab; label: string; icon: LucideIcon }[] = []
    if (profile.roles.some((role) => role.code === 'CARAVAN_MANAGER')) {
      items.push({
        id: 'caravans',
        label: t('publicProfile.tabs.caravans'),
        icon: Tent,
      })
    }
    if (profile.roles.some((role) => role.code === 'ACCOMMODATION_MANAGER')) {
      items.push({
        id: 'accommodations',
        label: t('publicProfile.tabs.accommodations'),
        icon: Building2,
      })
    }
    if (profile.pilgrimages.length > 0) {
      items.push({
        id: 'pilgrimages',
        label: t('publicProfile.tabs.pilgrimages'),
        icon: History,
      })
    }
    return items
  }, [profile, t])

  const activeTab = tab && tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id ?? null

  async function downloadCard() {
    if (!cardRef.current || !profile) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, pngOptions)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `member-card-${profile.nationalId || profile.id}.png`
      link.click()
      toast.success(t('publicProfile.downloaded'))
    } catch {
      toast.error(t('publicProfile.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  if (query.isLoading) {
    return (
      <LandingShell>
        <div className="min-h-[50vh]">
          <LoadingState />
        </div>
      </LandingShell>
    )
  }

  if (!profile) {
    return (
      <LandingShell>
        <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
          <h1 className="text-lg font-semibold text-ink-900">{t('publicProfile.notFoundTitle')}</h1>
          <p className="mt-2 text-sm text-ink-500">{t('publicProfile.notFound')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('publicProfile.notFoundHint')}</p>
        </div>
      </LandingShell>
    )
  }

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col items-center gap-5">
          <PublicProfileCard ref={cardRef} profile={profile} qrUrl={qrUrl} />
          <Button type="button" onClick={() => void downloadCard()} disabled={downloading || !qrUrl}>
            <Download className="size-4" aria-hidden />
            {downloading ? t('publicProfile.downloading') : t('publicProfile.download')}
          </Button>
        </div>

        {tabs.length ? (
          <nav className="mb-6 flex flex-wrap justify-center gap-2">
            {tabs.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                      : 'bg-white text-ink-700 ring-1 ring-line hover:bg-cream-50'
                  }`}
                >
                  <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
                  {item.label}
                </button>
              )
            })}
          </nav>
        ) : null}

        {activeTab === 'caravans' ? (
          <section className="space-y-3">
            {profile.caravans.length ? (
              profile.caravans.map((caravan) => (
                <article
                  key={caravan.id}
                  className="rounded-[22px] border border-white bg-white p-4 shadow-[0_10px_30px_rgba(20,40,40,0.05)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <Tent className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{caravan.name}</p>
                      <p className="mt-1 text-xs text-ink-500">
                        {caravan.city ? geoName(caravan.city) : ''}
                        {caravan.city ? ' · ' : ''}
                        {caravan.isActive ? t('geo.active') : t('geo.inactive')}
                      </p>
                      {caravan.licenseNumber ? (
                        <p className="mt-1 text-xs text-ink-500">
                          {t('publicProfile.licenseNumber')}: {caravan.licenseNumber}
                        </p>
                      ) : null}
                      {caravan.walkingRoute ? (
                        <p className="mt-1 text-xs text-ink-500">{caravan.walkingRoute.name}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <FormEmptyHint>{t('publicProfile.caravansEmpty')}</FormEmptyHint>
            )}
          </section>
        ) : null}

        {activeTab === 'accommodations' ? (
          <section className="space-y-3">
            {profile.accommodations.length ? (
              profile.accommodations.map((item) => (
                <Link
                  key={item.id}
                  to={publicAccommodationPath(item.accommodation.id)}
                  className="block rounded-[22px] border border-white bg-white p-4 shadow-[0_10px_30px_rgba(20,40,40,0.05)] transition hover:-translate-y-0.5"
                >
                <article>
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-50 text-mint-700">
                      <Building2 className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{item.accommodation.name}</p>
                      <p className="mt-1 text-xs text-ink-500">
                        {formatNumber(item.year, locale)}
                        {item.accommodation.type
                          ? ` · ${t(`accommodationTypes.${item.accommodation.type}`)}`
                          : ''}
                        {item.isPrimary ? ` · ${t('publicProfile.primaryAccommodation')}` : ''}
                      </p>
                    </div>
                  </div>
                </article>
                </Link>
              ))
            ) : (
              <FormEmptyHint>{t('publicProfile.accommodationsEmpty')}</FormEmptyHint>
            )}
          </section>
        ) : null}

        {activeTab === 'pilgrimages' ? (
          <section className="space-y-3">
            {profile.pilgrimages.map((item) => (
              <article
                key={item.id}
                className="rounded-[22px] border border-white bg-white p-4 shadow-[0_10px_30px_rgba(20,40,40,0.05)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900">
                    {t('menus.pilgrimageYear', { year: formatNumber(item.year, locale) })}
                  </p>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
                    {t(`reservations.types.${item.type}`)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">{t(`reservations.statuses.${item.status}`)}</p>
                {item.caravan ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-700">
                    <Tent className="size-3.5 text-teal-600" aria-hidden />
                    {item.caravan.name}
                  </p>
                ) : null}
                {item.originCity ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                    <MapPin className="size-3.5 text-teal-600" aria-hidden />
                    {geoName(item.originCity)}
                  </p>
                ) : null}
                {item.stayStartDate || item.stayEndDate ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                    <CalendarDays className="size-3.5 text-teal-600" aria-hidden />
                    {t('publicProfile.stayDates')}
                    {item.stayStartDate ? (
                      <>
                        {' '}
                        <DateText value={item.stayStartDate} />
                      </>
                    ) : null}
                    {item.stayEndDate ? (
                      <>
                        {' — '}
                        <DateText value={item.stayEndDate} />
                      </>
                    ) : null}
                  </p>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </LandingShell>
  )
}
