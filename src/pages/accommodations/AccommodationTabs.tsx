import { useTranslation } from 'react-i18next'
import { cardClassName } from '../../components/ui/Form'

export const accommodationTabs = [
  'general',
  'location',
  'capacity',
  'amenities',
  'social',
  'managers',
] as const

export type AccommodationTab = (typeof accommodationTabs)[number]

export function AccommodationTabNav({
  tab,
  tabs,
  onChange,
}: {
  tab: AccommodationTab
  tabs: AccommodationTab[]
  onChange: (tab: AccommodationTab) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
            tab === item
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
          }`}
        >
          {t(`accommodations.tabs.${item}`)}
        </button>
      ))}
    </nav>
  )
}
