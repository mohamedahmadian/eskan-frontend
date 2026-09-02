import {
  ArrowUpDown,
  Bath,
  BookOpen,
  Car,
  Droplets,
  Flame,
  Maximize2,
  Shirt,
  Snowflake,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../lib/datetime'

type AmenitySource = {
  hasLaundry: boolean
  hasInternet: boolean
  hasPrayerRoom: boolean
  hasElevator: boolean
  heatingSystem?: string | null
  coolingSystem?: string | null
  parkingCapacity?: number | null
  bathroomCount?: number | null
  toiletCount?: number | null
  areaSqm?: number | null
}

export function listPublicAmenityLabels(
  amenities: AmenitySource,
  t: (key: string) => string,
  locale: string,
  i18nPrefix: 'accommodations' | 'walkingStations',
) {
  const items: string[] = []
  if (amenities.hasLaundry) items.push(t(`${i18nPrefix}.hasLaundry`))
  if (amenities.hasInternet) items.push(t(`${i18nPrefix}.hasInternet`))
  if (amenities.hasPrayerRoom) items.push(t(`${i18nPrefix}.hasPrayerRoom`))
  if (amenities.hasElevator) items.push(t(`${i18nPrefix}.hasElevator`))
  if (amenities.heatingSystem) {
    items.push(`${t(`${i18nPrefix}.heatingSystem`)}: ${amenities.heatingSystem}`)
  }
  if (amenities.coolingSystem) {
    items.push(`${t(`${i18nPrefix}.coolingSystem`)}: ${amenities.coolingSystem}`)
  }
  if (amenities.parkingCapacity != null) {
    items.push(`${t(`${i18nPrefix}.parkingCapacity`)} ${formatNumber(amenities.parkingCapacity, locale)}`)
  }
  if (amenities.bathroomCount != null) {
    items.push(`${t(`${i18nPrefix}.bathroomCount`)} ${formatNumber(amenities.bathroomCount, locale)}`)
  }
  if (amenities.toiletCount != null) {
    items.push(`${t(`${i18nPrefix}.toiletCount`)} ${formatNumber(amenities.toiletCount, locale)}`)
  }
  if (amenities.areaSqm != null) {
    items.push(`${t('walkingStations.areaSqm')} ${formatNumber(amenities.areaSqm, locale)}`)
  }
  return items
}

export function hasPublicAmenities(amenities: AmenitySource) {
  return (
    amenities.hasLaundry ||
    amenities.hasInternet ||
    amenities.hasPrayerRoom ||
    amenities.hasElevator ||
    Boolean(amenities.heatingSystem) ||
    Boolean(amenities.coolingSystem) ||
    amenities.parkingCapacity != null ||
    amenities.bathroomCount != null ||
    amenities.toiletCount != null ||
    amenities.areaSqm != null
  )
}

export function PublicAmenityChips({
  i18nPrefix,
  amenities,
}: {
  i18nPrefix: 'accommodations' | 'walkingStations'
  amenities: AmenitySource
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const items: { icon: LucideIcon; label: string }[] = []

  if (amenities.hasLaundry) items.push({ icon: Shirt, label: t(`${i18nPrefix}.hasLaundry`) })
  if (amenities.hasInternet) items.push({ icon: Wifi, label: t(`${i18nPrefix}.hasInternet`) })
  if (amenities.hasPrayerRoom) items.push({ icon: BookOpen, label: t(`${i18nPrefix}.hasPrayerRoom`) })
  if (amenities.hasElevator) items.push({ icon: ArrowUpDown, label: t(`${i18nPrefix}.hasElevator`) })
  if (amenities.heatingSystem) {
    items.push({ icon: Flame, label: `${t(`${i18nPrefix}.heatingSystem`)}: ${amenities.heatingSystem}` })
  }
  if (amenities.coolingSystem) {
    items.push({
      icon: Snowflake,
      label: `${t(`${i18nPrefix}.coolingSystem`)}: ${amenities.coolingSystem}`,
    })
  }
  if (amenities.parkingCapacity != null) {
    items.push({
      icon: Car,
      label: `${t(`${i18nPrefix}.parkingCapacity`)} ${formatNumber(amenities.parkingCapacity, locale)}`,
    })
  }
  if (amenities.bathroomCount != null) {
    items.push({
      icon: Bath,
      label: `${t(`${i18nPrefix}.bathroomCount`)} ${formatNumber(amenities.bathroomCount, locale)}`,
    })
  }
  if (amenities.toiletCount != null) {
    items.push({
      icon: Droplets,
      label: `${t(`${i18nPrefix}.toiletCount`)} ${formatNumber(amenities.toiletCount, locale)}`,
    })
  }
  if (amenities.areaSqm != null) {
    items.push({
      icon: Maximize2,
      label: `${t('walkingStations.areaSqm')} ${formatNumber(amenities.areaSqm, locale)}`,
    })
  }

  if (!items.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-100"
          >
            <Icon className="size-3.5" aria-hidden />
            {item.label}
          </span>
        )
      })}
    </div>
  )
}
