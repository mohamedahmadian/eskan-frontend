import { MapPinned, Milestone, Shirt, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const walkingStationFormTabs = ['info', 'amenities', 'location'] as const

export type WalkingStationFormTab = (typeof walkingStationFormTabs)[number]

export const walkingStationFormTabIcons: Record<WalkingStationFormTab, LucideIcon> = {
  info: Milestone,
  amenities: Shirt,
  location: MapPinned,
}

export function WalkingStationFormTabNav({
  tab,
  onChange,
}: {
  tab: WalkingStationFormTab
  onChange: (tab: WalkingStationFormTab) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
      {walkingStationFormTabs.map((item) => {
        const Icon = walkingStationFormTabIcons[item]
        const active = tab === item
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                : 'bg-white text-ink-700 hover:bg-cream-100'
            }`}
          >
            <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
            {t(`walkingStations.tabs.${item}`)}
          </button>
        )
      })}
    </nav>
  )
}
