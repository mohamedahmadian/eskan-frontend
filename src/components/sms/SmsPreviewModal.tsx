import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { FileText, Phone, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { EitaaIcon } from '../brand/SocialBrandIcon'
import { AppModal } from '../ui/AppModal'
import {
  AppForm,
  Button,
  FormField,
  cardClassName,
  fieldClassName,
} from '../ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { copyText } from '../../lib/clipboard'
import { toEitaaWebChatUrl } from '../../lib/social-links'

export function SmsPreviewModal({
  title,
  phone,
  body,
  sending,
  rows = 6,
  onPhoneChange,
  onBodyChange,
  onClose,
  onSend,
}: {
  title: string
  phone: string
  body: string
  sending: boolean
  rows?: number
  onPhoneChange: (value: string) => void
  onBodyChange: (value: string) => void
  onClose: () => void
  onSend: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [openingEitaa, setOpeningEitaa] = useState(false)
  const busy = sending || openingEitaa

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onSend()
  }

  async function openEitaa() {
    const nextPhone = phone.trim()
    const nextBody = body.trim()
    if (!nextPhone) {
      toast.error(t('sms.phoneRequired'))
      return
    }
    if (!nextBody) {
      toast.error(t('sms.bodyRequired'))
      return
    }
    setOpeningEitaa(true)
    try {
      const { data } = await api.get<{ fullName: string; eitaa: string | null }>('/sms/eitaa', {
        params: { phone: nextPhone },
      })
      const url = toEitaaWebChatUrl(data.eitaa ?? '')
      if (!url) {
        toast.error(t('sms.eitaaMissing', { name: data.fullName || '—' }))
        return
      }
      await copyText(nextBody)
      toast.success(t('sms.eitaaCopied'))
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error(t('sms.eitaaUserNotFound'))
        return
      }
      toast.error(getApiErrorMessage(error, t('sms.eitaaUserNotFound')))
    } finally {
      setOpeningEitaa(false)
    }
  }

  return (
    <AppModal
      onClose={onClose}
      closeDisabled={busy}
      labelledBy="sms-preview-title"
      zClassName="z-[80]"
      className={`max-h-[min(92vh,44rem)] w-full max-w-lg p-6 ${cardClassName}`}
    >
      <div className="max-h-[min(92vh,44rem)] overflow-y-auto">
        <h2 id="sms-preview-title" className="mb-4 pe-12 text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <AppForm onSubmit={submit} className="space-y-4">
          <FormField icon={Phone} label={t('sms.phone')} htmlFor="sms-preview-phone">
            <input
              id="sms-preview-phone"
              className={`${fieldClassName} digit-field`}
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
              rows={rows}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              required
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              <Send className="size-4" aria-hidden />
              {t('sms.send')}
            </Button>
            <Button type="button" variant="soft" disabled={busy} onClick={() => void openEitaa()}>
              <EitaaIcon className="size-4" aria-hidden />
              {t('sms.sendEitaa')}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="ms-auto"
              onClick={onClose}
              disabled={busy}
            >
              <X className="size-4" aria-hidden />
              {t('common.cancel')}
            </Button>
          </div>
        </AppForm>
      </div>
    </AppModal>
  )
}
