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
  recipientName?: string | null
  createdAt: string
}

export type SmsSettings = {
  endpoint: string
  senderNumber: string
  username: string
  hasPassword: boolean
}

export type QueuedSms = {
  queued: true
  recipientCount: number
}

export async function sendSms(payload: SendSmsPayload) {
  const { data } = await api.post<QueuedSms>('/sms/send', payload)
  return data
}
