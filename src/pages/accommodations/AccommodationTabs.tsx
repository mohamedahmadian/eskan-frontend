import { useTranslation } from 'react-i18next'

export const accommodationTabs = [
  'general',
  'location',
  'capacity',
  'amenities',
  'social',
  'contacts',
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
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
            tab === item
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-white text-ink-700 hover:bg-cream-100'
          }`}
        >
          {t(`accommodations.tabs.${item}`)}
        </button>
      ))}
    </nav>
  )
}
