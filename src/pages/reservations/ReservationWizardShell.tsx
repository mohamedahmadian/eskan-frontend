import {
  Check,
  ClipboardCheck,
  Hourglass,
  MapPin,
  Shield,
  UserRoundCog,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { cardClassName } from '../../components/ui/Form'
import { formatNumber } from '../../lib/datetime'
import type { Reservation } from '../../types/app'
import {
  currentStepFromStatus,
  isStepDone,
  stepCardDate,
  stepHasProgress,
  stepsForType,
  type ReservationStepCode,
} from './reservation-steps'
import { StepGuideButton } from './StepGuideButton'
import { StepProgressChart } from './StepProgressChart'

const stepIcons: Record<ReservationStepCode, LucideIcon> = {
  travel: MapPin,
  review: ClipboardCheck,
  companions: Users,
  contacts: UserRoundCog,
  insurance: Shield,
  complete: Check,
}

export function ReservationWizardShell({
  reservation,
  viewedStep,
  onViewStep,
  children,
}: {
  reservation: Reservation
  viewedStep: ReservationStepCode | null
  onViewStep: (step: ReservationStepCode) => void
  children: React.ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { type, status } = reservation
  const steps = stepsForType(type)
  const current = currentStepFromStatus(status, type)
  const stopped = status === 'CANCELLED' || status === 'REJECTED'
  const recordedIndex = steps.reduce(
    (last, step, index) => (stepHasProgress(step, reservation) ? index : last),
    -1,
  )
  const currentIndex = stopped
    ? Math.max(0, recordedIndex)
    : Math.max(0, steps.indexOf(current))
  const remaining = stopped ? 0 : Math.max(0, steps.length - currentIndex - 1)
  const stepGridClass =
    steps.length >= 6
      ? 'grid-cols-3 sm:grid-cols-6'
      : steps.length === 5
        ? 'grid-cols-2 sm:grid-cols-5'
        : 'grid-cols-4'

  return (
    <div className="space-y-4">
      <div className={`${cardClassName} p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <StepProgressChart
            currentIndex={currentIndex}
            total={steps.length}
            locale={locale}
            label={t('reservations.stepOf', {
              current: formatNumber(currentIndex + 1, locale),
              total: formatNumber(steps.length, locale),
            })}
            caption={
              remaining > 0
                ? t('reservations.remainingSteps', { count: formatNumber(remaining, locale) })
                : undefined
            }
          />
          <ol className={`grid min-w-0 w-full flex-1 gap-2 sm:order-first ${stepGridClass}`}>
            {steps.map((step, index) => (
              <StepCard
                key={step}
                step={step}
                index={index}
                locale={locale}
                label={t(`reservations.steps.${step}`)}
                recordedAt={stepCardDate(step, reservation)}
                state={chipState(step, reservation, current)}
                active={viewedStep === step}
                onSelect={onViewStep}
              />
            ))}
          </ol>
        </div>
        <div className="mt-3">
          {viewedStep ? <StepGuideButton step={viewedStep} /> : null}
        </div>
      </div>
      {children}
    </div>
  )
}

function chipState(
  step: ReservationStepCode,
  reservation: Reservation,
  current: ReservationStepCode,
) {
  const { status, type } = reservation
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return stepHasProgress(step, reservation) ? 'done' : 'pending'
  }
  if (isStepDone(step, status, type)) return 'done'
  if (step === current && status === 'PENDING_MANAGEMENT_REVIEW' && step === 'review') {
    return 'waiting'
  }
  if (step === current) return 'current'
  return 'pending'
}

function StepCard({
  step,
  index,
  locale,
  label,
  recordedAt,
  state,
  active,
  onSelect,
}: {
  step: ReservationStepCode
  index: number
  locale: string
  label: string
  recordedAt: string | null
  state: 'done' | 'current' | 'waiting' | 'pending'
  active: boolean
  onSelect: (step: ReservationStepCode) => void
}) {
  const Icon = state === 'waiting' ? Hourglass : stepIcons[step]
  const styles = {
    done: 'border-teal-200 bg-teal-50 text-teal-800',
    current: 'border-teal-500 bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.28)]',
    waiting: 'border-gold-500 bg-gold-500 text-white shadow-[0_10px_24px_rgba(232,184,58,0.32)]',
    pending: 'border-line bg-cream-50 text-ink-400',
  }
  const clickable = state === 'done' || state === 'current' || state === 'waiting'
  const className = `flex h-full w-full flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-[box-shadow,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${styles[state]} ${
    active && state !== 'current' && state !== 'waiting' ? 'ring-2 ring-teal-300' : ''
  } ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`
  const highlighted = state === 'current' || state === 'waiting'
  const numberClass = highlighted ? 'text-white' : state === 'done' ? 'text-teal-800' : 'text-ink-400'
  const dateClass = highlighted ? 'text-white/80' : state === 'done' ? 'text-teal-700' : 'text-ink-400'
  const content = (
    <>
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${
          highlighted
            ? 'bg-white/20 text-white'
            : state === 'done'
              ? 'bg-teal-500 text-white'
              : 'bg-white text-ink-300'
        }`}
      >
        {state === 'done' ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
      </span>
      <span className="text-[11px] font-medium leading-5 sm:text-xs">{label}</span>
      <span className={`text-base font-semibold ${numberClass}`}>
        {formatNumber(index + 1, locale)}
      </span>
      {recordedAt ? (
        <span className={`text-[10px] font-medium leading-4 ${dateClass}`}>
          <DateText value={recordedAt} />
        </span>
      ) : null}
    </>
  )

  if (!clickable) {
    return (
      <li>
        <span className={className} aria-disabled="true">
          {content}
        </span>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        className={className}
        aria-current={highlighted ? 'step' : undefined}
        onClick={() => onSelect(step)}
      >
        {content}
      </button>
    </li>
  )
}
