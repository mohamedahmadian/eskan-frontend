import {
  Calendar,
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
  Building,
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
  fieldClassName,
  inputClassName,
} from '../../components/ui/Form'
import { FormCard } from '../../components/ui/FormLayout'
import { UniqueFieldWrap, type UniqueCheckStatus } from '../../components/ui/UniqueFieldStatus'
import { languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { collaborationYears, currentPersianYear, formatNumber, parseDigitString, toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import {
  isLikelyEmail,
  isPhoneReady,
  preferEnglishKeyboard,
  sanitizeUsername,
  USERNAME_ENGLISH_PATTERN,
} from '../../lib/identity'
import { isValidIranianNationalId, normalizeNationalId, normalizePassportNumber } from '../../lib/national-id'
import {
  religions,
  userGenders,
  userStatuses,
  type City,
  type Country,
  type GovernmentOrganization,
  type ManagedUser,
  type Province,
  type Religion,
  type RoleOption,
  type UserGender,
  type UserStatus,
} from '../../types/app'
import { showUserActivityStartYear } from './user-scopes'

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

type IdentityCheckResponse = {
  taken: boolean
  nationalIdTaken?: boolean
  nationalIdOwnerName?: string | null
  phoneTaken?: boolean
  usernameTaken?: boolean
  emailTaken?: boolean
  passportTaken?: boolean
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
  issuingOrganizationId: string | null
  photoId: string | null
  nationalCardPhotoId: string | null
  passportPhotoId: string | null
  activityStartYear?: number | null
}

export function UserForm({
  initial,
  roles,
  lockedRoleCodes = [],
  hideRoles = false,
  hidePassword = false,
  hideStatus = false,
  requirePassword,
  defaultPassword = '',
  extraTabs,
  identityCheckPath = '/users/identity-check',
  i18nPrefix = 'users',
  selfProfile = false,
  onCancel,
  onSubmit,
}: {
  initial?: Partial<ManagedUser> & { roleIds?: string[] }
  roles: RoleOption[]
  lockedRoleCodes?: string[]
  hideRoles?: boolean
  hidePassword?: boolean
  hideStatus?: boolean
  requirePassword: boolean
  defaultPassword?: string
  extraTabs?: UserFormExtraTab[]
  identityCheckPath?: string
  i18nPrefix?: 'users' | 'pilgrims' | 'accommodationManagers' | 'caravanManagers' | 'headquartersRepresentatives'
  selfProfile?: boolean
  onCancel?: () => void
  onSubmit: (payload: UserPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const uiLocale = i18n.language.split('-')[0] ?? 'fa'
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
  const [activityStartYear, setActivityStartYear] = useState(
    initial?.activityStartYear != null ? String(initial.activityStartYear) : '',
  )
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
  const [issuingOrganizationId, setIssuingOrganizationId] = useState(
    initial?.issuingOrganizationId ?? '',
  )
  const [photoId, setPhotoId] = useState(initial?.photoId ?? '')
  const [nationalCardPhotoId, setNationalCardPhotoId] = useState(initial?.nationalCardPhotoId ?? '')
  const [passportPhotoId, setPassportPhotoId] = useState(initial?.passportPhotoId ?? '')
  const [uploading, setUploading] = useState<string>()
  const [roleIds, setRoleIds] = useState<string[]>(
    [...new Set([...(initial?.roleIds ?? initial?.roles?.map((role) => role.id) ?? []), ...lockedIds])],
  )
  const licenseIssuerRoleId = roles.find((role) => role.code === 'LICENSE_ISSUER')?.id
  const governmentOrgOfficerRoleId = roles.find((role) => role.code === 'GOVERNMENT_ORG_OFFICER')?.id
  const showIssuingOrganization = Boolean(
    (licenseIssuerRoleId &&
      (roleIds.includes(licenseIssuerRoleId) || lockedIds.includes(licenseIssuerRoleId))) ||
      (governmentOrgOfficerRoleId &&
        (roleIds.includes(governmentOrgOfficerRoleId) ||
          lockedIds.includes(governmentOrgOfficerRoleId))),
  )
  const organizationFieldLabel = governmentOrgOfficerRoleId &&
    (roleIds.includes(governmentOrgOfficerRoleId) || lockedIds.includes(governmentOrgOfficerRoleId))
    ? t('users.linkedOrganization')
    : t('users.issuingOrganization')
  const organizationRequiredMessage = governmentOrgOfficerRoleId &&
    (roleIds.includes(governmentOrgOfficerRoleId) || lockedIds.includes(governmentOrgOfficerRoleId))
    ? t('users.linkedOrganizationRequired')
    : t('users.issuingOrganizationRequired')
  const selectedRoleCodes = roles
    .filter((role) => roleIds.includes(role.id) || lockedIds.includes(role.id))
    .map((role) => role.code)
  const showActivityStart = showUserActivityStartYear(i18nPrefix, {
    lockedRoleCodes,
    roleCodes: selectedRoleCodes,
  })
  const parsedActivityStartYear = (() => {
    const raw = toLatinDigits(activityStartYear).trim()
    if (!raw) return null
    const year = Number(raw)
    return Number.isFinite(year) ? year : null
  })()
  const yearsOfCollaboration = collaborationYears(parsedActivityStartYear)
  const [saving, setSaving] = useState(false)
  const [checkingNationalId, setCheckingNationalId] = useState(false)
  const [nationalIdReady, setNationalIdReady] = useState(
    Boolean(initial?.nationalId && isValidIranianNationalId(initial.nationalId)),
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [phoneStatus, setPhoneStatus] = useState<UniqueCheckStatus>(initial?.phone ? 'ok' : 'idle')
  const [emailStatus, setEmailStatus] = useState<UniqueCheckStatus>(initial?.email ? 'ok' : 'idle')
  const [identityStatus, setIdentityStatus] = useState<UniqueCheckStatus>(
    initial?.nationalId ? 'ok' : 'idle',
  )
  const pendingFocusId = useRef<string | null>(null)
  const lastNationalIdCheck = useRef<string | null>(null)
  const lastPhoneCheck = useRef<string | null>(null)
  const lastUsernameCheck = useRef<string | null>(null)
  const lastEmailCheck = useRef<string | null>(null)
  const nationalIdCheckSeq = useRef(0)
  const phoneCheckSeq = useRef(0)
  const usernameCheckSeq = useRef(0)
  const emailCheckSeq = useRef(0)
  const isCreate = !initial?.id

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
  const isIranian = !iranCountryId || !selectedCountryId || selectedCountryId === iranCountryId
  const phoneRequired = selfProfile ? isIranian : true
  const identityRequired = !selfProfile && isIranian
  const identityIsPassport = selfProfile && !isIranian
  const personalFieldsLocked = isCreate && !selfProfile && identityRequired && !nationalIdReady
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
  const organizations = useQuery({
    queryKey: ['government-organizations', 'lookup'],
    enabled: showIssuingOrganization || Boolean(initial?.issuingOrganizationId),
    queryFn: async () => {
      const { data } = await api.get<GovernmentOrganization[]>('/government-organizations')
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

  function nationalIdTakenMessage(name?: string | null) {
    const trimmed = name?.trim()
    return trimmed
      ? t('users.nationalIdTaken', { name: trimmed })
      : t('users.nationalIdTakenUnknown')
  }

  async function checkNationalIdTaken(raw?: string): Promise<boolean> {
    const rawValue = raw ?? nationalId
    const value = identityIsPassport
      ? normalizePassportNumber(rawValue)
      : normalizeNationalId(rawValue)
    if (!value) {
      lastNationalIdCheck.current = null
      setNationalIdReady(false)
      setIdentityStatus('idle')
      clearError('nationalId')
      return !identityRequired
    }
    if (identityIsPassport) {
      if (value.length < 5) {
        lastNationalIdCheck.current = value
        setNationalIdReady(false)
        setIdentityStatus('idle')
        const message = t('users.passportRequired')
        setFieldError('nationalId', message)
        return false
      }
    } else if (isIranian && !isValidIranianNationalId(value)) {
      lastNationalIdCheck.current = value
      setNationalIdReady(false)
      setIdentityStatus('idle')
      const message = t('users.nationalIdInvalid')
      setFieldError('nationalId', message)
      toast.error(message)
      return false
    }
    const initialIdentity = identityIsPassport
      ? normalizePassportNumber(initial?.nationalId ?? '')
      : normalizeNationalId(initial?.nationalId ?? '')
    if (initial?.nationalId && initialIdentity === value) {
      lastNationalIdCheck.current = value
      setNationalIdReady(true)
      setIdentityStatus('ok')
      clearError('nationalId')
      return true
    }
    if (lastNationalIdCheck.current === value && nationalIdReady && !fieldErrors.nationalId) {
      setIdentityStatus(fieldErrors.nationalId ? 'taken' : 'ok')
      return true
    }
    lastNationalIdCheck.current = value
    const seq = ++nationalIdCheckSeq.current
    setCheckingNationalId(true)
    setIdentityStatus('checking')
    setNationalIdReady(false)
    try {
      const { data } = await api.post<IdentityCheckResponse>(
        identityCheckPath,
        {
          ...(identityIsPassport ? { passportNumber: value } : { nationalId: value }),
          ...(initial?.id ? { excludeId: initial.id } : {}),
        },
      )
      if (seq !== nationalIdCheckSeq.current) return false
      const taken = identityIsPassport
        ? Boolean(data.passportTaken ?? data.nationalIdTaken ?? data.taken)
        : Boolean(data.nationalIdTaken ?? data.taken)
      if (taken) {
        setNationalIdReady(false)
        setIdentityStatus('taken')
        const message = identityIsPassport
          ? t('users.passportTaken')
          : nationalIdTakenMessage(data.nationalIdOwnerName)
        setFieldError('nationalId', message)
        toast.error(message)
        return false
      }
      setNationalIdReady(true)
      setIdentityStatus('ok')
      clearError('nationalId')
      return true
    } catch (error) {
      if (seq === nationalIdCheckSeq.current) {
        lastNationalIdCheck.current = null
        setNationalIdReady(false)
        setIdentityStatus('idle')
      }
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
      return false
    } finally {
      if (seq === nationalIdCheckSeq.current) setCheckingNationalId(false)
    }
  }

  async function checkPhoneTaken(raw?: string): Promise<boolean> {
    const value = parseDigitString(raw ?? phone).trim()
    if (!value) {
      lastPhoneCheck.current = null
      setPhoneStatus('idle')
      clearError('phone')
      return !phoneRequired
    }
    if (!isPhoneReady(value, isIranian) && selfProfile) {
      lastPhoneCheck.current = null
      setPhoneStatus('idle')
      return !phoneRequired
    }
    if (initial?.phone && parseDigitString(initial.phone) === value) {
      lastPhoneCheck.current = value
      setPhoneStatus('ok')
      clearError('phone')
      return true
    }
    if (lastPhoneCheck.current === value && !fieldErrors.phone) {
      setPhoneStatus('ok')
      return true
    }
    lastPhoneCheck.current = value
    const seq = ++phoneCheckSeq.current
    setPhoneStatus('checking')
    try {
      const { data } = await api.post<IdentityCheckResponse>(
        identityCheckPath,
        {
          phone: value,
          ...(initial?.id ? { excludeId: initial.id } : {}),
        },
      )
      if (seq !== phoneCheckSeq.current) return false
      if (data.phoneTaken ?? data.taken) {
        const message = t('users.phoneTaken')
        setPhoneStatus('taken')
        setFieldError('phone', message)
        toast.error(message)
        return false
      }
      setPhoneStatus('ok')
      clearError('phone')
      return true
    } catch (error) {
      if (seq === phoneCheckSeq.current) {
        lastPhoneCheck.current = null
        setPhoneStatus('idle')
      }
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
      return false
    }
  }

  async function checkEmailTaken(raw?: string): Promise<boolean> {
    const value = toLatinDigits(raw ?? email).trim().toLowerCase()
    if (!value) {
      lastEmailCheck.current = null
      setEmailStatus('idle')
      clearError('email')
      return true
    }
    if (!isLikelyEmail(value)) {
      lastEmailCheck.current = null
      setEmailStatus('idle')
      const message = t('users.emailInvalid')
      setFieldError('email', message)
      return false
    }
    if (initial?.email && initial.email.trim().toLowerCase() === value) {
      lastEmailCheck.current = value
      setEmailStatus('ok')
      clearError('email')
      return true
    }
    if (lastEmailCheck.current === value && !fieldErrors.email) {
      setEmailStatus('ok')
      return true
    }
    lastEmailCheck.current = value
    const seq = ++emailCheckSeq.current
    setEmailStatus('checking')
    try {
      const { data } = await api.post<IdentityCheckResponse>(
        identityCheckPath,
        {
          email: value,
          ...(initial?.id ? { excludeId: initial.id } : {}),
        },
      )
      if (seq !== emailCheckSeq.current) return false
      if (data.emailTaken ?? data.taken) {
        const message = t('users.emailTaken')
        setEmailStatus('taken')
        setFieldError('email', message)
        toast.error(message)
        return false
      }
      setEmailStatus('ok')
      clearError('email')
      return true
    } catch (error) {
      if (seq === emailCheckSeq.current) {
        lastEmailCheck.current = null
        setEmailStatus('idle')
      }
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
      toast.error(getApiErrorMessage(error, t('common.error')))
      return false
    }
  }

  async function checkUsernameTaken(): Promise<boolean> {
    const value = username.trim()
    if (!value || value.length < 3) {
      lastUsernameCheck.current = null
      clearError('username')
      return false
    }
    if (initial?.username && initial.username === value) {
      lastUsernameCheck.current = value
      clearError('username')
      return true
    }
    if (lastUsernameCheck.current === value && !fieldErrors.username) {
      return true
    }
    lastUsernameCheck.current = value
    const seq = ++usernameCheckSeq.current
    try {
      const { data } = await api.post<{ taken: boolean; usernameTaken?: boolean }>(
        identityCheckPath,
        {
          username: value,
          ...(initial?.id ? { excludeId: initial.id } : {}),
        },
      )
      if (seq !== usernameCheckSeq.current) return false
      if (data.usernameTaken ?? data.taken) {
        const message = t('users.usernameTaken')
        setFieldError('username', message)
        toast.error(message)
        return false
      }
      clearError('username')
      return true
    } catch (error) {
      if (seq === usernameCheckSeq.current) lastUsernameCheck.current = null
      if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
      toast.error(getApiErrorMessage(error, t('common.error')))
      return false
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextRoleIds = [...new Set([...roleIds, ...lockedIds])]
    const identityValue = identityIsPassport
      ? normalizePassportNumber(nationalId)
      : normalizeNationalId(nationalId)
    const phoneDigits = parseDigitString(phone)
    const emailValue = toLatinDigits(email).trim().toLowerCase()
    if (identityRequired && !identityValue) {
      failField('personal', 'nationalId', t('users.nationalIdRequired'))
      return
    }
    if (identityIsPassport) {
      if (identityValue && identityValue.length < 5) {
        failField('personal', 'nationalId', t('users.passportRequired'))
        return
      }
    } else if (isIranian && identityValue && !isValidIranianNationalId(identityValue)) {
      failField('personal', 'nationalId', t('users.nationalIdInvalid'))
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
    if (phoneRequired && !phoneDigits) {
      failField('personal', 'phone', t('users.phoneRequired'))
      return
    }
    if (phoneDigits && !isPhoneReady(phoneDigits, isIranian)) {
      failField('personal', 'phone', t('users.phoneRequired'))
      return
    }
    if (emailValue && !isLikelyEmail(emailValue)) {
      failField('other', 'email', t('users.emailInvalid'))
      return
    }
    if (!nextRoleIds.length && isCreate) {
      failField('account', 'roles', t('users.rolesRequired'))
      return
    }
    if (showIssuingOrganization && !issuingOrganizationId) {
      failField('account', 'issuingOrganizationId', organizationRequiredMessage)
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      failField('account', 'username', t('users.usernameMin'))
      return
    }
    if (!USERNAME_ENGLISH_PATTERN.test(username.trim())) {
      failField('account', 'username', t('users.usernameEnglish'))
      return
    }
    if (requirePassword || password) {
      if (password.length < 8) {
        failField('account', 'password', t('users.passwordMin'))
        return
      }
    }

    const nationalIdAvailable = await checkNationalIdTaken()
    if (!nationalIdAvailable) {
      pendingFocusId.current = 'nationalId'
      if (tab !== 'personal') setTab('personal')
      return
    }
    const phoneAvailable = await checkPhoneTaken()
    if (!phoneAvailable) {
      pendingFocusId.current = 'phone'
      if (tab !== 'personal') setTab('personal')
      return
    }
    const emailAvailable = await checkEmailTaken()
    if (!emailAvailable) {
      pendingFocusId.current = 'email'
      if (tab !== 'other') setTab('other')
      return
    }
    const usernameAvailable = await checkUsernameTaken()
    if (!usernameAvailable) {
      pendingFocusId.current = 'username'
      if (tab !== 'account') setTab('account')
      return
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
        nationalId: identityIsPassport
          ? identityValue
          : identityValue || '',
        phone: phoneDigits,
        email: emptyToNull(emailValue),
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
        issuingOrganizationId: emptyToNull(issuingOrganizationId),
        photoId: emptyToNull(photoId),
        nationalCardPhotoId: emptyToNull(nationalCardPhotoId),
        passportPhotoId: emptyToNull(passportPhotoId),
        ...(showActivityStart ? { activityStartYear: parsedActivityStartYear } : {}),
        ...(password ? { password } : {}),
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const message = getApiErrorMessage(error, t('users.usernameTaken'))
        if (message.includes('کد ملی')) {
          failField(
            'personal',
            'nationalId',
            message.includes('متعلق') ? message : t('users.nationalIdTakenUnknown'),
          )
        } else if (message.includes('تلفن') || message.includes('شماره')) {
          failField('personal', 'phone', t('users.phoneTaken'))
        } else if (message.includes('ایمیل')) {
          failField('other', 'email', t('users.emailTaken'))
        } else if (message.includes('نام کاربری')) {
          failField('account', 'username', t('users.usernameTaken'))
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
  const isEdit = Boolean(initial?.id)
  const displayName =
    initial?.fullName?.trim() ||
    [initial?.firstName, initial?.lastName].filter(Boolean).join(' ').trim()

  return (
    <FormCard
      icon={UserRound}
      title={isEdit ? displayName || t(`${i18nPrefix}.edit`) : t(`${i18nPrefix}.create`)}
      subtitle={isEdit ? undefined : t(`${i18nPrefix}.createSubtitle`)}
    >
    <div className="space-y-4 p-5 sm:p-6">
      <nav className="flex flex-wrap gap-2 rounded-2xl border border-line bg-cream-50/80 p-3">
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
                  : 'bg-white text-ink-700 hover:bg-cream-100'
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

      <div className={`space-y-4 ${tab === 'personal' ? '' : 'hidden'}`}>
        <FormField
          icon={IdCard}
          label={identityIsPassport ? t('users.passportNumber') : t('users.nationalId')}
          htmlFor="nationalId"
          error={fieldErrors.nationalId}
        >
          <UniqueFieldWrap
            status={identityStatus}
            availableLabel={t('users.identityAvailable')}
            checkingLabel={t('users.identityChecking')}
          >
            <div className="relative">
              <input
                id="nationalId"
                className={`${inputClassName(Boolean(fieldErrors.nationalId))} ${
                  identityIsPassport ? 'latin-field' : ''
                }`}
                value={nationalId}
                inputMode={identityIsPassport ? 'text' : 'numeric'}
                autoComplete="off"
                maxLength={identityIsPassport ? 20 : 10}
                required={identityRequired}
                aria-invalid={Boolean(fieldErrors.nationalId)}
                aria-busy={checkingNationalId}
                onChange={(e) => {
                  lastNationalIdCheck.current = null
                  const next = identityIsPassport
                    ? normalizePassportNumber(e.target.value).slice(0, 20)
                    : parseDigitString(e.target.value).slice(0, 10)
                  setNationalId(next)
                  setNationalIdReady(false)
                  setIdentityStatus('idle')
                  clearError('nationalId')
                  if (identityIsPassport) {
                    if (next.length >= 5) void checkNationalIdTaken(next)
                  } else if (next.length === 10) {
                    void checkNationalIdTaken(next)
                  }
                }}
                onBlur={() => {
                  if (identityRequired || nationalId.trim()) void checkNationalIdTaken()
                }}
                onMouseLeave={() => {
                  if (identityIsPassport) {
                    if (normalizePassportNumber(nationalId).length >= 5) void checkNationalIdTaken()
                  } else if (normalizeNationalId(nationalId).length === 10) {
                    void checkNationalIdTaken()
                  }
                }}
              />
            </div>
          </UniqueFieldWrap>
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
            <UniqueFieldWrap
              status={phoneStatus}
              availableLabel={t('users.identityAvailable')}
              checkingLabel={t('users.identityChecking')}
            >
              <input
                id="phone"
                className={`${inputClassName(Boolean(fieldErrors.phone))} disabled:cursor-not-allowed`}
                value={phone}
                required={phoneRequired}
                disabled={personalFieldsLocked}
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={(e) => {
                  const value = parseDigitString(e.target.value).slice(0, isIranian ? 11 : 15)
                  lastPhoneCheck.current = null
                  setPhone(value)
                  setPhoneStatus('idle')
                  clearError('phone')
                  if (!usernameTouched.current) {
                    setUsername(sanitizeUsername(value))
                    clearError('username')
                  }
                  if (isPhoneReady(value, isIranian)) void checkPhoneTaken(value)
                }}
                onBlur={() => {
                  if (phoneRequired || parseDigitString(phone)) void checkPhoneTaken()
                }}
                onMouseLeave={() => {
                  if (isPhoneReady(parseDigitString(phone), isIranian)) void checkPhoneTaken()
                }}
              />
            </UniqueFieldWrap>
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
          {showActivityStart ? (
            <FormField
              icon={Calendar}
              label={t('users.activityStartYear')}
              htmlFor="activityStartYear"
            >
              <input
                id="activityStartYear"
                type="number"
                min={1300}
                max={currentPersianYear()}
                className={`${fieldClassName} digit-field disabled:cursor-not-allowed`}
                value={activityStartYear}
                disabled={personalFieldsLocked}
                onChange={(e) => setActivityStartYear(e.target.value)}
              />
              {yearsOfCollaboration != null ? (
                <p className="text-xs text-ink-500">
                  {t('users.collaborationYears', {
                    years: formatNumber(yearsOfCollaboration, uiLocale),
                  })}
                </p>
              ) : null}
            </FormField>
          ) : null}
        </div>
      </div>

      <div className={`space-y-4 ${tab === 'account' ? '' : 'hidden'}`}>
        <FormField
          icon={UserRoundPlus}
          label={t('users.username')}
          htmlFor="username"
          error={fieldErrors.username}
        >
          <input
            id="username"
            lang="en"
            dir="ltr"
            className={`${inputClassName(Boolean(fieldErrors.username))} latin-field`}
            value={username}
            required
            minLength={3}
            aria-invalid={Boolean(fieldErrors.username)}
            onChange={(e) => {
              usernameTouched.current = true
              lastUsernameCheck.current = null
              setUsername(sanitizeUsername(e.target.value))
              clearError('username')
            }}
            onMouseEnter={(e) => preferEnglishKeyboard(e.currentTarget)}
            onFocus={(e) => preferEnglishKeyboard(e.currentTarget)}
            onBlur={() => {
              if (username.trim().length >= 3) void checkUsernameTaken()
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            pattern="[A-Za-z0-9._-]+"
            title={t('users.usernameEnglish')}
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
        {showIssuingOrganization ? (
          <FormField
            icon={Building}
            label={organizationFieldLabel}
            htmlFor="issuingOrganizationId"
            error={fieldErrors.issuingOrganizationId}
          >
            <SearchSelect
              id="issuingOrganizationId"
              value={issuingOrganizationId}
              required
              onChange={(next) => {
                setIssuingOrganizationId(next)
                clearError('issuingOrganizationId')
              }}
              placeholder={t('users.selectIssuingOrganization')}
              options={[
                { value: '', label: t('users.selectIssuingOrganization') },
                ...(organizations.data ?? []).map((organization) => ({
                  value: organization.id,
                  label: organization.name,
                })),
              ]}
            />
          </FormField>
        ) : null}
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
        {hidePassword ? null : (
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
        )}
      </div>

      <div className={`space-y-4 ${tab === 'location' ? '' : 'hidden'}`}>
        <FormField icon={Flag} label={t('geo.country')} htmlFor="countryId">
          <SearchSelect
            id="countryId"
            value={selectedCountryId}
            onChange={(next) => {
              setCountryId(next)
              setProvinceId('')
              setCityId('')
              clearError('nationalId')
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

      <div className={`space-y-4 ${tab === 'documents' ? '' : 'hidden'}`}>
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

      <div className={`space-y-4 ${tab === 'social' ? '' : 'hidden'}`}>
        <FormField icon={MessageCircle} label={t('users.telegram')} htmlFor="telegram">
          <input
            id="telegram"
            className={`${fieldClassName} latin-field`}
            dir="ltr"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('users.bale')} htmlFor="bale">
          <input
            id="bale"
            className={`${fieldClassName} latin-field`}
            dir="ltr"
            value={bale}
            onChange={(e) => setBale(e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('users.eitaa')} htmlFor="eitaa">
          <input
            id="eitaa"
            className={`${fieldClassName} latin-field`}
            dir="ltr"
            value={eitaa}
            onChange={(e) => setEitaa(e.target.value)}
          />
        </FormField>
        <FormField icon={Phone} label={t('users.whatsapp')} htmlFor="whatsapp">
          <input
            id="whatsapp"
            className={`${fieldClassName} latin-field`}
            dir="ltr"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </FormField>
        <FormField icon={Share2} label={t('users.otherSocial')} htmlFor="otherSocial">
          <input
            id="otherSocial"
            className={`${fieldClassName} latin-field`}
            dir="ltr"
            value={otherSocial}
            onChange={(e) => setOtherSocial(e.target.value)}
          />
        </FormField>
      </div>

      <div className={`space-y-4 ${tab === 'other' ? '' : 'hidden'}`}>
        <FormField icon={Mail} label={t('users.email')} htmlFor="email" error={fieldErrors.email}>
          <UniqueFieldWrap
            status={emailStatus}
            availableLabel={t('users.identityAvailable')}
            checkingLabel={t('users.identityChecking')}
          >
            <input
              id="email"
              type="email"
              className={`${inputClassName(Boolean(fieldErrors.email))} latin-field`}
              value={email}
              aria-invalid={Boolean(fieldErrors.email)}
              onChange={(e) => {
                lastEmailCheck.current = null
                const next = toLatinDigits(e.target.value)
                setEmail(next)
                setEmailStatus('idle')
                clearError('email')
                if (isLikelyEmail(next)) void checkEmailTaken(next)
              }}
              onBlur={() => {
                if (toLatinDigits(email).trim()) void checkEmailTaken()
              }}
            />
          </UniqueFieldWrap>
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
        {hideStatus ? null : (
          <FormField icon={ToggleRight} label={t('users.status')} htmlFor="status">
            <ToggleField
              id="status"
              checked={status === userStatuses.ACTIVE}
              onChange={(active) => setStatus(active ? userStatuses.ACTIVE : userStatuses.INACTIVE)}
              onLabel={t('userStatuses.ACTIVE')}
              offLabel={t('userStatuses.INACTIVE')}
            />
          </FormField>
        )}
      </div>

      <div>
        <FormActions
          submitLabel={t('users.save')}
          cancelLabel={t('users.cancel')}
          submitting={saving}
          onCancel={onCancel ?? (() => history.back())}
        />
      </div>
        </AppForm>
      )}
    </div>
    </FormCard>
  )
}
