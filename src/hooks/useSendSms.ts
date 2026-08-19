import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendSms, type SendSmsPayload } from '../lib/sms'

/** ارسال پیامک از هر فرم: const sms = useSendSms(); await sms.mutateAsync({ phone, body }) */
export function useSendSms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendSmsPayload) => sendSms(payload),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['sms', 'messages'] })
    },
  })
}
