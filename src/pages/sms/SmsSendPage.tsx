import { FileText, Phone, Send } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import { PaginationBar, SearchBar, TableCard } from '../../components/ui/ListControls'
import { AppForm, Button, FormField, PageHeader, cardClassName, fieldClassName, listShellClassName } from '../../components/ui/Form'
import { useListParams } from '../../hooks/useListParams'
import { useSendSms } from '../../hooks/useSendSms'
import { api, getApiErrorMessage } from '../../lib/api'
import type { SmsMessage } from '../../lib/sms'
import type { Paginated } from '../../types/app'

export function SmsSendPage() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState('')
  const sms = useSendSms()
  const { q, page, term, setTerm, applySearch, setPage } = useListParams()

  const history = useQuery({
    queryKey: ['sms', 'messages', q, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<SmsMessage>>('/sms/messages', {
        params: { q: q || undefined, page },
      })
      return data
    },
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await sms.mutateAsync({ phone, body })
      toast.success(t('sms.sent'))
      setBody('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    }
  }

  const rows = history.data?.items ?? []

  return (
    <div className={`${listShellClassName} space-y-8`}>
      <PageHeader title={t('sms.sendTitle')} subtitle={t('sms.sendSubtitle')} />
      <AppForm
        onSubmit={onSubmit}
        className={`mx-auto w-full max-w-xl space-y-4 p-6 ${cardClassName}`}
      >
        <FormField icon={Phone} label={t('sms.phone')} htmlFor="sms-phone">
          <input
            id="sms-phone"
            className={fieldClassName}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
            required
          />
        </FormField>
        <FormField icon={FileText} label={t('sms.body')} htmlFor="sms-body">
          <textarea
            id="sms-body"
            className={fieldClassName}
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" disabled={sms.isPending}>
          <Send className="size-4" />
          {t('sms.send')}
        </Button>
      </AppForm>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">{t('sms.history')}</h2>
        <SearchBar
          term={term}
          onTermChange={setTerm}
          onSubmit={() => applySearch()}
          label={t('common.search')}
          placeholder={t('sms.searchPlaceholder')}
        />
        <TableCard
          loading={history.isLoading}
          empty={q ? t('sms.noResults') : t('sms.empty')}
          hasRows={rows.length > 0}
        >
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('sms.phone')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.body')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.status')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('sms.sentAt')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                    {item.phone}
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
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
        {history.data ? (
          <PaginationBar
            page={history.data.page}
            pageSize={history.data.pageSize}
            total={history.data.total}
            onPageChange={setPage}
          />
        ) : null}
      </section>
    </div>
  )
}
