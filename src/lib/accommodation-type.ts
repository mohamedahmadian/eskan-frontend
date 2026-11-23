import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { geoName } from './geo'
import type { AccommodationType, AccommodationTypeRef, GeoName } from '../types/app'

export function accommodationTypeLabel(
  type: AccommodationTypeRef | string | null | undefined,
  nameOf: (item: GeoName) => string,
) {
  if (!type) return '—'
  if (typeof type === 'string') return type
  return nameOf(type)
}

export function isSchoolAccommodationType(
  type: AccommodationTypeRef | string | null | undefined,
) {
  if (!type) return false
  const code = typeof type === 'string' ? type : type.code
  return code === 'school' || code === 'SCHOOL'
}

export function useAccommodationTypesLookup(activeOnly = true) {
  return useQuery({
    queryKey: ['accommodation-types', 'lookup', activeOnly],
    queryFn: async () => {
      const { data } = await api.get<AccommodationType[]>('/accommodation-types', {
        params: activeOnly ? { activeOnly: true } : undefined,
      })
      return data
    },
  })
}

export function defaultAccommodationTypeId(items: AccommodationType[] | undefined) {
  if (!items?.length) return ''
  return items.find((item) => item.code === 'lodging')?.id ?? items[0].id
}

export function accommodationTypeOptionLabel(
  item: AccommodationTypeRef,
  locale: string,
) {
  return geoName(item, locale)
}
