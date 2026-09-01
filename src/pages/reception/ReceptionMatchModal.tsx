import {
  Building2,
  IdCard,
  MapPin,
  Phone,
  Tent,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button, cardClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { ReceptionMatch } from '../../types/app'
import { ReceptionMatchRoles } from './ReceptionKindChips'

type PickTab = 'all' | 'caravanManager' | 'accommodationManager'

const tabs: { id: PickTab; labelKey: string; icon: LucideIcon }[] = [
  { id: 'all', labelKey: 'reception.pickTabAll', icon: Users },
  { id: 'caravanManager', labelKey: 'reception.pickTabCaravan', icon: Tent },
  { id: 'accommodationManager', labelKey: 'reception.pickTabHousing', icon: Building2 },
]

function filterMatches(matches: ReceptionMatch[], tab: PickTab) {
  if (tab === 'all') return matches
  return matches.filter((item) => item.kinds.includes(tab))
}

export function ReceptionMatchModal({
  matches,
  total,
  onClose,
  onSelect,
}: {
  matches: ReceptionMatch[]
  total: number
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const [tab, setTab] = useState<PickTab>('all')

  useEffect(() => {
    setTab('all')
  }, [matches])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const counts = useMemo(
    () => ({
      all: matches.length,
      caravanManager: matches.filter((item) => item.kinds.includes('caravanManager')).length,
      accommodationManager: matches.filter((item) =>
        item.kinds.includes('accommodationManager'),
      ).length,
    }),
    [matches],
  )
  const visible = filterMatches(matches, tab)

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      data-nested-dialog
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reception-match-title"
        className={`relative z-10 flex max-h-[min(90vh,44rem)] w-full max-w-2xl flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="reception-match-title"
              className="text-base font-semibold text-ink-900"
            >
              {t('reception.pickTitle')}
            </h2>
            <p className="mt-1 text-xs leading-6 text-ink-600">
              {t('reception.pickHint', { count: localizeDigits(String(total), locale) })}
            </p>
            {total > matches.length ? (
              <p className="mt-1 text-xs text-ink-500">
                {t('reception.pickMore', {
                  shown: localizeDigits(String(matches.length), locale),
                  total: localizeDigits(String(total), locale),
                })}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.cancel')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <nav
          role="tablist"
          aria-label={t('reception.pickTitle')}
          className="flex flex-wrap gap-1.5 border-b border-line bg-cream-50/80 px-4 py-2.5 sm:px-5"
        >
          {tabs.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            const count = counts[item.id]
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'bg-white text-ink-700 hover:bg-cream-100'
                }`}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {t(item.labelKey)}
                <span
                  className={`rounded-full px-1.5 text-[11px] ${
                    active ? 'bg-white/20 text-white' : 'bg-cream-100 text-ink-500'
                  }`}
                >
                  {formatNumber(count, locale)}
                </span>
              </button>
            )
          })}
        </nav>
        {visible.length ? (
          <ul className="space-y-2 overflow-y-auto p-4 sm:p-5">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-3 text-start transition hover:border-sky-200 hover:bg-sky-50/50 hover:shadow-[0_8px_22px_rgba(56,189,248,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white">
                    <UserRound className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="block font-semibold text-ink-900">{item.fullName}</span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                      {item.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3.5 shrink-0" aria-hidden />
                          {localizeDigits(item.phone, locale)}
                        </span>
                      ) : null}
                      {item.nationalId ? (
                        <span className="inline-flex items-center gap-1">
                          <IdCard className="size-3.5 shrink-0" aria-hidden />
                          {localizeDigits(item.nationalId, locale)}
                        </span>
                      ) : null}
                      {item.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          {nameOf(item.city)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <ReceptionMatchRoles
                    roles={item.roles}
                    kinds={item.kinds}
                    hasHonoraryService={item.hasHonoraryService}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 sm:p-5">
            <FormEmptyHint>{t('reception.pickEmptyTab')}</FormEmptyHint>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
