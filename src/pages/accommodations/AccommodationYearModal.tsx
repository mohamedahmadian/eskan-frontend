import { X, type LucideIcon } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Form'
import { FormCard } from '../../components/ui/FormLayout'

export function AccommodationYearModal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  className = 'max-w-lg',
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const { t } = useTranslation()

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className={`relative z-10 flex max-h-[90vh] w-full flex-col ${className}`}>
        <FormCard
          icon={icon}
          title={title}
          subtitle={subtitle}
          action={
            <Button
              type="button"
              variant="ghost"
              icon
              aria-label={t('common.close')}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </Button>
          }
          className="flex min-h-0 flex-1 flex-col [&>header]:shrink-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </FormCard>
      </div>
    </div>,
    document.body,
  )
}
