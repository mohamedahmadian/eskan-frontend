import { Eye, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { cardClassName, FormCardHeader, FormEmptyHint } from '../../components/ui/FormLayout'
import { formatNumber } from '../../lib/datetime'

export type DashboardFeedItem = {
  id: string
  title: string
  subtitle?: string
  date: string
}

/** Clickable dashboard card: total count + latest entries, opens the related list page. */
export function DashboardFeedCard({
  to,
  icon,
  itemIcon: ItemIcon,
  title,
  hint,
  countLabel,
  emptyText,
  viewLabel,
  total,
  loading,
  items,
  className = '',
}: {
  to: string
  icon: LucideIcon
  itemIcon: LucideIcon
  title: ReactNode
  hint: ReactNode
  countLabel: string
  emptyText: string
  viewLabel: string
  total?: number
  loading: boolean
  items: DashboardFeedItem[]
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()

  return (
    <section
      className={`${cardClassName} flex cursor-pointer flex-col overflow-hidden transition hover:-translate-y-0.5 ${className}`}
      onClick={() => navigate(to)}
    >
      <FormCardHeader
        icon={icon}
        title={title}
        subtitle={hint}
        action={
          <div className="flex flex-col items-center rounded-2xl bg-white/90 px-3 py-1.5 ring-1 ring-teal-100">
            <span className="text-xl font-bold leading-7 text-teal-700">
              {total != null ? formatNumber(total, locale) : '—'}
            </span>
            <span className="text-[11px] text-ink-500">{countLabel}</span>
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-ink-400">{t('common.loading')}</p>
        ) : items.length ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-teal-100/80 bg-teal-50/40 px-3 py-2"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-teal-100">
                  <ItemIcon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-ink-500">{item.subtitle}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-ink-400">
                  <DateText value={item.date} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <FormEmptyHint>{emptyText}</FormEmptyHint>
        )}
        <div className="mt-auto flex justify-end pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation()
              navigate(to)
            }}
          >
            <Eye className="size-4" aria-hidden />
            {viewLabel}
          </Button>
        </div>
      </div>
    </section>
  )
}
