import { FileText, Phone } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  SmsRecipientPicker,
  type SmsRecipient,
} from '../../components/sms/SmsRecipientPicker'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  cardClassName,
  fieldClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { useSendSms } from '../../hooks/useSendSms'
import { getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'

export function SmsSendPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [selected, setSelected] = useState<Record<string, SmsRecipient>>({})
  const [manualPhone, setManualPhone] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const sms = useSendSms()

  const phones = useMemo(() => {
    const fromUsers = Object.values(selected).map((item) => item.phone.trim())
    const extra = manualPhone.trim()
    return [...new Set([...fromUsers, ...(extra ? [extra] : [])].filter(Boolean))]
  }, [manualPhone, selected])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!phones.length) {
      toast.error(t('sms.noRecipient'))
      return
    }
    setSending(true)
    try {
      await sms.mutateAsync({ phones, body })
      toast.success(
        phones.length > 1
          ? t('sms.queuedCount', { count: formatNumber(phones.length, locale) })
          : t('sms.queued'),
      )
      setBody('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`${listShellClassName} space-y-8`}>
      <PageHeader title={t('sms.sendTitle')} subtitle={t('sms.sendSubtitle')} />
      <SmsRecipientPicker selected={selected} onChange={setSelected} />

      <AppForm onSubmit={onSubmit} className={`space-y-4 p-6 ${cardClassName}`}>
        {phones.length > 1 ? (
          <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {t('sms.recipientCount', { count: formatNumber(phones.length, locale) })}
          </p>
        ) : null}
        <FormField icon={Phone} label={t('sms.manualPhone')} htmlFor="sms-phone">
          <input
            id="sms-phone"
            className={fieldClassName}
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
            placeholder={t('sms.manualPhoneHint')}
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
        <FormActions submitLabel={t('sms.send')} submitting={sending} />
      </AppForm>
    </div>
  )
}
