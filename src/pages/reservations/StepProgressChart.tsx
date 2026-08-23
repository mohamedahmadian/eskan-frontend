import { formatNumber } from '../../lib/datetime'

export function StepProgressChart({
  currentIndex,
  total,
  locale,
  label,
  caption,
  compact = false,
}: {
  currentIndex: number
  total: number
  locale: string
  label: string
  caption?: string
  compact?: boolean
}) {
  const size = compact ? 44 : 72
  const stroke = compact ? 6 : 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const gap = circumference * 0.07
  const segment = circumference / Math.max(total, 1) - gap
  const displayCurrent = currentIndex < 0 ? 0 : currentIndex + 1
  return (
    <div className={`flex shrink-0 flex-col items-center ${compact ? '' : 'self-end sm:self-center'}`}>
      <div
        className={`relative flex items-center justify-center ${compact ? 'size-[52px]' : 'size-[88px]'}`}
        role="img"
        aria-label={label}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-bl from-teal-50 to-mint-50" aria-hidden />
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={`relative -rotate-90 ${compact ? 'size-[46px]' : 'size-[76px]'}`}
          aria-hidden
        >
          {Array.from({ length: total }, (_, index) => {
            const filled = currentIndex >= 0 && index <= currentIndex
            const isCurrent = index === currentIndex
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={filled ? (isCurrent ? '#2EBDB6' : '#9EE6E1') : '#E8E2D6'}
                strokeWidth={isCurrent ? stroke + 1.5 : stroke}
                strokeLinecap="round"
                strokeDasharray={`${segment} ${circumference - segment}`}
                strokeDashoffset={-(index * (segment + gap))}
              />
            )
          })}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center text-ink-900">
          <span className={`${compact ? 'text-sm' : 'text-lg'} font-semibold leading-none`}>
            {currentIndex < 0 ? '—' : formatNumber(displayCurrent, locale)}
          </span>
          <span className={`mt-0.5 font-medium text-ink-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
            {formatNumber(total, locale)}
          </span>
        </span>
      </div>
      {caption ? (
        <p className="mt-1 max-w-[7.5rem] text-center text-[10px] leading-4 text-ink-400">{caption}</p>
      ) : null}
    </div>
  )
}
