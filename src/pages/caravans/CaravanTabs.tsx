import { MapPinned } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { placementTabClassName } from '../../components/ui/placementTab'

export const caravanTabs = ['basic', 'contacts', 'extra', 'license', 'social', 'years'] as const

export type CaravanTab = (typeof caravanTabs)[number] | 'placement'

export function CaravanTabNav({
  tab,
  tabs = [...caravanTabs],
  onChange,
}: {
  tab: CaravanTab
  tabs?: CaravanTab[]
  onChange: (tab: CaravanTab) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
      {tabs.map((item) => {
        const active = tab === item
        const highlighted = item === 'placement'
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm transition ${
              highlighted
                ? placementTabClassName(active)
                : active
                  ? 'bg-teal-500 font-medium text-white shadow-sm'
                  : 'bg-white font-medium text-ink-700 hover:bg-cream-100'
            }`}
          >
            {highlighted ? <MapPinned className="size-3.5" aria-hidden /> : null}
            {highlighted ? t('placements.highlightTab') : t(`caravans.tabs.${item}`)}
          </button>
        )
      })}
    </nav>
  )
}
