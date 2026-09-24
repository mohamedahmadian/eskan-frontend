import { localizeDigits } from './datetime'
import { haversineKm } from './geo'

/** مختصات حرم مطهر امام رضا (ع) در مشهد. */
export const IMAM_REZA_SHRINE = {
  latitude: 36.288526379102194,
  longitude: 59.61604269512296,
} as const

/** سرعت پیاده‌روی متعارف برای برآورد زمان، کیلومتر بر ساعت. */
const WALKING_SPEED_KMH = 5

export type ShrineDistance = {
  /** فاصلهٔ مستقیم تا حرم، کیلومتر. */
  km: number
  /** زمان تقریبی پیاده‌روی، دقیقه. صفر یعنی کمتر از یک دقیقه. */
  walkMinutes: number
}

export function distanceToShrine(latitude: number, longitude: number): ShrineDistance {
  const km = haversineKm(
    latitude,
    longitude,
    IMAM_REZA_SHRINE.latitude,
    IMAM_REZA_SHRINE.longitude,
  )
  if (!Number.isFinite(km) || km <= 0) {
    return { km: 0, walkMinutes: 0 }
  }
  const minutes = Math.round((km / WALKING_SPEED_KMH) * 60)
  return { km, walkMinutes: minutes < 1 ? 0 : minutes }
}

/** فاصله برای نمایش: زیر یک کیلومتر به متر، وگرنه تا یک رقم اعشار. */
export function formatShrineDistanceValue(km: number, locale: string) {
  if (km < 1) {
    return {
      unit: 'm' as const,
      value: localizeDigits(String(Math.round(km * 1000)), locale),
    }
  }
  const rounded = Math.round(km * 10) / 10
  const raw = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return { unit: 'km' as const, value: localizeDigits(raw, locale) }
}
