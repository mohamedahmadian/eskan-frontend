import { api } from './api'

export type SendSmsPayload =
  | { phone: string; body: string }
  | { phones: string[]; body: string }

export type SmsMessage = {
  id: string
  phone: string
  body: string
  status: 'SENT' | 'FAILED'
  providerResponse: string | null
  createdAt: string
}

export type SmsSettings = {
  endpoint: string
  senderNumber: string
  username: string
  hasPassword: boolean
}

export async function sendSms(payload: SendSmsPayload) {
  const { data } = await api.post<SmsMessage | SmsMessage[]>('/sms/send', payload)
  return data
}
