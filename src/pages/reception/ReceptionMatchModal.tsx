import {
  Building2,
  ClipboardList,
  Footprints,
  HandHeart,
  IdCard,
  MapPin,
  Phone,
  Tent,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button, cardClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { PaginationBar } from '../../components/ui/ListControls'
import { languageDir } from '../../i18n'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { ReceptionRecord, ReceptionRecordType, ReceptionSearchScope } from '../../types/app'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { ReservationStatusBadge, ReservationTypeBadge } from '../reservations/ReservationStatusBadge'
import { ReceptionMatchRoles } from './ReceptionKindChips'

type PickTab = 'all' | ReceptionRecordType | 'caravanManager' | 'accommodationManager' | 'honorary'

const typeTabs: { id: ReceptionRecordType; labelKey: string; icon: LucideIcon }[] = [
  { id: 'person', labelKey: 'reception.pickTabPeople', icon: UserRound },
  { id: 'reservation', labelKey: 'reception.pickTabFiles', icon: ClipboardList },
  { id: 'caravan', labelKey: 'reception.pickTabCaravans', icon: Tent },
  { id: 'accommodation', labelKey: 'reception.pickTabAccommodations', icon: Building2 },
  { id: 'walkingStation', labelKey: 'reception.pickTabStations', icon: Footprints },
  { id: 'benefactor', labelKey: 'reception.pickTabBenefactors', icon: HandHeart },
]

const personKindTabs: { id: PickTab; labelKey: string; icon: LucideIcon }[] = [
  { id: 'caravanManager', labelKey: 'reception.pickTabCaravan', icon: Tent },
  { id: 'accommodationManager', labelKey: 'reception.pickTabHousing', icon: Building2 },
  { id: 'honorary', labelKey: 'reception.pickTabHonorary', icon: HandHeart },
]

const recordIcon: Record<ReceptionRecordType, LucideIcon> = {
  person: UserRound,
  reservation: ClipboardList,
  caravan: Tent,
  accommodation: Building2,
  walkingStation: Footprints,
  benefactor: HandHeart,
}

function filterRecords(records: ReceptionRecord[], tab: PickTab) {
  if (tab === 'all') return records
  if (tab === 'caravanManager' || tab === 'accommodationManager') {
    return records.filter(
      (item) => item.type === 'person' && item.person?.kinds.includes(tab),
    )
  }
  if (tab === 'honorary') {
    return records.filter((item) => item.type === 'person' && item.person?.hasHonoraryService)
  }
  return records.filter((item) => item.type === tab)
}

export function ReceptionMatchModal({
  records,
  total,
  page = 1,
  pageSize = 20,
  scope = 'primary',
  searchKey = '',
  loading = false,
  onClose,
  onSelect,
  onPageChange,
}: {
  records: ReceptionRecord[]
  total: number
  page?: number
  pageSize?: number
  scope?: ReceptionSearchScope
  searchKey?: string
  loading?: boolean
  onClose: () => void
  onSelect: (record: ReceptionRecord) => void
  onPageChange?: (page: number) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const onlyPeople = records.length > 0 && records.every((item) => item.type === 'person')
  const [tab, setTab] = useState<PickTab>('all')
  const wasOnlyPeopleRef = useRef(true)

  useEffect(() => {
    setTab('all')
    wasOnlyPeopleRef.current = true
  }, [searchKey])

  useEffect(() => {
    if (wasOnlyPeopleRef.current && !onlyPeople && (tab === 'all' || tab === 'caravanManager' || tab === 'accommodationManager')) {
      setTab('person')
    }
    wasOnlyPeopleRef.current = onlyPeople
  }, [onlyPeople, tab])

  const visible = useMemo(() => filterRecords(records, tab), [records, tab])

  const [activeIndex, setActiveIndex] = useState(-1)
  const activeIndexRef = useRef(-1)
  const visibleRef = useRef(visible)
  const onSelectRef = useRef(onSelect)
  const rootRef = useRef<HTMLDivElement>(null)
  const tabRef = useRef(tab)
  const tabsListRef = useRef<PickTab[]>([])
  const dirRef = useRef(languageDir(locale))
  const focusTabAfterChangeRef = useRef(false)
  activeIndexRef.current = activeIndex
  visibleRef.current = visible
  onSelectRef.current = onSelect
  tabRef.current = tab
  dirRef.current = languageDir(locale)

  useEffect(() => {
    setActiveIndex(-1)
    if (!focusTabAfterChangeRef.current) return
    focusTabAfterChangeRef.current = false
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>(`[data-pick-tab="${tab}"]`)
        ?.focus()
    })
  }, [tab, searchKey, page])

  useEffect(() => {
    setActiveIndex((index) => {
      if (index < 0) return index
      if (visible.length === 0) return -1
      return Math.min(index, visible.length - 1)
    })
  }, [visible.length])

  useEffect(() => {
    if (activeIndex < 0) return
    const el = rootRef.current?.querySelector<HTMLButtonElement>(
      `[data-pick-item="${activeIndex}"]`,
    )
    if (!el) return
    el.focus()
    el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      const target = event.target as HTMLElement | null

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const tabIds = tabsListRef.current
        if (tabIds.length < 2) return
        event.preventDefault()
        const current = Math.max(0, tabIds.indexOf(tabRef.current))
        const step = event.key === 'ArrowRight' ? 1 : -1
        const visualStep = dirRef.current === 'rtl' ? -step : step
        const next = (current + visualStep + tabIds.length) % tabIds.length
        focusTabAfterChangeRef.current = true
        setTab(tabIds[next])
        return
      }

      if (target?.closest('[data-pick-ignore]')) return

      const list = visibleRef.current
      if (!list.length) return

      if (event.key === 'Enter') {
        if (event.repeat || event.shiftKey) return
        if (target?.closest('[role="tab"]')) return
        const index = activeIndexRef.current
        if (index < 0 || !list[index]) return
        if (target?.closest('[data-pick-item]')) return
        event.preventDefault()
        event.stopPropagation()
        onSelectRef.current(list[index])
        return
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

      event.preventDefault()
      const last = list.length - 1
      const index = activeIndexRef.current
      if (event.key === 'ArrowDown') {
        setActiveIndex(index < 0 ? 0 : Math.min(index + 1, last))
        return
      }
      if (index < 0) {
        setActiveIndex(last)
        return
      }
      if (index === 0) {
        const tabEl = rootRef.current?.querySelector<HTMLElement>(
          '[role="tab"][aria-selected="true"]',
        )
        if (tabEl) {
          setActiveIndex(-1)
          tabEl.focus()
        }
        return
      }
      setActiveIndex(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const typeCounts = useMemo(() => {
    const counts = {
      all: onlyPeople ? total : records.length,
      person: 0,
      reservation: 0,
      caravan: 0,
      accommodation: 0,
      walkingStation: 0,
      benefactor: 0,
      caravanManager: 0,
      accommodationManager: 0,
      honorary: 0,
    }
    for (const item of records) {
      counts[item.type] += 1
      if (item.type === 'person' && item.person?.kinds.includes('caravanManager')) {
        counts.caravanManager += 1
      }
      if (item.type === 'person' && item.person?.kinds.includes('accommodationManager')) {
        counts.accommodationManager += 1
      }
      if (item.type === 'person' && item.person?.hasHonoraryService) {
        counts.honorary += 1
      }
    }
    if (!onlyPeople) {
      counts.person = records.filter((item) => item.type === 'person').length
    }
    return counts
  }, [records, onlyPeople, total])

  const tabs = useMemo(() => {
    const extra = onlyPeople
      ? personKindTabs.filter((item) => typeCounts[item.id] > 0)
      : typeTabs.filter((item) => typeCounts[item.id] > 0)
    if (extra.length === 0) return []
    if (extra.length === 1 && !onlyPeople) return []
    return [
      {
        id: 'all' as const,
        labelKey: onlyPeople ? 'reception.pickTabAll' : 'reception.pickTabEverything',
        icon: Users,
      },
      ...extra,
    ]
  }, [onlyPeople, typeCounts])
  tabsListRef.current = tabs.map((item) => item.id)

  return createPortal(
    <div
      ref={rootRef}
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
              {t(
                scope === 'extended' ? 'reception.pickHintExtended' : 'reception.pickHint',
                { count: localizeDigits(String(total), locale) },
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            data-pick-ignore
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        {tabs.length > 1 ? (
        <nav
          role="tablist"
          aria-label={t('reception.pickTitle')}
          className="flex flex-wrap gap-1.5 border-b border-line bg-cream-50/80 px-4 py-2.5 sm:px-5"
        >
          {tabs.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            const count = typeCounts[item.id]
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-pick-tab={item.id}
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
        ) : null}
        {visible.length ? (
          <ul className={`min-h-0 flex-1 space-y-2 overflow-y-auto p-4 sm:p-5 ${loading ? 'opacity-60' : ''}`}>
            {visible.map((item, index) => {
              const Icon = recordIcon[item.type]
              const person = item.person
              const selected = index === activeIndex
              return (
                <li key={`${item.type}:${item.id}`}>
                  <button
                    type="button"
                    data-pick-item={index}
                    aria-current={selected ? 'true' : undefined}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => onSelect(item)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border bg-white p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                      selected
                        ? 'border-teal-400 bg-sky-50/70 shadow-[0_8px_22px_rgba(56,189,248,0.16)] ring-2 ring-teal-400'
                        : 'border-line hover:border-sky-200 hover:bg-sky-50/50 hover:shadow-[0_8px_22px_rgba(56,189,248,0.16)]'
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1.5">
                      {item.type === 'reservation' && item.code ? (
                        <span className="flex flex-wrap items-center gap-1.5">
                          <ReservationCodeBadge code={item.code} size="sm" />
                          {item.reservationType ? (
                            <ReservationTypeBadge type={item.reservationType} />
                          ) : null}
                          {item.status ? <ReservationStatusBadge status={item.status} /> : null}
                        </span>
                      ) : (
                        <span className="block font-semibold text-ink-900">{item.title}</span>
                      )}
                      {item.type !== 'person' ? (
                        <span className="block text-[11px] font-medium text-teal-700">
                          {t(`reception.recordType.${item.type}`)}
                        </span>
                      ) : null}
                      <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
                        {item.type === 'accommodation' && item.subtitle ? (
                          <span className="truncate">{t(`accommodationTypes.${item.subtitle}`)}</span>
                        ) : item.subtitle ? (
                          <span className="truncate">{item.subtitle}</span>
                        ) : null}
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
                    {person ? (
                      <ReceptionMatchRoles
                        roles={person.roles}
                        kinds={person.kinds}
                        hasHonoraryService={person.hasHonoraryService}
                      />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="p-4 sm:p-5">
            <FormEmptyHint>{t('reception.pickEmptyTab')}</FormEmptyHint>
          </div>
        )}
        {onPageChange && (onlyPeople ? tab === 'all' : tab === 'person') && total > pageSize ? (
          <div className="shrink-0 border-t border-line px-4 py-3 sm:px-5" data-pick-ignore>
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
