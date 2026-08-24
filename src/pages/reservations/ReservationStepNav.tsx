import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Form'

function scrollPageToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function ReservationStepNav({
  onPrev,
  onNext,
  nextLabel,
  nextPending,
  nextIcon = 'next',
}: {
  onPrev?: () => void
  onNext: () => void
  nextLabel?: string
  nextPending?: boolean
  nextIcon?: 'next' | 'complete'
}) {
  const { t } = useTranslation()

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
        disabled={nextPending}
        onClick={() => {
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
