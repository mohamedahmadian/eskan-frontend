import { Globe, IdCard, Lock, Mail, Phone, User, UserPlus, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { AuthBackButton, AuthGuestLayout } from '../components/auth/AuthGuestLayout'
import { SearchSelect } from '../components/ui/SearchSelect'
import { AppForm, Button, FormField, ToggleField, fieldClassName } from '../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../components/ui/FormLayout'
import { usePreferredLocale } from '../hooks/usePreferredLocale'
import { isAppLanguage } from '../i18n'
import { api, getApiErrorMessage } from '../lib/api'
import { parseDigitString, toLatinDigits } from '../lib/datetime'
import { useGeoName } from '../lib/geo'
import { isValidIranianNationalId, normalizePassportNumber } from '../lib/national-id'
import { type Country, userGenders, type UserGender } from '../types/app'

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function splitIdentifier(value: string) {
  const trimmed = toLatinDigits(value.trim())
  if (isLikelyEmail(trimmed)) {
    return { email: trimmed.toLowerCase(), phone: '', passport: '' }
  }
  const digits = parseDigitString(trimmed)
  if (digits.startsWith('09') && digits.length === 11) {
    return { email: '', phone: digits, passport: '' }
  }
  if (isValidIranianNationalId(digits)) {
    return { email: '', phone: '', passport: '' }
  }
  return {
    email: '',
    phone: '',
    passport: trimmed ? normalizePassportNumber(trimmed) : '',
  }
}

export function RegisterPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const geoName = useGeoName()
  const { locale, setLocale } = usePreferredLocale()
  const [params] = useSearchParams()
  const initial = useMemo(
    () => splitIdentifier(params.get('identifier') ?? ''),
    [params],
  )
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState(initial.phone)
  const [passportNumber, setPassportNumber] = useState(initial.passport)
  const [email, setEmail] = useState(initial.email)
  const [gender, setGender] = useState<UserGender>(userGenders.MALE)
  const [countryId, setCountryId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const countries = useQuery({
    queryKey: ['countries', 'lookup', 'public'],
    queryFn: async () => {
      const { data } = await api.get<Country[] | { items: Country[] }>('/countries', {
        params: { activeOnly: true },
      })
      return Array.isArray(data) ? data : data.items
    },
  })
  const iranCountryId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''

  useEffect(() => {
    if (!countryId && iranCountryId) {
      setCountryId(iranCountryId)
    }
  }, [countryId, iranCountryId])

  const isIranian = !countryId || countryId === iranCountryId
  const phoneRequired = locale === 'fa'
  const phoneDigits = parseDigitString(phone)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (username.trim().length < 3) {
      toast.error(t('users.usernameMin'))
      return
    }
    if (password.length < 8) {
      toast.error(t('users.passwordMin'))
      return
    }
    if (phoneRequired) {
      if (!/^09\d{9}$/.test(phoneDigits)) {
        toast.error(t('users.phoneRequired'))
        return
      }
    } else if (phoneDigits && phoneDigits.length < 8) {
      toast.error(t('users.phoneRequired'))
      return
    }
    if (!isIranian) {
      if (normalizePassportNumber(passportNumber).length < 5) {
        toast.error(t('users.passportRequired'))
        return
      }
      if (!isLikelyEmail(email)) {
        toast.error(t('users.emailInvalid'))
        return
      }
    }
    setSubmitting(true)
    try {
      const usernameValue = toLatinDigits(username.trim())
      const passwordValue = toLatinDigits(password)
      const { data } = await api.post<{ status: string; locale: string }>('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: usernameValue,
        password: passwordValue,
        gender,
        countryId: countryId || undefined,
        ...(phoneDigits ? { phone: phoneDigits } : {}),
        ...(!isIranian
          ? {
              passportNumber: normalizePassportNumber(passportNumber),
              email: email.trim().toLowerCase(),
            }
          : {}),
      })
      if (isAppLanguage(data.locale)) {
        setLocale(data.locale)
      }
      await login(usernameValue, passwordValue)
      navigate('/')
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuestLayout wide>
      <FormCard
        icon={UserPlus}
        title={t('auth.register')}
        subtitle={t('auth.registerSubtitle')}
        action={<AuthBackButton to="/login" />}
      >
        <AppForm className={formCardBodyClassName} onSubmit={onSubmit} autoFocusFirst>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <FormField icon={User} label={t('users.username')} htmlFor="username">
                <input
                  id="username"
                  className={fieldClassName}
                  value={username}
                  onChange={(e) => setUsername(toLatinDigits(e.target.value))}
                  autoComplete="username"
                  required
                  minLength={3}
                />
              </FormField>
              <FormField icon={Lock} label={t('users.password')} htmlFor="password">
                <input
                  id="password"
                  type="password"
                  className={fieldClassName}
                  value={password}
                  onChange={(e) => setPassword(toLatinDigits(e.target.value))}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </FormField>
              <FormField icon={Phone} label={t('users.phone')} htmlFor="phone">
                <input
                  id="phone"
                  className={fieldClassName}
                  value={phone}
                  onChange={(e) =>
                    setPhone(parseDigitString(e.target.value).slice(0, phoneRequired ? 11 : 15))
                  }
                  inputMode="tel"
                  autoComplete="tel"
                  required={phoneRequired}
                  minLength={phoneRequired ? 11 : undefined}
                  maxLength={phoneRequired ? 11 : 15}
                />
              </FormField>
              {isIranian ? null : (
                <>
                  <FormField icon={IdCard} label={t('users.passportNumber')} htmlFor="passportNumber">
                    <input
                      id="passportNumber"
                      className={fieldClassName}
                      value={passportNumber}
                      onChange={(e) =>
                        setPassportNumber(normalizePassportNumber(e.target.value).slice(0, 20))
                      }
                      autoComplete="off"
                      required
                      minLength={5}
                      maxLength={20}
                    />
                  </FormField>
                  <FormField icon={Mail} label={t('users.email')} htmlFor="email">
                    <input
                      id="email"
                      type="email"
                      className={fieldClassName}
                      value={email}
                      onChange={(e) => setEmail(toLatinDigits(e.target.value))}
                      autoComplete="email"
                      required
                    />
                  </FormField>
                </>
              )}
              <FormField icon={UserRound} label={t('users.gender')} htmlFor="gender">
                <ToggleField
                  id="gender"
                  checked={gender === userGenders.MALE}
                  onChange={(male) => setGender(male ? userGenders.MALE : userGenders.FEMALE)}
                  onLabel={t('userGenders.MALE')}
                  offLabel={t('userGenders.FEMALE')}
                />
              </FormField>
            </div>
            <FormField icon={Globe} label={t('geo.country')} htmlFor="countryId">
              <SearchSelect
                id="countryId"
                value={countryId}
                onChange={setCountryId}
                placeholder={t('geo.selectCountry')}
                options={(countries.data ?? []).map((country) => ({
                  value: country.id,
                  label: geoName(country),
                }))}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={submitting}>
              <UserPlus className="size-4" />
              {t('auth.register')}
            </Button>
            <p className="text-center text-sm text-ink-500">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-teal-700 hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 rounded-lg"
              >
                {t('auth.login')}
              </Link>
            </p>
          </AppForm>
      </FormCard>
    </AuthGuestLayout>
  )
}
