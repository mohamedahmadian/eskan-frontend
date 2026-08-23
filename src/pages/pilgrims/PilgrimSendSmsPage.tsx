import { useQuery } from '@tanstack/react-query'
import { FileText, Phone, UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AppForm,
  EntityNameSubtitle,
  FormActions,
  FormField,
  LoadingState,
  PageHeader,
  cardClassName,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { useSendSms } from '../../hooks/useSendSms'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser } from '../../types/app'

export function PilgrimSendSmsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const sms = useSendSms()
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const query = useQuery({
    queryKey: ['pilgrims', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`/pilgrims/${id}`)
      return data
    },
  })

  const pilgrim = query.data

  useEffect(() => {
    if (!pilgrim) return
    setPhone(pilgrim.phone ?? '')
  }, [pilgrim?.id, pilgrim?.phone])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextPhone = phone.trim()
    const nextBody = body.trim()
    if (!nextPhone) {
      toast.error(t('pilgrims.smsPhoneRequired'))
      return
    }
    if (!nextBody) {
      toast.error(t('pilgrims.smsBodyRequired'))
      return
    }
    setSending(true)
    try {
      await sms.mutateAsync({ phone: nextPhone, body: nextBody })
      toast.success(t('sms.queued'))
      if (id) navigate(`/pilgrims/${id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSending(false)
    }
  }

  if (!pilgrim) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('pilgrims.sendSms')}
        subtitle={<EntityNameSubtitle name={pilgrim.fullName} icon={UserRound} />}
      />
      <AppForm onSubmit={onSubmit} className={`space-y-4 p-6 ${cardClassName}`}>
        <FormField icon={Phone} label={t('sms.phone')} htmlFor="pilgrim-sms-phone">
          <input
            id="pilgrim-sms-phone"
            className={fieldClassName}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
            required
          />
        </FormField>
        <FormField icon={FileText} label={t('sms.body')} htmlFor="pilgrim-sms-body">
          <textarea
            id="pilgrim-sms-body"
            className={fieldClassName}
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            autoFocus
          />
        </FormField>
        <FormActions
          submitLabel={t('sms.send')}
          cancelLabel={t('pilgrims.cancel')}
          submitting={sending}
          onCancel={() => navigate(`/pilgrims/${pilgrim.id}`)}
        />
      </AppForm>
    </div>
  )
}
