import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '../ui/Form'
import { useSendSms } from '../../hooks/useSendSms'
import { getApiErrorMessage } from '../../lib/api'

/** دکمه آماده برای ارسال پیامک از فرم‌های دیگر با شماره و متن مشخص */
export function SmsSendButton({
  phone,
  body,
  label,
}: {
  phone: string
  body: string
  label?: string
}) {
  const { t } = useTranslation()
  const sms = useSendSms()

  return (
    <Button
      type="button"
      disabled={!phone || !body || sms.isPending}
      onClick={() => {
        void sms
          .mutateAsync({ phone, body })
          .then(() => toast.success(t('sms.sent')))
          .catch((error) => toast.error(getApiErrorMessage(error, t('sms.sendFailed'))))
      }}
    >
      <Send className="size-4" />
      {label ?? t('sms.send')}
    </Button>
  )
}
