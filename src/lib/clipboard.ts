import { toLatinDigits } from './datetime'
import { isValidIranianNationalId, normalizeNationalId } from './national-id'

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

export async function readClipboardText() {
  try {
    if (!navigator.clipboard?.readText) return null
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

function compactClipboard(raw: string) {
  return toLatinDigits(raw)
    .replace(/[\u200e\u200f\ufeff]/g, '')
    .trim()
}

function normalizeClipboardMobile(input: string) {
  let phone = compactClipboard(input).replace(/[\s-()]/g, '').replace(/\D/g, '')
  if (phone.startsWith('0098')) {
    phone = phone.slice(4)
  } else if (phone.startsWith('98') && phone.length >= 12) {
    phone = phone.slice(2)
  }
  if (phone.startsWith('9') && phone.length === 10) {
    phone = `0${phone}`
  }
  return phone
}

function isClipboardIdentifier(raw: string) {
  const compact = compactClipboard(raw)
  return Boolean(compact) && /^[+()/\s\-.\d]+$/.test(compact)
}

/** اگر کل متن کلیپ‌بورد کد ملی یا همراه ایرانی باشد، مقدار نرمال را برمی‌گرداند. */
export function parseClipboardNationalIdOrPhone(raw: string) {
  if (!isClipboardIdentifier(raw)) return null
  const compact = compactClipboard(raw)
  const digits = compact.replace(/\D/g, '')
  if (!digits) return null

  const prefix = compact.replace(/[\s\-().]/g, '')
  const mobile = normalizeClipboardMobile(compact)
  const isMobile = /^09\d{9}$/.test(mobile)
  const clearlyPhone =
    isMobile &&
    (digits.length === 11 ||
      digits.length >= 12 ||
      prefix.startsWith('+98') ||
      prefix.startsWith('0098') ||
      prefix.startsWith('09'))

  if (clearlyPhone) return mobile
  if (isValidIranianNationalId(digits)) return normalizeNationalId(digits)
  if (isMobile && digits.length === 10 && digits.startsWith('9')) return mobile
  return null
}
