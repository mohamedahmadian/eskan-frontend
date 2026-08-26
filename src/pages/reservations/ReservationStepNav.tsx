import { Check, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Form'

/** Dashboard content scrolls in `<main>`, not the window. */
export function scrollPageToTop() {
  const main = document.querySelector('main')
  if (main instanceof HTMLElement) {
    main.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function StepBlockedNotice({
  id,
  title,
  message,
}: {
  id?: string
  title: string
  message: string
}) {
  return (
    <aside
      id={id}
      role="status"
      className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-gradient-to-e from-amber-50 via-white to-cream-50 px-4 py-3.5 shadow-[0_10px_24px_rgba(245,158,11,0.12)]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_8px_16px_rgba(245,158,11,0.28)]">
        <Clock3 className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm leading-7 text-ink-700">{message}</p>
      </div>
    </aside>
  )
}

export function ReservationStepNav({
  onPrev,
  onNext,
  nextLabel,
  nextPending,
  nextDisabled,
  nextTitle,
  nextIcon = 'next',
}: {
  onPrev?: () => void
  onNext: () => void
  nextLabel?: string
  nextPending?: boolean
  nextDisabled?: boolean
  nextTitle?: string
  nextIcon?: 'next' | 'complete'
}) {
  const { t } = useTranslation()
  const disabled = Boolean(nextPending || nextDisabled)
  const showReason = Boolean(nextDisabled && nextTitle)

  return (
    <div className="space-y-3 border-t border-line px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        {onPrev ? (
          <Button
            type="button"
            onClick={() => {
              scrollPageToTop()
              onPrev()
            }}
          >
            <ChevronRight className="size-4" aria-hidden />
            {t('reservations.prevStep')}
          </Button>
        ) : null}
        <Button
          type="button"
          className="ms-auto"
          disabled={disabled}
          aria-describedby={showReason ? 'step-next-blocked-reason' : undefined}
          onClick={() => {
            if (disabled) return
            scrollPageToTop()
            onNext()
          }}
        >
          {nextLabel ?? t('reservations.nextStep')}
          {nextIcon === 'complete' ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <ChevronLeft className="size-4" aria-hidden />
          )}
        </Button>
      </div>
      {showReason ? (
        <StepBlockedNotice
          id="step-next-blocked-reason"
          title={t('reservations.finalSubmitBlockedTitle')}
          message={nextTitle!}
        />
      ) : null}
    </div>
  )
}
