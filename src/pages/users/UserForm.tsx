import {
  Car,
  FileText,
  Flag,
  IdCard,
  ImagePlus,
  KeyRound,
  Languages,
  Mail,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  Share2,
  Shield,
  ToggleRight,
  UserRound,
  UserRoundPlus,
} from 'lucide-react'
import axios from 'axios'
import { type FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import {
  AppForm,
  FormField,
  FormActions,
  ToggleField,
  Button,
  cardClassName,
  fieldClassName,
  inputClassName,
} from '../../components/ui/Form'
import { LoadingSpinner } from '../../components/ui/LoadingState'
import { languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { parseDigitString } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isValidIranianNationalId, normalizeNationalId } from '../../lib/national-id'
import {
  religions,
  userGenders,
  userStatuses,
  type City,
  type Country,
  type ManagedUser,
  type Province,
  type Religion,
  type RoleOption,
  type UserGender,
  type UserStatus,
} from '../../types/app'

const tabs = ['personal', 'account', 'location', 'documents', 'social', 'other'] as const

export type UserFormExtraTab = {
  id: string
  labelKey: string
  content: ReactNode
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function omitError(current: Record<string, string>, id: string) {
  if (!(id in current)) return current
  const { [id]: _, ...rest } = current
  return rest
}

export type UserPayload = {
  username: string
  password?: string
  firstName: string
  lastName: string
  locale: string
  roleIds: string[]
  status: UserStatus
  gender: UserGender | null
  nationalId: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  religion: Religion | null
  religionOther: string | null
  telegram: string | null
  bale: string | null
  eitaa: string | null
  whatsapp: string | null
  otherSocial: string | null
  vehiclePlates: string[]
  countryId: string | null
  provinceId: string | null
  cityId: string | null
  photoId: string | null
  nationalCardPhotoId: string | null
  passportPhotoId: string | null
}

export function UserForm({
  initial,
  roles,
  lockedRoleCodes = [],
  hideRoles = false,
  requirePassword,
  defaultPassword = '',
  extraTabs,
  identityCheckPath = '/users/identity-check',
  onSubmit,
}: {
  initial?: Partial<ManagedUser> & { roleIds?: string[] }
  roles: RoleOption[]
  lockedRoleCodes?: string[]
  hideRoles?: boolean
  requirePassword: boolean
  defaultPassword?: string
  extraTabs?: UserFormExtraTab[]
  identityCheckPath?: string
  onSubmit: (payload: UserPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const geoName = useGeoName()
  const lockedIds = useMemo(
    () => roles.filter((role) => lockedRoleCodes.includes(role.code)).map((role) => role.id),
    [lockedRoleCodes, roles],
  )
  const usernameTouched = useRef(Boolean(initial?.username))
  const [tab, setTab] = useState<string>('personal')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [password, setPassword] = useState(defaultPassword)
  const [locale, setLocale] = useState(initial?.locale ?? 'fa')
  const [status, setStatus] = useState<UserStatus>(initial?.status ?? userStatuses.ACTIVE)
  const [gender, setGender] = useState(initial?.gender ?? '')
  const [nationalId, setNationalId] = useState(initial?.nationalId ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [religion, setReligion] = useState(initial?.religion ?? '')
  const [religionOther, setReligionOther] = useState(initial?.religionOther ?? '')
  const [telegram, setTelegram] = useState(initial?.telegram ?? '')
  const [bale, setBale] = useState(initial?.bale ?? '')
  const [eitaa, setEitaa] = useState(initial?.eitaa ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '')
  const [otherSocial, setOtherSocial] = useState(initial?.otherSocial ?? '')
  const [vehiclePlates, setVehiclePlates] = useState<string[]>(
    initial?.vehiclePlates?.length ? initial.vehiclePlates : [''],
  )
  const [countryId, setCountryId] = useState(initial?.countryId ?? '')
  const [provinceId, setProvinceId] = useState(initial?.provinceId ?? '')
  const [cityId, setCityId] = useState(initial?.cityId ?? '')
  const [photoId, setPhotoId] = useState(initial?.photoId ?? '')
  const [nationalCardPhotoId, setNationalCardPhotoId] = useState(initial?.nationalCardPhotoId ?? '')
  const [passportPhotoId, setPassportPhotoId] = useState(initial?.passportPhotoId ?? '')
  const [uploading, setUploading] = useState<string>()
  const [roleIds, setRoleIds] = useState<string[]>(
    [...new Set([...(initial?.roleIds ?? initial?.roles?.map((role) => role.id) ?? []), ...lockedIds])],
  )
  const [saving, setSaving] = useState(false)
  const [checkingNationalId, setCheckingNationalId] = useState(false)
  const [nationalIdReady, setNationalIdReady] = useState(
    Boolean(initial?.nationalId && isValidIranianNationalId(initial.nationalId)),
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const pendingFocusId = useRef<string | null>(null)
  const lastNationalIdCheck = useRef<string | null>(null)
  const lastPhoneCheck = useRef<string | null>(null)
  const nationalIdCheckSeq = useRef(0)
  const phoneCheckSeq = useRef(0)
  const personalFieldsLocked = !nationalIdReady
  const isCreate = !initial

  useEffect(() => {
    const id = pendingFocusId.current
    if (!id) return
    pendingFocusId.current = null
    const el = document.getElementById(id)
    if (!(el instanceof HTMLElement)) return
    el.focus()
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [tab, fieldErrors])

  function setFieldError(id: string, message: string) {
    setFieldErrors((current) => ({ ...current, [id]: message }))
  }

  function clearError(id: string) {
    setFieldErrors((current) => omitError(current, id))
  }

  function failField(nextTab: string, fieldId: string, message: string) {
    pendingFocusId.current = fieldId
    setFieldError(fieldId, message)
    toast.error(message)
    if (tab !== nextTab) setTab(nextTab)
  }

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranCountryId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''
  const selectedCountryId = countryId || (isCreate ? iranCountryId : '')
  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', selectedCountryId],
    enabled: Boolean(selectedCountryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: selectedCountryId, activeOnly: true },
      })
      return data
    },
  })
  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })

  function toggleRole(id: string) {
    if (lockedIds.includes(id)) return
    setRoleIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function uploadImage(file: File, field: 'photo' | 'nationalCard' | 'passport') {
    const body = new FormData()
    body.append('file', file)
    setUploading(field)
    try {
      const { data } = await api.post<{ id: string }>('/images', body)
      if (field === 'photo') setPhotoId(data.id)
      if (field === 'nationalCard') setNationalCardPhotoId(data.id)
      if (field === 'passport') setPassportPhotoId(data.id)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setUploading(undefined)
    }
  }

  async function checkNationalIdTaken(raw?: string) {
    const value = normalizeNationalId(raw ?? nationalId)
    if (!value) {
      lastNationalIdCheck.current = null
      setNationalIdReady(false)
      clearError('nationalId')
      return
    }
    if (lastNationalIdCheck.current === value) return
    if (!isValidIranianNationalId(value)) {
      lastNationalIdCheck.current = value
      setNationalIdReady(false)
      const message = t('users.nationalIdInvalid')
      setFieldError('nationalId', message)
      toast.error(message)
      return
    }
    if (initial?.nationalId && normalizeNationalId(initial.nationalId) === value) {
      lastNationalIdCheck.current = value
      setNationalIdReady(true)
      clearError('nationalId')
      return
    }
    lastNationalIdCheck.current = value
    const seq = ++nationalIdCheckSeq.current
    setCheckingNationalId(true)
    setNationalIdReady(false)
    try {
      const { data } = await api.post<{ taken: boolean; nationalIdTaken?: boolean }>(
        identityCheckPath,
        {
          nationalId: value,
          ...(initial?.id ? { excludeId: initial.id } : {}),
        },
      )
      if (seq !== nationalIdCheckSeq.current) return
      if (data.nationalIdTaken ?? data.taken) {
        setNationalIdReady(false)
        const message = t('users.nationalIdTaken')
        setFieldError('nationalId', message)
        toast.error(message)
      } else {
        setNationalIdReady(true)
        clearError('nationalId')
      }
    } catch (error) {
      if (seq === nationalIdCheckSeq.current) {
        lastNationalIdCheck.current = null
        setNationalIdReady(false)
      }
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return
    } finally {
      if (seq === nationalIdCheckSeq.current) setCheckingNationalId(false)
    }
  }

  async function checkPhoneTaken(): Promise<boolean> {
    const value = parseDigitString(phone).trim()
    if (!value) {
      lastPhoneCheck.current = null
      clearError('phone')
      return true
    }
    if (initial?.phone && parseDigitString(initial.phone) === value) {
      lastPhoneCheck.current = value
      clearError('phone')
      return true
    }
    if (lastPhoneCheck.current === value && !fieldErrors.phone) {
      return true
    }
    lastPhoneCheck.current = value
    const seq = ++phoneCheckSeq.current
    try {
      const { data } = await api.post<{ taken: boolean; phoneTaken?: boolean }>(
        identityCheckPath,
        {
          phone: value,
          ...(initial?.id ? { excludeId: initial.id } : {}),
        },
      )
      if (seq !== phoneCheckSeq.current) return false
      if (data.phoneTaken ?? data.taken) {
        const message = t('users.phoneTaken')
        setFieldError('phone', message)
        toast.error(message)
        return false
      }
      clearError('phone')
      return true
    } catch (error) {
      if (seq === phoneCheckSeq.current) lastPhoneCheck.current = null
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
      return false
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextRoleIds = [...new Set([...roleIds, ...lockedIds])]
    if (!nationalId.trim()) {
      failField('personal', 'nationalId', t('users.nationalIdRequired'))
      return
    }
    if (!isValidIranianNationalId(nationalId)) {
      failField('personal', 'nationalId', t('users.nationalIdInvalid'))
      return
    }
    if (fieldErrors.nationalId) {
      failField('personal', 'nationalId', fieldErrors.nationalId)
      return
    }
    if (!firstName.trim()) {
      failField('personal', 'firstName', t('users.nameRequired'))
      return
    }
    if (!lastName.trim()) {
      failField('personal', 'lastName', t('users.nameRequired'))
      return
    }
    if (!phone.trim()) {
      failField('personal', 'phone', t('users.phoneRequired'))
      return
    }
    if (fieldErrors.phone) {
      failField('personal', 'phone', fieldErrors.phone)
      return
    }
    const phoneAvailable = await checkPhoneTaken()
    if (!phoneAvailable) {
      pendingFocusId.current = 'phone'
      if (tab !== 'personal') setTab('personal')
      return
    }
    if (!nextRoleIds.length) {
      failField('account', 'roles', t('users.rolesRequired'))
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      failField('account', 'username', t('users.usernameMin'))
      return
    }
    if (requirePassword || password) {
      if (password.length < 8) {
        failField('account', 'password', t('users.passwordMin'))
        return
      }
    }

    setSaving(true)
    try {
      await onSubmit({
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        locale,
        roleIds: nextRoleIds,
        status,
        gender: gender ? (gender as UserGender) : null,
        nationalId: normalizeNationalId(nationalId),
        phone: parseDigitString(phone),
        email: emptyToNull(email),
        address: emptyToNull(address),
        notes: emptyToNull(notes),
        religion: religion ? (religion as Religion) : null,
        religionOther: religion === religions.OTHER ? emptyToNull(religionOther) : null,
        telegram: emptyToNull(telegram),
        bale: emptyToNull(bale),
        eitaa: emptyToNull(eitaa),
        whatsapp: emptyToNull(whatsapp),
        otherSocial: emptyToNull(otherSocial),
        vehiclePlates: vehiclePlates.map((item) => item.trim()).filter(Boolean),
        countryId: emptyToNull(selectedCountryId),
        provinceId: emptyToNull(provinceId),
        cityId: emptyToNull(cityId),
        photoId: emptyToNull(photoId),
        nationalCardPhotoId: emptyToNull(nationalCardPhotoId),
        passportPhotoId: emptyToNull(passportPhotoId),
        ...(password ? { password } : {}),
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const message = getApiErrorMessage(error, t('users.usernameTaken'))
        if (message.includes('کد ملی')) {
          failField('personal', 'nationalId', t('users.nationalIdTaken'))
        } else if (message.includes('تلفن') || message.includes('شماره')) {
          failField('personal', 'phone', t('users.phoneTaken'))
        } else {
          failField('account', 'username', message)
        }
      } else {
        const message = getApiErrorMessage(error, t('common.error'))
        if (message.includes('کد ملی')) {
          failField('personal', 'nationalId', message)
        } else {
          toast.error(message)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const extraTab = extraTabs?.find((item) => item.id === tab)
  const allTabs = [...tabs, ...(extraTabs?.map((item) => item.id) ?? [])]

  return (
    <div className="space-y-4">
      <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
        {allTabs.map((item) => {
          const extra = extraTabs?.find((tabItem) => tabItem.id === item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                tab === item
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
              }`}
            >
              {extra ? t(extra.labelKey) : t(`users.tabs.${item}`)}
            </button>
          )
        })}
      </nav>

      {extraTab ? (
        extraTab.content
      ) : (
        <AppForm noValidate onSubmit={submit} className="space-y-4">

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'personal' ? '' : 'hidden'}`}>
        <FormField
          icon={IdCard}
          label={t('users.nationalId')}
          htmlFor="nationalId"
          error={fieldErrors.nationalId}
        >
          <div className="relative">
            <input
              id="nationalId"
              className={`${inputClassName(Boolean(fieldErrors.nationalId))} ${
                checkingNationalId ? 'pe-11' : ''
              }`}
              value={nationalId}
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              required
              aria-invalid={Boolean(fieldErrors.nationalId)}
              aria-busy={checkingNationalId}
              onChange={(e) => {
                lastNationalIdCheck.current = null
                const next = parseDigitString(e.target.value).slice(0, 10)
                setNationalId(next)
                setNationalIdReady(false)
                clearError('nationalId')
                if (next.length === 10) void checkNationalIdTaken(next)
              }}
              onBlur={() => void checkNationalIdTaken()}
              onMouseLeave={() => {
                if (normalizeNationalId(nationalId).length === 10) void checkNationalIdTaken()
              }}
            />
            {checkingNationalId ? (
              <span
                className="pointer-events-none absolute inset-y-0 end-3 flex items-center"
                role="status"
                aria-live="polite"
                aria-label={t('users.nationalIdChecking')}
              >
                <LoadingSpinner size="xs" />
              </span>
            ) : null}
          </div>
        </FormField>
        <div
          className={`space-y-4 transition-opacity duration-200 ${
            personalFieldsLocked ? 'opacity-50' : ''
          }`}
          aria-busy={checkingNationalId}
          aria-disabled={personalFieldsLocked}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              icon={UserRound}
              label={t('users.firstName')}
              htmlFor="firstName"
              error={fieldErrors.firstName}
            >
              <input
                id="firstName"
                className={`${inputClassName(Boolean(fieldErrors.firstName))} disabled:cursor-not-allowed`}
                value={firstName}
                required
                disabled={personalFieldsLocked}
                aria-invalid={Boolean(fieldErrors.firstName)}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  clearError('firstName')
                }}
              />
            </FormField>
            <FormField
              icon={UserRound}
              label={t('users.lastName')}
              htmlFor="lastName"
              error={fieldErrors.lastName}
            >
              <input
                id="lastName"
                className={`${inputClassName(Boolean(fieldErrors.lastName))} disabled:cursor-not-allowed`}
                value={lastName}
                required
                disabled={personalFieldsLocked}
                aria-invalid={Boolean(fieldErrors.lastName)}
                onChange={(e) => {
                  setLastName(e.target.value)
                  clearError('lastName')
                }}
              />
            </FormField>
          </div>
          <FormField
            icon={Phone}
            label={t('users.phone')}
            htmlFor="phone"
            error={fieldErrors.phone}
          >
            <input
              id="phone"
              className={`${inputClassName(Boolean(fieldErrors.phone))} disabled:cursor-not-allowed`}
              value={phone}
              required
              disabled={personalFieldsLocked}
              aria-invalid={Boolean(fieldErrors.phone)}
              onChange={(e) => {
                const value = parseDigitString(e.target.value).slice(0, 15)
                lastPhoneCheck.current = null
                setPhone(value)
                clearError('phone')
                if (!usernameTouched.current) {
                  setUsername(value)
                  clearError('username')
                }
              }}
              onBlur={() => void checkPhoneTaken()}
              onMouseLeave={() => {
                if (parseDigitString(phone).length >= 10) void checkPhoneTaken()
              }}
            />
          </FormField>
          <FormField icon={UserRound} label={t('users.gender')} htmlFor="gender">
            <SearchSelect
              id="gender"
              value={gender}
              disabled={personalFieldsLocked}
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
          <FormField icon={Share2} label={t('users.religion')} htmlFor="religion">
            <SearchSelect
              id="religion"
              value={religion}
              disabled={personalFieldsLocked}
              onChange={setReligion}
              placeholder={t('users.selectOptional')}
              options={[
                { value: '', label: t('users.selectOptional') },
                ...Object.values(religions).map((item) => ({
                  value: item,
                  label: t(`religions.${item}`),
                })),
              ]}
            />
          </FormField>
          {religion === religions.OTHER ? (
            <FormField icon={FileText} label={t('users.religionOther')} htmlFor="religionOther">
              <input
                id="religionOther"
                className={`${fieldClassName} disabled:cursor-not-allowed`}
                value={religionOther}
                disabled={personalFieldsLocked}
                onChange={(e) => setReligionOther(e.target.value)}
              />
            </FormField>
          ) : null}
        </div>
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'account' ? '' : 'hidden'}`}>
        <FormField
          icon={UserRoundPlus}
          label={t('users.username')}
          htmlFor="username"
          error={fieldErrors.username}
        >
          <input
            id="username"
            className={inputClassName(Boolean(fieldErrors.username))}
            value={username}
            required
            minLength={3}
            aria-invalid={Boolean(fieldErrors.username)}
            onChange={(e) => {
              usernameTouched.current = true
              setUsername(e.target.value)
              clearError('username')
            }}
            autoComplete="off"
          />
        </FormField>
        {hideRoles ? null : (
          <FormField icon={Shield} label={t('users.roles')} error={fieldErrors.roles}>
            <div id="roles" tabIndex={-1} className="space-y-2">
              {roles.map((role) => {
                const locked = lockedIds.includes(role.id)
                const checked = roleIds.includes(role.id) || locked
                return (
                  <CheckboxField
                    key={role.id}
                    checked={checked}
                    disabled={locked}
                    onChange={(on) => {
                      if (on !== checked) {
                        toggleRole(role.id)
                        clearError('roles')
                      }
                    }}
                    label={t(role.nameKey)}
                  />
                )
              })}
            </div>
          </FormField>
        )}
        <FormField icon={Languages} label={t('users.locale')} htmlFor="locale">
          <SearchSelect
            id="locale"
            value={locale}
            onChange={setLocale}
            options={(Object.keys(languages) as AppLanguage[]).map((code) => ({
              value: code,
              label: languages[code].enabled
                ? t(`languages.${code}`)
                : `${t(`languages.${code}`)} (${t('settings.comingSoon')})`,
              disabled: !languages[code].enabled,
            }))}
          />
        </FormField>
        <FormField
          icon={KeyRound}
          label={t('users.password')}
          htmlFor="password"
          error={fieldErrors.password}
        >
          <input
            id="password"
            type="password"
            className={inputClassName(Boolean(fieldErrors.password))}
            value={password}
            required={requirePassword}
            minLength={requirePassword ? 8 : undefined}
            aria-invalid={Boolean(fieldErrors.password)}
            onChange={(e) => {
              setPassword(e.target.value)
              clearError('password')
            }}
            autoComplete="new-password"
          />
          {!requirePassword ? (
            <p className="text-xs text-ink-500">{t('users.passwordOptional')}</p>
          ) : null}
        </FormField>
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'location' ? '' : 'hidden'}`}>
        <FormField icon={Flag} label={t('geo.country')} htmlFor="countryId">
          <SearchSelect
            id="countryId"
            value={selectedCountryId}
            onChange={(next) => {
              setCountryId(next)
              setProvinceId('')
              setCityId('')
            }}
            placeholder={t('geo.selectCountry')}
            options={[
              { value: '', label: t('geo.selectCountry') },
              ...(countries.data ?? []).map((country) => ({
                value: country.id,
                label: geoName(country),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPinned} label={t('geo.province')} htmlFor="provinceId">
          <SearchSelect
            id="provinceId"
            value={provinceId}
            disabled={!selectedCountryId}
            onChange={(next) => {
              setProvinceId(next)
              setCityId('')
            }}
            placeholder={t('geo.selectProvince')}
            options={[
              { value: '', label: t('geo.selectProvince') },
              ...(provinces.data ?? []).map((province) => ({
                value: province.id,
                label: geoName(province),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPin} label={t('geo.city')} htmlFor="cityId">
          <SearchSelect
            id="cityId"
            value={cityId}
            disabled={!provinceId}
            onChange={setCityId}
            placeholder={t('geo.selectCity')}
            options={[
              { value: '', label: t('geo.selectCity') },
              ...(cities.data ?? []).map((city) => ({
                value: city.id,
                label: geoName(city),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPin} label={t('users.address')} htmlFor="address">
          <textarea
            id="address"
            className={fieldClassName}
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </FormField>
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'documents' ? '' : 'hidden'}`}>
        <FormField icon={ImagePlus} label={t('users.photo')} htmlFor="photo">
          <FileDropField
            id="photo"
            accept="image/*"
            capture="user"
            previewUrl={photoId ? getImageUrl(photoId) : undefined}
            uploading={uploading === 'photo'}
            onFile={(file) => void uploadImage(file, 'photo')}
            onClear={() => setPhotoId('')}
          />
        </FormField>
        <FormField icon={IdCard} label={t('users.nationalCardPhoto')} htmlFor="nationalCardPhoto">
          <FileDropField
            id="nationalCardPhoto"
            accept="image/*"
            capture="environment"
            previewUrl={nationalCardPhotoId ? getImageUrl(nationalCardPhotoId) : undefined}
            uploading={uploading === 'nationalCard'}
            onFile={(file) => void uploadImage(file, 'nationalCard')}
            onClear={() => setNationalCardPhotoId('')}
          />
        </FormField>
        <FormField icon={IdCard} label={t('users.passportPhoto')} htmlFor="passportPhoto">
          <FileDropField
            id="passportPhoto"
            accept="image/*"
            capture="environment"
            previewUrl={passportPhotoId ? getImageUrl(passportPhotoId) : undefined}
            uploading={uploading === 'passport'}
            onFile={(file) => void uploadImage(file, 'passport')}
            onClear={() => setPassportPhotoId('')}
          />
        </FormField>
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'social' ? '' : 'hidden'}`}>
        <FormField icon={MessageCircle} label={t('users.telegram')} htmlFor="telegram">
          <input
            id="telegram"
            className={fieldClassName}
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('users.bale')} htmlFor="bale">
          <input
            id="bale"
            className={fieldClassName}
            value={bale}
            onChange={(e) => setBale(e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('users.eitaa')} htmlFor="eitaa">
          <input
            id="eitaa"
            className={fieldClassName}
            value={eitaa}
            onChange={(e) => setEitaa(e.target.value)}
          />
        </FormField>
        <FormField icon={Phone} label={t('users.whatsapp')} htmlFor="whatsapp">
          <input
            id="whatsapp"
            className={fieldClassName}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </FormField>
        <FormField icon={Share2} label={t('users.otherSocial')} htmlFor="otherSocial">
          <input
            id="otherSocial"
            className={fieldClassName}
            value={otherSocial}
            onChange={(e) => setOtherSocial(e.target.value)}
          />
        </FormField>
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'other' ? '' : 'hidden'}`}>
        <FormField icon={Mail} label={t('users.email')} htmlFor="email">
          <input
            id="email"
            type="email"
            className={fieldClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField icon={Car} label={t('users.vehiclePlates')}>
          <div className="space-y-2">
            {vehiclePlates.map((plate, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={fieldClassName}
                  value={plate}
                  onChange={(e) => {
                    const next = [...vehiclePlates]
                    next[index] = e.target.value
                    setVehiclePlates(next)
                  }}
                />
                {vehiclePlates.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setVehiclePlates(vehiclePlates.filter((_, i) => i !== index))}
                  >
                    {t('users.removePlate')}
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setVehiclePlates([...vehiclePlates, ''])}
            >
              {t('users.addPlate')}
            </Button>
          </div>
        </FormField>
        <FormField icon={FileText} label={t('users.notes')} htmlFor="notes">
          <textarea
            id="notes"
            className={fieldClassName}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>
        <FormField icon={ToggleRight} label={t('users.status')} htmlFor="status">
          <ToggleField
            id="status"
            checked={status === userStatuses.ACTIVE}
            onChange={(active) => setStatus(active ? userStatuses.ACTIVE : userStatuses.INACTIVE)}
            onLabel={t('userStatuses.ACTIVE')}
            offLabel={t('userStatuses.INACTIVE')}
          />
        </FormField>
      </div>

      <div className={`p-6 ${cardClassName}`}>
        <FormActions
          submitLabel={t('users.save')}
          cancelLabel={t('users.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </div>
        </AppForm>
      )}
    </div>
  )
}
