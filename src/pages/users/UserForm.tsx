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
import { type FormEvent, useMemo, useRef, useState } from 'react'
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
} from '../../components/ui/Form'
import { languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
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

const tabs = ['account', 'personal', 'location', 'documents', 'contact'] as const
type UserTab = (typeof tabs)[number]

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
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
  nationalId: string | null
  phone: string | null
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
  requirePassword,
  onSubmit,
}: {
  initial?: Partial<ManagedUser> & { roleIds?: string[] }
  roles: RoleOption[]
  lockedRoleCodes?: string[]
  requirePassword: boolean
  onSubmit: (payload: UserPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const geoName = useGeoName()
  const lockedIds = useMemo(
    () => roles.filter((role) => lockedRoleCodes.includes(role.code)).map((role) => role.id),
    [lockedRoleCodes, roles],
  )
  const usernameTouched = useRef(Boolean(initial?.username))
  const [tab, setTab] = useState<UserTab>('account')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId, activeOnly: true },
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

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextRoleIds = [...new Set([...roleIds, ...lockedIds])]
    if (!nextRoleIds.length) {
      setTab('account')
      toast.error(t('users.rolesRequired'))
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      setTab('account')
      toast.error(t('users.usernameMin'))
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setTab('personal')
      toast.error(t('users.nameRequired'))
      return
    }
    if (requirePassword || password) {
      if (password.length < 8) {
        setTab('account')
        toast.error(t('users.passwordMin'))
        return
      }
      if (password !== confirmPassword) {
        setTab('account')
        toast.error(t('auth.passwordMismatch'))
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
        nationalId: emptyToNull(nationalId),
        phone: emptyToNull(phone),
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
        countryId: emptyToNull(countryId),
        provinceId: emptyToNull(provinceId),
        cityId: emptyToNull(cityId),
        photoId: emptyToNull(photoId),
        nationalCardPhotoId: emptyToNull(nationalCardPhotoId),
        passportPhotoId: emptyToNull(passportPhotoId),
        ...(password ? { password } : {}),
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(getApiErrorMessage(error, t('users.usernameTaken')))
      } else {
        toast.error(getApiErrorMessage(error, t('common.error')))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppForm onSubmit={submit} className="space-y-4">
      <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
        {tabs.map((item) => (
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
            {t(`users.tabs.${item}`)}
          </button>
        ))}
      </nav>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'account' ? '' : 'hidden'}`}>
        <FormField icon={UserRoundPlus} label={t('users.username')} htmlFor="username">
          <input
            id="username"
            className={fieldClassName}
            value={username}
            onChange={(e) => {
              usernameTouched.current = true
              setUsername(e.target.value)
            }}
            autoComplete="off"
            minLength={3}
          />
        </FormField>
        <FormField icon={Shield} label={t('users.roles')}>
          <div className="space-y-2">
            {roles.map((role) => {
              const locked = lockedIds.includes(role.id)
              const checked = roleIds.includes(role.id) || locked
              return (
                <CheckboxField
                  key={role.id}
                  checked={checked}
                  disabled={locked}
                  onChange={(on) => {
                    if (on !== checked) toggleRole(role.id)
                  }}
                  label={t(role.nameKey)}
                />
              )
            })}
          </div>
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
        <FormField icon={KeyRound} label={t('users.password')} htmlFor="password">
          <input
            id="password"
            type="password"
            className={fieldClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={requirePassword ? 8 : undefined}
          />
          {!requirePassword ? (
            <p className="text-xs text-ink-500">{t('users.passwordOptional')}</p>
          ) : null}
        </FormField>
        <FormField icon={KeyRound} label={t('auth.confirmPassword')} htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            type="password"
            className={fieldClassName}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </FormField>
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'personal' ? '' : 'hidden'}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={UserRound} label={t('users.firstName')} htmlFor="firstName">
            <input
              id="firstName"
              className={fieldClassName}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FormField>
          <FormField icon={UserRound} label={t('users.lastName')} htmlFor="lastName">
            <input
              id="lastName"
              className={fieldClassName}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormField>
        </div>
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
        <FormField icon={IdCard} label={t('users.nationalId')} htmlFor="nationalId">
          <input
            id="nationalId"
            className={fieldClassName}
            value={nationalId}
            onChange={(e) => {
              const value = e.target.value
              setNationalId(value)
              if (!usernameTouched.current) {
                setUsername(value)
              }
            }}
          />
        </FormField>
        <FormField icon={Phone} label={t('users.phone')} htmlFor="phone">
          <input
            id="phone"
            className={fieldClassName}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>
        <FormField icon={Share2} label={t('users.religion')} htmlFor="religion">
          <SearchSelect
            id="religion"
            value={religion}
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
              className={fieldClassName}
              value={religionOther}
              onChange={(e) => setReligionOther(e.target.value)}
            />
          </FormField>
        ) : null}
      </div>

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'location' ? '' : 'hidden'}`}>
        <FormField icon={Flag} label={t('geo.country')} htmlFor="countryId">
          <SearchSelect
            id="countryId"
            value={countryId}
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
            disabled={!countryId}
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

      <div className={`space-y-4 p-6 ${cardClassName} ${tab === 'contact' ? '' : 'hidden'}`}>
        <FormField icon={Mail} label={t('users.email')} htmlFor="email">
          <input
            id="email"
            type="email"
            className={fieldClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
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
  )
}
