import type { AppLanguage } from '../i18n'

export const REGISTER_OTHER_COUNTRY = 'other'

export function registerLocaleFromCountryIso2(iso2?: string | null): AppLanguage {
  const code = iso2?.trim().toUpperCase()
  if (code === 'IR') return 'fa'
  if (code === 'IQ') return 'ar'
  return 'en'
}
