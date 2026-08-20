export type ShareCardResult = 'shared' | 'cancelled' | 'unavailable' | 'failed'

export function telegramShareUrl(url: string, text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}

export function eitaaShareUrl(url: string) {
  return `https://eitaa.com/share/url?url=${encodeURIComponent(url)}`
}

export function openExternalShare(href: string) {
  const opened = window.open(href, '_blank', 'noopener,noreferrer')
  if (!opened) window.location.assign(href)
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    document.execCommand('copy')
    document.body.removeChild(field)
  }
}

export function canUseNativeShare() {
  return typeof navigator.share === 'function'
}
