/** مسیر جزئیات از روی آدرس ویرایش (`/…/id/edit` → `/…/id`). */
export function detailsPathFromEdit(pathname: string) {
  const path = pathname.replace(/\/+$/, '')
  if (!path.endsWith('/edit')) return undefined
  const parent = path.slice(0, -'/edit'.length)
  return parent || undefined
}

const DBLCLICK_SKIP =
  'input, textarea, select, button, a, label, [contenteditable="true"], [data-no-form-dblclick], [role="listbox"], [role="option"]'

export function isInteractiveDblClickTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return true
  return Boolean(target.closest(DBLCLICK_SKIP))
}

export function isTextEntryTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  if (target instanceof HTMLElement && target.isContentEditable) return true
  const field = target.closest('textarea, select, input')
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) return true
  if (field instanceof HTMLInputElement) {
    const nonText = new Set([
      'button',
      'submit',
      'reset',
      'checkbox',
      'radio',
      'file',
      'range',
      'color',
      'hidden',
    ])
    return !nonText.has(field.type)
  }
  return false
}

/** دراپ‌داون، مودال، منو یا تأیید باز — Esc نباید صفحه را ترک کند. */
export function shortcutBlockedByOverlay(target: EventTarget | null) {
  if (target instanceof Element && target.closest('[data-enter-ignore]')) return true
  if (document.querySelector('[role="dialog"][aria-modal="true"]')) return true
  if (document.querySelector('[role="listbox"]')) return true
  if (document.querySelector('[role="menu"]')) return true
  if (document.querySelector('[data-escape-layer]')) return true
  if (document.querySelector('[data-sonner-toast] button')) return true
  if (document.querySelector('.rmdp-calendar')) return true
  if (document.querySelector('.leaflet-popup')) return true
  return false
}

/** دکمهٔ انصراف فرم فعال، اگر همان فرم میانبر را در اختیار دارد. */
export function findEnabledFormCancel(target: EventTarget | null) {
  const forms = document.querySelectorAll<HTMLFormElement>('form:not([data-enter-immediate])')
  for (const form of forms) {
    if (!formOwnsShortcut(form, target)) continue
    const cancel = form.querySelector<HTMLButtonElement>('[data-form-cancel]')
    if (cancel && !cancel.disabled) return cancel
  }
  return null
}

const SHORTCUT_CHARS = new Set(['s', 'S', 'س'])

function setNativeFieldValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

/** حرف میانبر که با فشار اول داخل فیلد آمده را برمی‌دارد تا در مقدار ذخیره‌شده نماند. */
export function revertShortcutChar(el: HTMLInputElement | HTMLTextAreaElement) {
  const start = el.selectionStart
  const end = el.selectionEnd
  if (start == null || end == null || start !== end || start < 1) return
  const ch = el.value.charAt(start - 1)
  if (!SHORTCUT_CHARS.has(ch)) return
  const next = el.value.slice(0, start - 1) + el.value.slice(end)
  setNativeFieldValue(el, next)
  const pos = start - 1
  el.setSelectionRange(pos, pos)
}

export function isShortcutExcludedText(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  const field = target.closest('input')
  if (!(field instanceof HTMLInputElement)) return false
  return (
    field.type === 'password' ||
    field.type === 'email' ||
    field.type === 'url' ||
    field.hasAttribute('data-password-field')
  )
}

export function formOwnsShortcut(form: HTMLFormElement, target: EventTarget | null) {
  if (!(target instanceof Node)) return false
  if (form.contains(target)) return true
  if (target instanceof Element) {
    const owner = target.closest('form')
    if (owner) return owner === form
    if (isTextEntryTarget(target) || target.closest('[contenteditable="true"]')) return false
  }
  const forms = document.querySelectorAll('form:not([data-enter-immediate])')
  return forms.length === 1 && forms[0] === form
}
