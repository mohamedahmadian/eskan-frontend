import { useQuery } from '@tanstack/react-query'
import { KeyRound, MessageSquare, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import {
  AppForm,
  EntityNameSubtitle,
  FormActions,
  FormField,
  LoadingState,
  PageHeader,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser } from '../../types/app'

export function PilgrimSetPasswordPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [sendSms, setSendSms] = useState(false)
  const [saving, setSaving] = useState(false)

  const query = useQuery({
    queryKey: ['pilgrims', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`/pilgrims/${id}`)
      return data
    },
  })

  const pilgrim = query.data
  const hasPhone = Boolean(pilgrim?.phone)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    if (sendSms && !hasPhone) {
      toast.error(t('pilgrims.phoneRequiredForSms'))
      return
    }
    setSaving(true)
    try {
      const { data } = await api.patch<{ ok: true; smsQueued: boolean }>(`/pilgrims/${id}/password`, {
        password,
        sendSms,
      })
      if (sendSms && data.smsQueued) {
        toast.success(t('pilgrims.passwordSetSmsQueued'))
      } else if (sendSms) {
        toast.success(t('pilgrims.passwordSet'))
        toast.error(t('pilgrims.passwordSetSmsFailed'))
      } else {
        toast.success(t('pilgrims.passwordSet'))
      }
      navigate(`/pilgrims/${id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (!pilgrim) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('pilgrims.setPassword')}
        subtitle={<EntityNameSubtitle name={pilgrim.fullName} icon={UserRound} />}
      />
      <FormCard
        icon={KeyRound}
        title={t('pilgrims.setPassword')}
        subtitle={t('pilgrims.setPasswordSubtitle')}
      >
        <AppForm onSubmit={onSubmit} className={formCardBodyClassName}>
          <FormField icon={KeyRound} label={t('auth.newPassword')} htmlFor="newPassword">
            <input
              id="newPassword"
              type="password"
              className={fieldClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
          </FormField>
          <FormField icon={MessageSquare} label={t('sms.send')}>
            <CheckboxField
              id="sendSms"
              checked={sendSms}
              disabled={!hasPhone}
              onChange={setSendSms}
              label={
                hasPhone
                  ? t('pilgrims.sendPasswordSms')
                  : t('pilgrims.phoneRequiredForSms')
              }
            />
          </FormField>
          <FormActions
            submitLabel={t('pilgrims.setPassword')}
            cancelLabel={t('pilgrims.cancel')}
            submitting={saving}
            onCancel={() => navigate(`/pilgrims/${pilgrim.id}`)}
          />
        </AppForm>
      </FormCard>
    </div>
  )
}
