import { useTranslation } from 'react-i18next'

export const caravanTabs = ['basic', 'contacts', 'extra', 'license', 'social', 'years'] as const

export type CaravanTab = (typeof caravanTabs)[number]

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
          {t(`caravans.tabs.${item}`)}
        </button>
      ))}
    </nav>
  )
}
