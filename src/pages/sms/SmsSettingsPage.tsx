import { Hash, KeyRound, Link2, Settings, ToggleRight, UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  ToggleField,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import type { SmsSettings } from '../../lib/sms'

export function SmsSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(true)
  const [endpoint, setEndpoint] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const query = useQuery({
    queryKey: ['sms', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<SmsSettings>('/sms/settings')
      return data
    },
  })

  useEffect(() => {
    if (!query.data) {
      return
    }
    setIsActive(query.data.isActive)
    setEndpoint(query.data.endpoint)
    setSenderNumber(query.data.senderNumber)
    setUsername(query.data.username)
    setPassword('')
  }, [query.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: {
        isActive: boolean
        endpoint: string
        senderNumber: string
        username: string
        password?: string
      } = { isActive, endpoint, senderNumber, username }
      if (password.trim()) {
        payload.password = password
      }
      const { data } = await api.put<SmsSettings>('/sms/settings', payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sms', 'settings'] })
      setPassword('')
      toast.success(t('sms.saved'))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Settings}
        title={t('sms.settingsTitle')}
        subtitle={t('sms.settingsSubtitle')}
      />
      <FormCard icon={Settings} title={t('sms.settingsTitle')} subtitle={t('sms.settingsSubtitle')}>
        <AppForm onSubmit={onSubmit} className={formCardBodyClassName}>
          <FormField icon={ToggleRight} label={t('sms.isActive')} htmlFor="sms-active">
            <ToggleField
              id="sms-active"
              checked={isActive}
              onChange={setIsActive}
              onLabel={t('geo.active')}
              offLabel={t('geo.inactive')}
            />
            <p className="mt-2 text-sm leading-7 text-ink-500">{t('sms.activeHint')}</p>
          </FormField>
          <FormField icon={Link2} label={t('sms.endpoint')} htmlFor="sms-endpoint">
            <input
              id="sms-endpoint"
              className={fieldClassName}
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://service.pejvaksoft.com"
              dir="ltr"
              required
            />
          </FormField>
          <FormField icon={Hash} label={t('sms.senderNumber')} htmlFor="sms-sender">
            <input
              id="sms-sender"
              className={fieldClassName}
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              dir="ltr"
              required
            />
          </FormField>
          <FormField icon={UserRound} label={t('sms.username')} htmlFor="sms-username">
            <input
              id="sms-username"
              className={fieldClassName}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              dir="ltr"
              required
            />
          </FormField>
          <FormField icon={KeyRound} label={t('sms.password')} htmlFor="sms-password">
            <input
              id="sms-password"
              type="password"
              className={fieldClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              placeholder={query.data?.hasPassword ? t('sms.passwordKeepHint') : undefined}
            />
          </FormField>
          <FormActions submitLabel={t('sms.save')} submitting={save.isPending || query.isLoading} />
        </AppForm>
      </FormCard>
    </div>
  )
}
