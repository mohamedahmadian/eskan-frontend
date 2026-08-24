import {
  Calendar,
  Check,
  Footprints,
  HeartHandshake,
  MapPin,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cardClassName } from '../../components/ui/Form'
import { formatNumber } from '../../lib/datetime'
import type { ReservationType } from '../../types/app'
import { StepProgressChart } from './StepProgressChart'
import {
  travelSubStepLabelKey,
  type TravelSubStep,
} from './travel-sub-steps'

const travelSubStepIcons: Record<TravelSubStep, LucideIcon> = {
  count: User,
  party: Users,
  dates: Calendar,
  services: HeartHandshake,
  optional: MapPin,
}

export function TravelSubStepBar({
  current,
  maxReached,
  steps,
  type,
  onSelect,
}: {
  current: TravelSubStep
  maxReached: TravelSubStep
  steps: TravelSubStep[]
  type: ReservationType
  onSelect: (step: TravelSubStep) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const currentIndex = steps.indexOf(current)
  const maxReachedIndex = Math.max(currentIndex, steps.indexOf(maxReached))
  const total = steps.length
  const gridClass =
    total >= 5 ? 'grid-cols-2 sm:grid-cols-5' : total === 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <div className={`${cardClassName} p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <StepProgressChart
          currentIndex={currentIndex}
          total={total}
          locale={locale}
          label={t('reservations.stepOf', {
            current: formatNumber(currentIndex + 1, locale),
            total: formatNumber(total, locale),
          })}
        />
        <ol className={`grid min-w-0 w-full flex-1 gap-2 sm:order-first ${gridClass}`}>
          {steps.map((item, index) => {
            const Icon =
              item === 'party' ? (type === 'CARAVAN' ? Footprints : Users) : travelSubStepIcons[item]
            const state =
              index === currentIndex ? 'current' : index <= maxReachedIndex ? 'done' : 'pending'
            const styles = {
              done: 'border-teal-200 bg-teal-50 text-teal-800',
              current:
                'border-teal-500 bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.28)]',
              pending: 'border-line bg-cream-50 text-ink-400',
            }
            const clickable = index <= maxReachedIndex
            const className = `flex h-full w-full flex-col items-center gap-1 rounded-2xl border px-1.5 py-3 text-center transition-[box-shadow,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${styles[state]} ${
              clickable ? 'cursor-pointer' : 'cursor-not-allowed'
            }`
            const numberClass =
              state === 'current' ? 'text-white' : state === 'done' ? 'text-teal-800' : 'text-ink-400'
            const label = t(travelSubStepLabelKey(item, type))
            const content = (
              <>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    state === 'current'
                      ? 'bg-white/20 text-white'
                      : state === 'done'
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-ink-300'
                  }`}
                >
                  {state === 'done' ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Icon className="size-4" aria-hidden />
                  )}
                </span>
                <span className="text-[11px] font-medium leading-5 sm:text-xs">{label}</span>
                <span className={`text-base font-semibold ${numberClass}`}>
                  {formatNumber(index + 1, locale)}
                </span>
              </>
            )
            return (
              <li key={item}>
                {clickable ? (
                  <button
                    type="button"
                    className={className}
                    aria-current={state === 'current' ? 'step' : undefined}
                    onClick={() => onSelect(item)}
                  >
                    {content}
                  </button>
                ) : (
                  <span className={className} aria-disabled="true">
                    {content}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
