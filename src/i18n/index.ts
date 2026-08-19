import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'
import fa from './locales/fa.json'
import hi from './locales/hi.json'
import ur from './locales/ur.json'

export const languages = {
  fa: { dir: 'rtl' as const, enabled: true },
  ar: { dir: 'rtl' as const, enabled: false },
  ur: { dir: 'rtl' as const, enabled: false },
  hi: { dir: 'ltr' as const, enabled: false },
  en: { dir: 'ltr' as const, enabled: false },
}

export type AppLanguage = keyof typeof languages

export function applyDocumentLanguage(lang: AppLanguage) {
  const meta = languages[lang]
  document.documentElement.lang = lang
  document.documentElement.dir = meta.dir
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

applyDocumentLanguage('fa')

export default i18n
