import { ArrowLeft, ArrowRight, HeartHandshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../../lib/api'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { PublicCampaign } from '../../types/app'
import { CampaignProgressBar, campaignProgressPercent } from '../participations/CampaignCard'

const AUTO_MS = 7000

export function CampaignSlider({ items }: { items: PublicCampaign[] }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = items.length
  const item = items[index]

  useEffect(() => {
    if (count < 2 || paused) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, AUTO_MS)
    return () => window.clearInterval(timer)
  }, [count, paused])

  if (!item) return null

  function go(next: number) {
    setIndex((next + count) % count)
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={t('landing.participations.sectionTitle')}
        className="overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_12px_32px_rgba(20,40,40,0.06)]"
      >
        <Link
          to={`/participations/${item.id}`}
          className="group grid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="relative min-h-56 overflow-hidden bg-gradient-to-e from-teal-500 via-mint-500 to-teal-400 sm:min-h-72">
            {item.imageId ? (
              <img
                src={getImageUrl(item.imageId)}
                alt=""
                className="size-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_42%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-ink-900/10 to-transparent" />
            <p className="absolute inset-x-5 bottom-5 text-2xl font-semibold text-white drop-shadow sm:text-3xl">
              {item.name}
            </p>
          </div>
          <div className="flex flex-col gap-4 p-5 sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-teal-700">
              <HeartHandshake className="size-4" aria-hidden />
              {t('landing.participations.slideLabel', {
                current: formatNumber(index + 1, locale),
                total: formatNumber(count, locale),
              })}
            </p>
            {item.description ? (
              <p className="line-clamp-4 text-sm leading-8 text-ink-600">{item.description}</p>
            ) : null}
            <div className="mt-auto">
              <CampaignProgressBar
                percent={campaignProgressPercent(item.purchasedShares, item.totalShares, item.progressPercent)}
                label={t('participations.progress')}
                value={`${formatGroupedNumber(item.progressPercent, locale)}٪`}
              />
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
              {t('landing.participations.join')}
              <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
            </span>
          </div>
        </Link>
      </div>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={t('landing.participations.prev')}
            onClick={() => go(index - 1)}
            className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-sm ring-1 ring-line transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <ArrowRight className="size-5 ltr:rotate-180" aria-hidden />
          </button>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {items.map((slide, slideIndex) => {
              const selected = slideIndex === index
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={t('landing.participations.goToSlide', {
                    n: formatNumber(slideIndex + 1, locale),
                  })}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => setIndex(slideIndex)}
                  className={`h-2.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
                    selected ? 'w-7 bg-teal-500' : 'w-2.5 bg-line hover:bg-teal-200'
                  }`}
                />
              )
            })}
          </div>
          <button
            type="button"
            aria-label={t('landing.participations.next')}
            onClick={() => go(index + 1)}
            className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-sm ring-1 ring-line transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <ArrowLeft className="size-5 ltr:rotate-180" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}
