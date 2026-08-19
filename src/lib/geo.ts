import { useTranslation } from 'react-i18next'
import type { GeoName } from '../types/app'

export function geoName(item: GeoName, locale: string) {
  const useEn = locale === 'en' || locale === 'hi'
  if (useEn) {
    return item.nameEn || item.nameFa
  }
  return item.nameFa || item.nameEn
}

export function useGeoName() {
  const { i18n } = useTranslation()
  const locale = i18n.language.split('-')[0]
  return (item: GeoName) => geoName(item, locale)
}

export function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
