import { Globe2, Milestone, Route, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const walkingRouteTabs = ['general', 'originCountries', 'stages'] as const

export type WalkingRouteTab = (typeof walkingRouteTabs)[number]

export const walkingRouteTabIcons: Record<WalkingRouteTab, LucideIcon> = {
  general: Route,
  originCountries: Globe2,
  stages: Milestone,
}

export function WalkingRouteTabNav({
  tab,
  onChange,
}: {
  tab: WalkingRouteTab
  onChange: (tab: WalkingRouteTab) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
      {walkingRouteTabs.map((item) => {
        const Icon = walkingRouteTabIcons[item]
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
            {t(`walkingRoutes.tabs.${item}`)}
          </button>
        )
      })}
    </nav>
  )
}
