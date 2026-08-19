import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2 } from 'lucide-react'
import { type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../lib/datetime'
import { AppForm, Button, FormField, cardClassName, fieldClassName } from './Form'

export function SearchBar({
  term,
  onTermChange,
  onSubmit,
  label,
  placeholder,
  extra,
}: {
  term: string
  onTermChange: (value: string) => void
  onSubmit: () => void
  label: string
  placeholder: string
  extra?: ReactNode
}) {
  const { t } = useTranslation()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <AppForm onSubmit={handleSubmit} className={`mb-4 p-4 ${cardClassName}`}>
      <FormField icon={Search} label={label} htmlFor="list-search">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="list-search"
            className={fieldClassName}
            value={term}
            onChange={(e) => onTermChange(e.target.value)}
            placeholder={placeholder}
          />
          <Button type="submit" className="sm:min-w-28">
            <Search className="size-4" aria-hidden />
            {t('common.search')}
          </Button>
        </div>
      </FormField>
      {extra}
    </AppForm>
  )
}

export function EntityRowActions({
  viewTo,
  editTo,
  onDelete,
  canDelete = true,
}: {
  viewTo: string
  editTo: string
  onDelete?: () => void
  canDelete?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
      <Link to={viewTo}>
        <Button type="button" variant="ghost">
          <Eye className="size-4" aria-hidden />
          {t('common.view')}
        </Button>
      </Link>
      <Link to={editTo} aria-label={t('common.edit')} title={t('common.edit')}>
        <Button type="button" variant="ghost" icon>
          <Pencil className="size-4" aria-hidden />
        </Button>
      </Link>
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
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) {
    return null
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-500">
        {t('common.showingRange', {
          from: formatNumber(from, locale),
          to: formatNumber(to, locale),
          total: formatNumber(total, locale),
        })}
      </p>
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
    </div>
  )
}

export function TableCard({
  loading,
  empty,
  hasRows,
  children,
}: {
  loading?: boolean
  empty: string
  hasRows: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]">
      {hasRows ? (
        children
      ) : (
        <p className="px-4 py-10 text-center text-ink-500">
          {loading ? t('common.loading') : empty}
        </p>
      )}
    </div>
  )
}
