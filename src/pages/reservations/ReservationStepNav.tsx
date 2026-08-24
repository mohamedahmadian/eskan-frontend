import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
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

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
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
        title={nextDisabled ? nextTitle : undefined}
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
  )
}
