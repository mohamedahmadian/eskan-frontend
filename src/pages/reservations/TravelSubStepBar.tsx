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
import type { ReservationType } from '../../types/app'
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

const circleStyles = {
  done: 'border-teal-400 bg-teal-500 text-white',
  current:
    'border-teal-500 bg-teal-500 text-white shadow-[0_4px_12px_rgba(46,189,182,0.28)] ring-4 ring-teal-100',
  pending: 'border-line bg-white text-ink-300',
} as const

const labelStyles = {
  done: 'text-teal-800',
  current: 'font-semibold text-teal-700',
  pending: 'text-ink-400',
} as const

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
  const { t } = useTranslation()
  const currentIndex = steps.indexOf(current)
  const maxReachedIndex = Math.max(currentIndex, steps.indexOf(maxReached))
  const widthClass =
    steps.length <= 2 ? 'max-w-sm' : steps.length === 3 ? 'max-w-md' : 'max-w-xl'

  return (
    <div className={`${cardClassName} px-3 py-2.5 sm:px-4`}>
      <ol className={`mx-auto flex w-full items-start ${widthClass}`}>
        {steps.map((item, index) => {
          const Icon =
            item === 'party' ? (type === 'CARAVAN' ? Footprints : Users) : travelSubStepIcons[item]
          const state =
            index === currentIndex ? 'current' : index <= maxReachedIndex ? 'done' : 'pending'
          const clickable = index <= maxReachedIndex
          const label = t(travelSubStepLabelKey(item, type))
          const controlClass = `group relative z-10 flex w-full flex-col items-center gap-1 focus-visible:outline-none ${
            clickable ? 'cursor-pointer' : 'cursor-not-allowed'
          }`
          const content = (
            <>
              <span
                className={`flex size-11 items-center justify-center rounded-full border-2 transition-[box-shadow,border-color,background-color] duration-200 group-focus-visible:ring-2 group-focus-visible:ring-teal-400 group-focus-visible:ring-offset-2 ${circleStyles[state]}`}
              >
                {state === 'done' ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Icon className="size-4" aria-hidden />
                )}
              </span>
              <span className={`px-0.5 text-center text-[10px] leading-4 sm:text-[11px] ${labelStyles[state]}`}>
                {label}
              </span>
            </>
          )
          return (
            <li key={item} className="relative flex min-w-0 flex-1 flex-col items-center">
              {index < steps.length - 1 ? (
                <span
                  className={`absolute top-[21px] start-1/2 z-0 h-0.5 w-full ${
                    index < currentIndex ? 'bg-teal-300' : 'bg-line'
                  }`}
                  aria-hidden
                />
              ) : null}
              {clickable ? (
                <button
                  type="button"
                  className={controlClass}
                  aria-current={state === 'current' ? 'step' : undefined}
                  aria-label={label}
                  onClick={() => onSelect(item)}
                >
                  {content}
                </button>
              ) : (
                <span className={controlClass} aria-disabled="true">
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
