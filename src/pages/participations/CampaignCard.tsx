import { CalendarRange, Coins, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { getImageUrl } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import type { PublicCampaign } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function campaignProgressPercent(
  purchasedShares: number,
  totalShares: number,
  fallback?: number,
) {
  if (totalShares > 0) {
    return Math.min(100, Math.max(0, (Number(purchasedShares) / Number(totalShares)) * 100))
  }
  const raw = Number(fallback)
  return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0
}

export function CampaignProgressBar({
  percent,
  label,
  value,
}: {
  percent: number
  label: string
  value: string
}) {
  const raw = Number(percent)
  const clamped = Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0))
  const fill = clamped > 0 ? Math.max(clamped, 6) : 0
  return (
    <div>
      <p className="mb-2 text-xs text-ink-500">{label}</p>
      <div
        className="relative h-8 overflow-hidden rounded-full bg-cream-100 ring-1 ring-inset ring-ink-900/8"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={`${label} ${value}`}
      >
        {fill > 0 ? (
          <div
            className="absolute inset-y-0 start-0 bg-teal-500"
            style={{ width: `${fill}%` }}
          />
        ) : null}
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold"
            style={{ color: '#3f3a34' }}
          >
            {value}
          </span>
        </span>
      </div>
    </div>
  )
}

export function CampaignCard({
  item,
  to,
}: {
  item: PublicCampaign
  to: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatGroupedNumber(value, locale)

  return (
    <Link
      to={to}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_10px_30px_rgba(63,58,52,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(46,189,182,0.16)]"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-e from-teal-500 via-mint-500 to-teal-400">
        {item.imageId ? (
          <img
            src={getImageUrl(item.imageId)}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.18),transparent_40%)]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900/55 to-transparent" />
        <div className="absolute start-4 top-4">
          <GeoStatus active={item.isActive} />
        </div>
        <p className="absolute inset-x-4 bottom-3 text-lg font-semibold text-white drop-shadow">
          {item.name}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="inline-flex items-center gap-2 text-xs text-ink-500">
          <CalendarRange className="size-3.5 shrink-0" aria-hidden />
          <DateText value={item.startDate} />
          <span aria-hidden>—</span>
          <DateText value={item.endDate} />
        </p>
        {item.description ? (
          <p className="line-clamp-2 text-sm leading-6 text-ink-600">{item.description}</p>
        ) : null}
        <CampaignProgressBar
          percent={campaignProgressPercent(item.purchasedShares, item.totalShares, item.progressPercent)}
          label={t('participations.progress')}
          value={`${formatGroupedNumber(item.progressPercent, locale)}٪`}
        />
        <div className="mt-auto grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-teal-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1 text-[11px] text-teal-700">
              <Users className="size-3.5" aria-hidden />
              {t('participations.participants')}
            </p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{n(item.participantCount)}</p>
          </div>
          <div className="rounded-2xl bg-mint-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1 text-[11px] text-teal-800">
              <Coins className="size-3.5" aria-hidden />
              {t('participations.purchasedShares')}
            </p>
            <p className="mt-1 text-lg font-semibold text-ink-900">
              {n(item.purchasedShares)}
              <span className="ms-1 text-xs font-medium text-ink-500">/ {n(item.totalShares)}</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-500">
          {t('participations.sharePrice')}: {n(item.sharePrice)} {t('participations.toman')}
        </p>
      </div>
    </Link>
  )
}
