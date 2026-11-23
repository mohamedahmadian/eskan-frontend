import { useEffect } from 'react'
import { useNavigationHistory } from '../../lib/navigation-history'
import { findEnabledFormCancel, shortcutBlockedByOverlay } from './form-shortcuts'

/** Esc سراسری: بستن لایه → انصراف فرم → دکمهٔ بازگشت / تاریخچه. */
export function EscapeBackListener() {
  const { goBack, canGoBack } = useNavigationHistory()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (event.repeat || event.isComposing || event.defaultPrevented) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (shortcutBlockedByOverlay(event.target)) return

      const cancel = findEnabledFormCancel(event.target)
      if (cancel) {
        event.preventDefault()
        cancel.click()
        return
      }

      const back = document.querySelector<HTMLButtonElement>('[data-page-back]')
      if (back && !back.disabled) {
        event.preventDefault()
        back.click()
        return
      }

      if (document.querySelector('[data-escape-stay]')) return
      if (!canGoBack) return
      event.preventDefault()
      goBack()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canGoBack, goBack])

  return null
}
