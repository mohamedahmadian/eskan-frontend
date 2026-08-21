import { useTranslation } from 'react-i18next'
import { cardClassName } from '../../components/ui/Form'

export const caravanTabs = ['basic', 'contacts', 'extra', 'license', 'social'] as const

export type CaravanTab = (typeof caravanTabs)[number]

export function CaravanTabNav({
  tab,
  onChange,
}: {
  tab: CaravanTab
  onChange: (tab: CaravanTab) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
      {caravanTabs.map((item) => (
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
          {t(`caravans.tabs.${item}`)}
        </button>
      ))}
    </nav>
  )
}
