import { CircleAlert, IdCard, KeyRound, PhoneOff, UserPlus } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { AuthGuestLayout, AuthNotice } from '../components/auth/AuthGuestLayout'
import { AppForm, Button, FormField, fieldClassName } from '../components/ui/Form'
import { api, getApiErrorMessage } from '../lib/api'
import { parseDigitString } from '../lib/datetime'

type ForgotStatus = 'sent' | 'no_phone' | 'not_found'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<ForgotStatus | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)
    try {
      const { data } = await api.post<{ status: ForgotStatus }>('/auth/forgot-password', {
        identifier: parseDigitString(identifier),
      })
      setStatus(data.status)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  const registerTo = identifier.trim()
    ? `/register?identifier=${encodeURIComponent(parseDigitString(identifier))}`
    : '/register'

  return (
    <AuthGuestLayout
      title={t('auth.forgotPassword')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      backTo="/login"
    >
      {status === 'sent' ? (
        <div className="mt-6 space-y-4">
          <AuthNotice icon={KeyRound} tone="teal">
            {t('auth.forgotPasswordSent')}
          </AuthNotice>
          <Button type="button" className="w-full" onClick={() => navigate('/login')}>
            {t('auth.login')}
          </Button>
        </div>
      ) : (
        <AppForm className="mt-6 space-y-4" onSubmit={onSubmit}>
          <FormField icon={IdCard} label={t('auth.forgotPasswordIdentifier')} htmlFor="identifier">
            <input
              id="identifier"
              className={fieldClassName}
              value={identifier}
              onChange={(e) => {
                setIdentifier(parseDigitString(e.target.value).slice(0, 15))
                setStatus(null)
              }}
              inputMode="numeric"
              autoComplete="username"
              required
              minLength={8}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={submitting}>
            <KeyRound className="size-4" />
            {t('auth.forgotPasswordSubmit')}
          </Button>
        </AppForm>
      )}

      {status === 'no_phone' ? (
        <div className="mt-5">
          <AuthNotice icon={PhoneOff} tone="mint">
            {t('auth.forgotPasswordNoPhone')}
          </AuthNotice>
        </div>
      ) : null}

      {status === 'not_found' ? (
        <div className="mt-5 space-y-4">
          <AuthNotice icon={CircleAlert} tone="warn">
            {t('auth.forgotPasswordNotFound')}
          </AuthNotice>
          <Button type="button" variant="soft" className="w-full" onClick={() => navigate(registerTo)}>
            <UserPlus className="size-4" aria-hidden />
            {t('auth.register')}
          </Button>
        </div>
      ) : null}
    </AuthGuestLayout>
  )
}
