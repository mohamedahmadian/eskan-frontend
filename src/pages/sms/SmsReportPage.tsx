import { useState } from 'react'
import { ChartColumn, Eye, FileCode2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { DateText } from '../../components/ui/DateText'
import { AppModal } from '../../components/ui/AppModal'
import {
  ActionsTh,
  PaginationBar,
  SearchBar,
  TableCard,
  actionsColClassName,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { FormCard, FormEmptyHint } from '../../components/ui/FormLayout'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import type { SmsMessage } from '../../lib/sms'
import type { Paginated } from '../../types/app'

export function SmsReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()
  const [viewing, setViewing] = useState<SmsMessage | null>(null)

  const query = useQuery({
    queryKey: ['sms', 'messages', q, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<SmsMessage>>('/sms/messages', {
        params: { q: q || undefined, page },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={ChartColumn}
        title={t('menus.smsReport')} subtitle={t('sms.reportSubtitle')} />
      <SearchBar
        inputId="sms-report-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('common.search')}
        placeholder={t('sms.reportSearchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('sms.noResults') : t('sms.empty')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('sms.recipientName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('sms.phone')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('sms.body')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('sms.status')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('sms.sentAt')}</th>
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.recipientName || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                  {localizeDigits(item.phone, locale)}
                </td>
                <td className="max-w-md px-4 py-3 break-words">{item.body}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      item.status === 'SENT' ? 'text-teal-700' : 'text-red-700'
                    }
                  >
                    {t(`sms.status${item.status === 'SENT' ? 'Sent' : 'Failed'}`)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <DateText value={item.createdAt} withTime />
                </td>
                <td className={actionsColClassName}>
                  <div data-row-actions className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                    <Button
                      type="button"
                      variant="ghost"
                      data-row-view
                      onClick={() => setViewing(item)}
                    >
                      <Eye className="size-4" aria-hidden />
                      {t('common.view')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
      {viewing ? (
        <SmsProviderResponseModal
          item={viewing}
          locale={locale}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </div>
  )
}

function SmsProviderResponseModal({
  item,
  locale,
  onClose,
}: {
  item: SmsMessage
  locale: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const name = item.recipientName?.trim() || '—'
  const phone = localizeDigits(item.phone, locale)
  const response = item.providerResponse?.trim()

  return (
    <AppModal
      onClose={onClose}
      ariaLabel={t('sms.providerResponse')}
      overlayClassName="flex items-start justify-center p-4 sm:p-6"
      className="mb-4 w-full max-w-5xl"
    >
      <FormCard
        icon={FileCode2}
        title={t('sms.providerResponse')}
        subtitle={`${name} · ${phone}`}
      >
        <div className="max-h-[min(80vh,48rem)] overflow-y-auto p-5 sm:p-6">
          {response ? (
            <pre
              className="min-h-[24rem] whitespace-pre-wrap break-all rounded-2xl border border-line bg-cream-50 p-4 text-sm leading-7 text-ink-800"
              dir="ltr"
            >
              {response}
            </pre>
          ) : (
            <FormEmptyHint>{t('sms.providerResponseEmpty')}</FormEmptyHint>
          )}
        </div>
      </FormCard>
    </AppModal>
  )
}
