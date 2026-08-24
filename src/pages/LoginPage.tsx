import { KeyRound, Lock, User } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { AppForm, Button, FormField, cardClassName, fieldClassName } from '../components/ui/Form'
import { toLatinDigits } from '../lib/datetime'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await login(toLatinDigits(username), toLatinDigits(password))
      navigate('/')
    } catch {
      toast.error(t('auth.loginFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-cream-50 px-4">
      <div className={`relative w-full max-w-md p-8 ${cardClassName}`}>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white">
          ا
        </div>
        <p className="text-center text-2xl font-semibold text-ink-900">{t('app.name')}</p>
        <p className="mt-2 text-center text-sm text-ink-500">{t('app.tagline')}</p>
        <h1 className="mt-8 text-lg font-medium text-ink-900">{t('auth.ssoTitle')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('auth.ssoSubtitle')}</p>
        <AppForm className="mt-6 space-y-4" onSubmit={onSubmit}>
          <FormField icon={User} label={t('auth.identifier')} htmlFor="username">
            <input
              id="username"
              className={fieldClassName}
              value={username}
              onChange={(e) => setUsername(toLatinDigits(e.target.value))}
              autoComplete="username"
              required
            />
          </FormField>
          <FormField icon={Lock} label={t('auth.password')} htmlFor="password">
            <input
              id="password"
              type="password"
              className={fieldClassName}
              value={password}
              onChange={(e) => setPassword(toLatinDigits(e.target.value))}
              autoComplete="current-password"
              required
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={submitting}>
            <KeyRound className="size-4" />
            {t('auth.login')}
          </Button>
        </AppForm>
      </div>
    </div>
  )
}
