import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from './Form'
import { AppModalContext } from './modal-context'

export function isModalEscapeBlocked(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (event.key !== 'Escape') return true
  if (event.defaultPrevented) return true
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return true
  if (document.querySelector('[role="listbox"]')) return true
  if (document.querySelector('[data-sonner-toast] button')) return true
  if (event.target instanceof Element && event.target.closest('[data-enter-ignore]')) return true
  if (dialog) {
    const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
    if (dialogs.length && dialogs[dialogs.length - 1] !== dialog) return true
  }
  return false
}

export function AppModal({
  onClose,
  closeDisabled = false,
  closeOnOverlay = true,
  onEscape,
  labelledBy,
  ariaLabel,
  zClassName = 'z-[70]',
  className = '',
  overlayClassName = 'flex items-end justify-center p-0 sm:items-center sm:p-4',
  backdropClassName = 'bg-ink-900/30',
  children,
}: {
  onClose: () => void
  closeDisabled?: boolean
  closeOnOverlay?: boolean
  /** Return `false` to skip close (e.g. clear nested selection first). */
  onEscape?: () => boolean | void
  labelledBy?: string
  ariaLabel?: string
  zClassName?: string
  className?: string
  overlayClassName?: string
  backdropClassName?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (isModalEscapeBlocked(event, dialogRef.current)) return
      if (closeDisabled) return
      event.preventDefault()
      if (onEscape?.() === false) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [closeDisabled, onClose, onEscape])

  function dismiss() {
    if (!closeDisabled) onClose()
  }

  return createPortal(
    <div className={`fixed inset-0 ${zClassName} ${overlayClassName}`} data-no-form-dblclick="">
      <button
        type="button"
        className={`absolute inset-0 ${backdropClassName}`}
        aria-label={t('common.close')}
        disabled={closeDisabled || !closeOnOverlay}
        onClick={() => {
          if (closeOnOverlay) dismiss()
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        className={`relative z-10 ${className}`}
      >
        <Button
          type="button"
          variant="ghost"
          icon
          data-modal-close=""
          className="absolute top-3 end-3 z-20"
          aria-label={t('common.close')}
          disabled={closeDisabled}
          onClick={dismiss}
        >
          <X className="size-4" aria-hidden />
        </Button>
        <AppModalContext.Provider value={true}>{children}</AppModalContext.Provider>
      </div>
    </div>,
    document.body,
  )
}
