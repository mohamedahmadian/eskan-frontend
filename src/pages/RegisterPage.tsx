import { Globe, IdCard, Lock, Mail, Phone, User, UserPlus, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { AuthBackButton, AuthGuestLayout } from '../components/auth/AuthGuestLayout'
import { SearchSelect } from '../components/ui/SearchSelect'
import { AppForm, Button, FormField, ToggleField, fieldClassName, inputClassName } from '../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../components/ui/FormLayout'
import { UniqueFieldWrap, type UniqueCheckStatus } from '../components/ui/UniqueFieldStatus'
import { usePreferredLocale } from '../hooks/usePreferredLocale'
import { isAppLanguage } from '../i18n'
import { api, getApiErrorMessage } from '../lib/api'
import { afterAuthPath, withNext } from '../lib/auth-redirect'
import { parseDigitString, toLatinDigits } from '../lib/datetime'
import { useGeoName } from '../lib/geo'
import {
  isLikelyEmail,
  isPhoneReady,
  preferEnglishKeyboard,
  sanitizeUsername,
  USERNAME_STRICT_PATTERN,
} from '../lib/identity'
import { isValidIranianNationalId, normalizePassportNumber } from '../lib/national-id'
import { type Country, userGenders, type UserGender } from '../types/app'

type CheckStatus = UniqueCheckStatus
type IdentityKind = 'phone' | 'email' | 'passport'

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
  const { setLocale } = usePreferredLocale()
  const [params] = useSearchParams()
  const next = params.get('next')
  const afterAuth = afterAuthPath(next)
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
  const [phoneStatus, setPhoneStatus] = useState<CheckStatus>('idle')
  const [emailStatus, setEmailStatus] = useState<CheckStatus>('idle')
  const [passportStatus, setPassportStatus] = useState<CheckStatus>('idle')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passportError, setPassportError] = useState('')

  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const passportTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phoneSeq = useRef(0)
  const emailSeq = useRef(0)
  const passportSeq = useRef(0)

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

  useEffect(() => {
    return () => {
      if (phoneTimer.current) clearTimeout(phoneTimer.current)
      if (emailTimer.current) clearTimeout(emailTimer.current)
      if (passportTimer.current) clearTimeout(passportTimer.current)
    }
  }, [])

  const isIranian = !countryId || countryId === iranCountryId
  const phoneRequired = isIranian
  const phoneDigits = parseDigitString(phone)
  const passportValue = normalizePassportNumber(passportNumber)
  const emailValue = toLatinDigits(email).trim().toLowerCase()

  async function requestIdentityCheck(kind: IdentityKind, value: string) {
    const payload =
      kind === 'phone'
        ? { phone: value }
        : kind === 'email'
          ? { email: value }
          : { passportNumber: value }
    const { data } = await api.post<{
      phoneTaken?: boolean
      emailTaken?: boolean
      passportTaken?: boolean
    }>('/auth/register/identity-check', payload)
    if (kind === 'phone') return Boolean(data.phoneTaken)
    if (kind === 'email') return Boolean(data.emailTaken)
    return Boolean(data.passportTaken)
  }

  async function runCheck(
    kind: IdentityKind,
    value: string,
    seq: number,
  ): Promise<boolean> {
    const setStatus = kind === 'phone' ? setPhoneStatus : kind === 'email' ? setEmailStatus : setPassportStatus
    const setError = kind === 'phone' ? setPhoneError : kind === 'email' ? setEmailError : setPassportError
    const seqRef = kind === 'phone' ? phoneSeq : kind === 'email' ? emailSeq : passportSeq
    const takenKey =
      kind === 'phone' ? 'users.phoneTaken' : kind === 'email' ? 'users.emailTaken' : 'users.passportTaken'
    setStatus('checking')
    setError('')
    try {
      const taken = await requestIdentityCheck(kind, value)
      if (seq !== seqRef.current) return false
      if (taken) {
        const message = t(takenKey)
        setStatus('taken')
        setError(message)
        return false
      }
      setStatus('ok')
      setError('')
      return true
    } catch (error) {
      if (seq !== seqRef.current) return false
      setStatus('idle')
      toast.error(getApiErrorMessage(error, t('common.error')))
      return false
    }
  }

  function scheduleCheck(kind: IdentityKind, value: string, immediate = false) {
    const timerRef = kind === 'phone' ? phoneTimer : kind === 'email' ? emailTimer : passportTimer
    const seqRef = kind === 'phone' ? phoneSeq : kind === 'email' ? emailSeq : passportSeq
    if (timerRef.current) clearTimeout(timerRef.current)
    const seq = ++seqRef.current
    if (immediate) {
      void runCheck(kind, value, seq)
      return
    }
    timerRef.current = setTimeout(() => {
      void runCheck(kind, value, seq)
    }, 400)
  }

  function onPhoneChange(next: string) {
    const digits = parseDigitString(next).slice(0, phoneRequired ? 11 : 15)
    setPhone(digits)
    setPhoneStatus('idle')
    setPhoneError('')
    if (isPhoneReady(digits, isIranian)) {
      scheduleCheck('phone', digits)
    }
  }

  function onEmailChange(next: string) {
    const value = toLatinDigits(next)
    setEmail(value)
    setEmailStatus('idle')
    setEmailError('')
    if (isLikelyEmail(value)) {
      scheduleCheck('email', value.trim().toLowerCase())
    }
  }

  function onPassportChange(next: string) {
    const value = normalizePassportNumber(next).slice(0, 20)
    setPassportNumber(value)
    setPassportStatus('idle')
    setPassportError('')
    if (value.length >= 5) {
      scheduleCheck('passport', value)
    }
  }

  useEffect(() => {
    setPhoneStatus('idle')
    setPhoneError('')
    if (isPhoneReady(phoneDigits, isIranian)) {
      scheduleCheck('phone', phoneDigits)
    }
    if (isIranian) {
      if (emailTimer.current) clearTimeout(emailTimer.current)
      if (passportTimer.current) clearTimeout(passportTimer.current)
      setPassportNumber('')
      setEmail('')
      setPassportStatus('idle')
      setEmailStatus('idle')
      setPassportError('')
      setEmailError('')
    }
    // فقط با عوض شدن کشور دوباره بررسی شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIranian])

  if (user) {
    return <Navigate to={afterAuth} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!USERNAME_STRICT_PATTERN.test(username) || username.length < 3) {
      toast.error(t('users.usernameEnglish'))
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
    if (!isIranian && emailValue && !isLikelyEmail(emailValue)) {
      toast.error(t('users.emailInvalid'))
      return
    }
    if (!isIranian && passportValue && passportValue.length < 5) {
      toast.error(t('users.passportRequired'))
      return
    }

    if (phoneTimer.current) clearTimeout(phoneTimer.current)
    if (emailTimer.current) clearTimeout(emailTimer.current)
    if (passportTimer.current) clearTimeout(passportTimer.current)

    const checks: Promise<boolean>[] = []
    if (isPhoneReady(phoneDigits, isIranian)) {
      checks.push(runCheck('phone', phoneDigits, ++phoneSeq.current))
    }
    if (!isIranian && emailValue && isLikelyEmail(emailValue)) {
      checks.push(runCheck('email', emailValue, ++emailSeq.current))
    }
    if (!isIranian && passportValue.length >= 5) {
      checks.push(runCheck('passport', passportValue, ++passportSeq.current))
    }
    if (checks.length) {
      const results = await Promise.all(checks)
      if (results.some((ok) => !ok)) {
        return
      }
    }

    setSubmitting(true)
    try {
      const usernameValue = username.trim()
      const passwordValue = toLatinDigits(password)
      const { data } = await api.post<{ status: string; locale: string }>('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: usernameValue,
        password: passwordValue,
        gender,
        countryId: countryId || undefined,
        ...(phoneDigits ? { phone: phoneDigits } : {}),
        ...(!isIranian && passportValue ? { passportNumber: passportValue } : {}),
        ...(!isIranian && emailValue ? { email: emailValue } : {}),
      })
      if (isAppLanguage(data.locale)) {
        setLocale(data.locale)
      }
      await login(usernameValue, passwordValue)
      navigate(afterAuth)
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
        action={<AuthBackButton to={withNext('/login', next)} />}
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
                  lang="en"
                  dir="ltr"
                  className={`${fieldClassName} latin-field`}
                  value={username}
                  onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                  onMouseEnter={(e) => preferEnglishKeyboard(e.currentTarget)}
                  onFocus={(e) => preferEnglishKeyboard(e.currentTarget)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="url"
                  required
                  minLength={3}
                  pattern="[A-Za-z][A-Za-z0-9._-]*"
                  title={t('users.usernameEnglish')}
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
              <FormField icon={Phone} label={t('users.phone')} htmlFor="phone" error={phoneError}>
                <UniqueFieldWrap
                  status={phoneStatus}
                  availableLabel={t('users.identityAvailable')}
                  checkingLabel={t('users.identityChecking')}
                >
                  <input
                    id="phone"
                    className={inputClassName(Boolean(phoneError))}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    onBlur={() => {
                      if (isPhoneReady(phoneDigits, isIranian)) {
                        scheduleCheck('phone', phoneDigits, true)
                      }
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    required={phoneRequired}
                    minLength={phoneRequired ? 11 : undefined}
                    maxLength={phoneRequired ? 11 : 15}
                    aria-invalid={Boolean(phoneError)}
                  />
                </UniqueFieldWrap>
              </FormField>
              {!isIranian ? (
                <FormField
                  icon={IdCard}
                  label={t('users.passportNumber')}
                  htmlFor="passportNumber"
                  error={passportError}
                >
                  <UniqueFieldWrap
                    status={passportStatus}
                    availableLabel={t('users.identityAvailable')}
                    checkingLabel={t('users.identityChecking')}
                  >
                    <input
                      id="passportNumber"
                      className={`${inputClassName(Boolean(passportError))} latin-field`}
                      value={passportNumber}
                      onChange={(e) => onPassportChange(e.target.value)}
                      onBlur={() => {
                        if (passportValue.length >= 5) {
                          scheduleCheck('passport', passportValue, true)
                        }
                      }}
                      autoComplete="off"
                      minLength={5}
                      maxLength={20}
                      aria-invalid={Boolean(passportError)}
                    />
                  </UniqueFieldWrap>
                </FormField>
              ) : null}
              {!isIranian ? (
                <FormField icon={Mail} label={t('users.email')} htmlFor="email" error={emailError}>
                  <UniqueFieldWrap
                    status={emailStatus}
                    availableLabel={t('users.identityAvailable')}
                    checkingLabel={t('users.identityChecking')}
                  >
                    <input
                      id="email"
                      type="email"
                      className={`${inputClassName(Boolean(emailError))} latin-field`}
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      onBlur={() => {
                        if (isLikelyEmail(emailValue)) {
                          scheduleCheck('email', emailValue, true)
                        } else if (emailValue) {
                          setEmailError(t('users.emailInvalid'))
                        }
                      }}
                      autoComplete="email"
                      aria-invalid={Boolean(emailError)}
                    />
                  </UniqueFieldWrap>
                </FormField>
              ) : null}
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
                to={withNext('/login', next)}
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
