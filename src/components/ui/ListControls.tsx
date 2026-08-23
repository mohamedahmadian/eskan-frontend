import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { type FormEvent, type MouseEvent, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../lib/datetime'
import { AppForm, Button, FormField, cardClassName, fieldClassName } from './Form'
import { LoadingState } from './LoadingState'

export type SortDir = 'asc' | 'desc'

/** Cycles: none → asc → desc → none. Persists via caller (URL params). */
export function nextSortState(
  column: string,
  sortBy: string,
  sortDir: SortDir | '',
): { sortBy?: string; sortDir?: SortDir } {
  if (sortBy !== column || !sortDir) {
    return { sortBy: column, sortDir: 'asc' }
  }
  if (sortDir === 'asc') {
    return { sortBy: column, sortDir: 'desc' }
  }
  return { sortBy: undefined, sortDir: undefined }
}

export function SortableTh({
  column,
  label,
  sortBy,
  sortDir,
  onSort,
}: {
  column: string
  label: string
  sortBy: string
  sortDir: SortDir | ''
  onSort: (column: string) => void
}) {
  const { t } = useTranslation()
  const active = sortBy === column && (sortDir === 'asc' || sortDir === 'desc')
  const ariaSort = !active ? 'none' : sortDir === 'asc' ? 'ascending' : 'descending'
  const nextHint =
    !active ? t('common.sortAsc') : sortDir === 'asc' ? t('common.sortDesc') : t('common.sortClear')

  return (
    <th className="px-4 py-3 text-start font-medium" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(column)}
        title={nextHint}
        aria-label={`${label} — ${nextHint}`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 -mx-1 text-start font-medium transition hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
          active ? 'text-teal-800' : 'text-ink-700'
        }`}
      >
        <span>{label}</span>
        {active && sortDir === 'asc' ? (
          <ArrowUp className="size-3.5 shrink-0 text-teal-600" aria-hidden />
        ) : active && sortDir === 'desc' ? (
          <ArrowDown className="size-3.5 shrink-0 text-teal-600" aria-hidden />
        ) : (
          <ArrowUpDown className="size-3.5 shrink-0 text-ink-300" aria-hidden />
        )}
      </button>
    </th>
  )
}

const filtersOpenById = new Map<string, boolean>()

export function FilterPair({
  children,
  columns = 2,
}: {
  children: ReactNode
  columns?: 2 | 3
}) {
  return (
    <div
      className={`grid gap-4 sm:col-span-2 ${
        columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
      }`}
    >
      {children}
    </div>
  )
}

export function SearchBar({
  term,
  onTermChange,
  onSubmit,
  label,
  placeholder,
  extra,
  beside,
  filtersActive = false,
  extraClassName = 'sm:grid-cols-2',
  inputId = 'list-search',
  autoFocus = false,
}: {
  term: string
  onTermChange: (value: string) => void
  onSubmit: () => void
  label: string
  placeholder: string
  extra?: ReactNode
  beside?: ReactNode
  filtersActive?: boolean
  extraClassName?: string
  inputId?: string
  autoFocus?: boolean
}) {
  const { t } = useTranslation()
  const [filtersOpen, setFiltersOpen] = useState(() => filtersOpenById.get(inputId) ?? false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  function toggleFilters() {
    setFiltersOpen((open) => {
      const next = !open
      filtersOpenById.set(inputId, next)
      return next
    })
  }

  const searchInput = (
    <input
      id={inputId}
      className={`${fieldClassName} min-w-0 ${beside ? 'w-full' : 'flex-1'}`}
      value={term}
      onChange={(e) => onTermChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  )
  const searchButton = (
    <Button type="submit" className={`shrink-0 sm:min-w-28 ${beside ? 'w-full lg:w-auto' : ''}`}>
      <Search className="size-4" aria-hidden />
      {t('common.search')}
    </Button>
  )

  return (
    <AppForm onSubmit={handleSubmit} className={`mb-4 p-4 ${cardClassName}`}>
      {beside ? (
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <FormField icon={Search} label={label} htmlFor={inputId}>
              {searchInput}
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:contents">{beside}</div>
          {searchButton}
        </div>
      ) : (
        <FormField icon={Search} label={label} htmlFor={inputId}>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {searchInput}
            {searchButton}
          </div>
        </FormField>
      )}
      {extra ? (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={toggleFilters}
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-cream-50"
          >
            <SlidersHorizontal className="size-4 text-teal-600" aria-hidden />
            {t('common.filters')}
            {filtersActive ? (
              <span className="size-2 rounded-full bg-teal-500" aria-hidden />
            ) : null}
            <ChevronDown
              className={`size-4 text-ink-400 transition ${filtersOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          <div
            className={`mt-3 grid gap-4 border-t border-line pt-4 ${extraClassName} ${
              filtersOpen ? '' : 'hidden'
            }`}
          >
            {extra}
          </div>
        </div>
      ) : null}
    </AppForm>
  )
}

export function EntityRowActions({
  viewTo,
  extra,
  editTo,
  onDelete,
  canDelete = true,
}: {
  viewTo: string
  extra?: ReactNode
  editTo?: string
  onDelete?: () => void
  canDelete?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
      <Link to={viewTo} data-row-view>
        <Button type="button" variant="ghost">
          <Eye className="size-4" aria-hidden />
          {t('common.view')}
        </Button>
      </Link>
      {extra}
      {editTo ? (
        <Link to={editTo} aria-label={t('common.edit')} title={t('common.edit')}>
          <Button type="button" variant="ghost" icon>
            <Pencil className="size-4" aria-hidden />
          </Button>
        </Link>
      ) : null}
      {canDelete && onDelete ? (
        <Button
          type="button"
          variant="ghost"
          icon
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          aria-label={t('common.delete')}
          title={t('common.delete')}
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  startExtra,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  startExtra?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0 && !startExtra) {
    return null
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {startExtra}
        {total > 0 ? (
          <p className="text-sm text-ink-500">
            {t('common.showingRange', {
              from: formatNumber(from, locale),
              to: formatNumber(to, locale),
              total: formatNumber(total, locale),
            })}
          </p>
        ) : null}
      </div>
      {total > 0 ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t('common.prevPage')}
          </Button>
          <span className="min-w-16 text-center text-sm text-ink-700">
            {t('common.pageOf', {
              page: formatNumber(page, locale),
              pages: formatNumber(pageCount, locale),
            })}
          </span>
          <Button
            type="button"
            variant="ghost"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {t('common.nextPage')}
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function TableCard({
  loading,
  empty,
  hasRows,
  rowClick = true,
  children,
}: {
  loading?: boolean
  empty: string
  hasRows: boolean
  rowClick?: boolean
  children: ReactNode
}) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!rowClick) return
    const target = event.target as HTMLElement
    if (target.closest('a, button, input, textarea, select, label, [role="button"]')) {
      return
    }
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      return
    }
    const row = target.closest('tbody tr')
    if (!(row instanceof HTMLElement) || !event.currentTarget.contains(row)) {
      return
    }
    row.querySelector<HTMLElement>('[data-row-view]')?.click()
  }

  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)] ${
        rowClick
          ? '[&_tbody_tr:has([data-row-view])]:cursor-pointer [&_tbody_tr:has([data-row-view])]:hover:bg-cream-50'
          : ''
      }`}
      onClick={handleClick}
    >
      {hasRows ? (
        children
      ) : loading ? (
        <LoadingState variant="inline" />
      ) : (
        <p className="px-4 py-10 text-center text-ink-500">{empty}</p>
      )}
    </div>
  )
}
