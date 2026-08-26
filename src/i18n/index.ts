import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'
import fa from './locales/fa.json'
import hi from './locales/hi.json'
import ur from './locales/ur.json'

export const languages = {
  fa: { dir: 'rtl' as const, enabled: true },
  ar: { dir: 'rtl' as const, enabled: true },
  ur: { dir: 'rtl' as const, enabled: false },
  hi: { dir: 'ltr' as const, enabled: false },
  en: { dir: 'ltr' as const, enabled: false },
}

export type AppLanguage = keyof typeof languages

export const PREFERRED_LOCALE_KEY = 'eskan_preferred_locale'

export function isAppLanguage(value: string): value is AppLanguage {
  return value in languages
}

export function getStoredPreferredLocale(): AppLanguage {
  try {
    const value = localStorage.getItem(PREFERRED_LOCALE_KEY)
    if (value && isAppLanguage(value)) return value
  } catch {
    // ignore
  }
  return 'fa'
}

export function persistPreferredLocale(lang: AppLanguage) {
  try {
    localStorage.setItem(PREFERRED_LOCALE_KEY, lang)
  } catch {
    // ignore
  }
}

export function uiLanguageFor(preferred: AppLanguage): AppLanguage {
  return languages[preferred]?.enabled ? preferred : 'fa'
}

export function applyDocumentLanguage(lang: AppLanguage) {
  const meta = languages[lang]
  document.documentElement.lang = lang
  document.documentElement.dir = meta.dir
}

export function applyUiLanguage(preferred: AppLanguage) {
  const ui = uiLanguageFor(preferred)
  void i18n.changeLanguage(ui)
  applyDocumentLanguage(ui)
}

void i18n.use(initReactI18next).init({
  resources: {
    fa: { translation: fa },
    ar: { translation: ar },
    ur: { translation: ur },
    hi: { translation: hi },
    en: { translation: en },
  },
  lng: 'fa',
  fallbackLng: 'fa',
  interpolation: { escapeValue: false },
})

applyUiLanguage(getStoredPreferredLocale())

export default i18n
