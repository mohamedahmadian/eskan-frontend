import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Phone, Send, X } from 'lucide-react'
import {
  AppForm,
  Button,
  FormField,
  cardClassName,
  fieldClassName,
} from '../ui/Form'

export function SmsPreviewModal({
  title,
  phone,
  body,
  sending,
  onPhoneChange,
  onBodyChange,
  onClose,
  onSend,
}: {
  title: string
  phone: string
  body: string
  sending: boolean
  onPhoneChange: (value: string) => void
  onBodyChange: (value: string) => void
  onClose: () => void
  onSend: () => Promise<void>
}) {
  const { t } = useTranslation()

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onSend()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-preview-title"
        className={`relative z-10 w-full max-w-lg p-6 ${cardClassName}`}
      >
        <h2 id="sms-preview-title" className="mb-4 text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <AppForm onSubmit={submit} className="space-y-4">
          <FormField icon={Phone} label={t('sms.phone')} htmlFor="sms-preview-phone">
            <input
              id="sms-preview-phone"
              className={fieldClassName}
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              inputMode="tel"
              dir="ltr"
              required
            />
          </FormField>
          <FormField icon={FileText} label={t('sms.body')} htmlFor="sms-preview-body">
            <textarea
              id="sms-preview-body"
              className={fieldClassName}
              rows={6}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              required
            />
          </FormField>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={sending}>
              <Send className="size-4" aria-hidden />
              {t('sms.send')}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
              <X className="size-4" aria-hidden />
              {t('common.cancel')}
            </Button>
          </div>
        </AppForm>
      </div>
    </div>
  )
}
