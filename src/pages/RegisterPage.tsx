import { IdCard, Phone, UserPlus, UserRound } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { AuthGuestLayout, AuthNotice } from '../components/auth/AuthGuestLayout'
import { SearchSelect } from '../components/ui/SearchSelect'
import { AppForm, Button, FormField, fieldClassName } from '../components/ui/Form'
import { api, getApiErrorMessage } from '../lib/api'
import { parseDigitString } from '../lib/datetime'
import { isValidIranianNationalId, normalizeNationalId } from '../lib/national-id'
import { userGenders } from '../types/app'

function splitIdentifier(value: string) {
  const digits = parseDigitString(value)
  if (digits.startsWith('09') && digits.length === 11) {
    return { phone: digits, nationalId: '' }
  }
  if (isValidIranianNationalId(digits)) {
    return { phone: '', nationalId: normalizeNationalId(digits) }
  }
  return { phone: '', nationalId: digits }
}

export function RegisterPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initial = useMemo(
    () => splitIdentifier(params.get('identifier') ?? ''),
    [params],
  )
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nationalId, setNationalId] = useState(initial.nationalId)
  const [phone, setPhone] = useState(initial.phone)
  const [gender, setGender] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValidIranianNationalId(nationalId)) {
      toast.error(t('users.nationalIdInvalid'))
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalId: normalizeNationalId(nationalId),
        phone: parseDigitString(phone),
        gender: gender || null,
      })
      setRegistered(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuestLayout
      title={t('auth.register')}
      subtitle={t('auth.registerSubtitle')}
      backTo="/forgot-password"
    >
      {registered ? (
        <div className="mt-6 space-y-4">
          <AuthNotice icon={UserPlus} tone="teal">
            {t('auth.registerSuccess')}
          </AuthNotice>
          <Button type="button" className="w-full" onClick={() => navigate('/login')}>
            {t('auth.login')}
          </Button>
        </div>
      ) : (
        <AppForm className="mt-6 space-y-4" onSubmit={onSubmit}>
          <FormField icon={UserRound} label={t('users.firstName')} htmlFor="firstName">
            <input
              id="firstName"
              className={fieldClassName}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </FormField>
          <FormField icon={UserRound} label={t('users.lastName')} htmlFor="lastName">
            <input
              id="lastName"
              className={fieldClassName}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </FormField>
          <FormField icon={IdCard} label={t('users.nationalId')} htmlFor="nationalId">
            <input
              id="nationalId"
              className={fieldClassName}
              value={nationalId}
              onChange={(e) => setNationalId(parseDigitString(e.target.value).slice(0, 10))}
              inputMode="numeric"
              required
              minLength={10}
              maxLength={10}
            />
          </FormField>
          <FormField icon={Phone} label={t('users.phone')} htmlFor="phone">
            <input
              id="phone"
              className={fieldClassName}
              value={phone}
              onChange={(e) => setPhone(parseDigitString(e.target.value).slice(0, 11))}
              inputMode="tel"
              autoComplete="tel"
              required
              minLength={11}
              maxLength={11}
            />
          </FormField>
          <FormField icon={UserRound} label={t('users.gender')} htmlFor="gender">
            <SearchSelect
              id="gender"
              value={gender}
              onChange={setGender}
              placeholder={t('users.selectOptional')}
              options={[
                { value: '', label: t('users.selectOptional') },
                ...Object.values(userGenders).map((item) => ({
                  value: item,
                  label: t(`userGenders.${item}`),
                })),
              ]}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={submitting}>
            <UserPlus className="size-4" />
            {t('auth.register')}
          </Button>
        </AppForm>
      )}
    </AuthGuestLayout>
  )
}
