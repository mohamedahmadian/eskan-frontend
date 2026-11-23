export const accommodationTypeIconValues = [
  'school',
  'landmark',
  'building',
  'building-2',
  'home',
  'tent',
  'hospital',
  'store',
  'map-pin',
] as const

export type AccommodationTypeIconValue = (typeof accommodationTypeIconValues)[number]
