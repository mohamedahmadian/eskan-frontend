import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { DateText } from '../../components/ui/DateText'
import { PaginationBar, SearchBar, TableCard } from '../../components/ui/ListControls'
import { PageHeader, listShellClassName } from '../../components/ui/Form'
import { useListParams } from '../../hooks/useListParams'
import { api } from '../../lib/api'
import type { SmsMessage } from '../../lib/sms'
import type { Paginated } from '../../types/app'

export function SmsReportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()

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
      <PageHeader title={t('menus.smsReport')} subtitle={t('sms.reportSubtitle')} />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('sms.recipientName')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.phone')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.body')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.status')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.providerResponse')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.sentAt')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-line align-top">
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
                  <td className="max-w-xs px-4 py-3">
                    <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all text-xs text-ink-700" dir="ltr">
                      {item.providerResponse || '—'}
                    </pre>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DateText value={item.createdAt} withTime />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}
