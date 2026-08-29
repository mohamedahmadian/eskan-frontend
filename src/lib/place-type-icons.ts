export const placeTypeIconValues = [
  'hospital',
  'pill',
  'landmark',
  'fuel',
  'utensils-crossed',
  'shield',
  'store',
  'building-2',
  'map-pin',
  'heart-handshake',
] as const

export type PlaceTypeIconValue = (typeof placeTypeIconValues)[number]
