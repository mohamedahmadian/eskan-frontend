import { CircleHelp, KeyRound, Lock } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import {
  AppForm,
  FormField,
  FormActions,
  PageHeader,
  fieldClassName,
  formShellClassName,
} from '../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../components/ui/FormLayout'
import { useRecoverPilgrimPassword } from '../hooks/useRecoverPilgrimPassword'
import { api, getApiErrorMessage } from '../lib/api'
import { isPilgrim } from '../lib/roles'

export function ChangePasswordPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { recoverPassword } = useRecoverPilgrimPassword()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const pilgrim = isPilgrim(user)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }
    setSaving(true)
    try {
      await api.patch('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('auth.passwordUpdated'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('auth.changePassword')} subtitle={t('auth.changePasswordSubtitle')} />
      <FormCard
        icon={KeyRound}
        title={t('auth.changePassword')}
        subtitle={t('auth.changePasswordSubtitle')}
      >
        <AppForm onSubmit={onSubmit} className={formCardBodyClassName}>
          <FormField icon={Lock} label={t('auth.currentPassword')} htmlFor="currentPassword">
            <input
              id="currentPassword"
              type="password"
              className={fieldClassName}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              minLength={8}
            />
            {pilgrim ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 self-start rounded-lg text-sm text-teal-700 transition hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                onClick={() => recoverPassword()}
              >
                <CircleHelp className="size-4" aria-hidden />
                {t('auth.forgotPassword')}
              </button>
            ) : null}
          </FormField>
          <FormField icon={KeyRound} label={t('auth.newPassword')} htmlFor="newPassword">
            <input
              id="newPassword"
              type="password"
              className={fieldClassName}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </FormField>
          <FormField icon={KeyRound} label={t('auth.confirmPassword')} htmlFor="confirmPassword">
            <input
              id="confirmPassword"
              type="password"
              className={fieldClassName}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </FormField>
          <FormActions submitLabel={t('auth.changePassword')} submitting={saving} />
        </AppForm>
      </FormCard>
    </div>
  )
}
