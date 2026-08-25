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

export { copyText } from './clipboard'

export function canUseNativeShare() {
  return typeof navigator.share === 'function'
}
