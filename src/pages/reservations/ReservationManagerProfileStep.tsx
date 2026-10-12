import { Calendar, IdCard, ImagePlus, MapPin, MapPinned, Phone, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { FormField, inputClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { parseDigitString } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isPhoneReady } from '../../lib/identity'
import { optimizeImageFile } from '../../lib/optimize-image'
import { isValidIranianNationalId, normalizeNationalId } from '../../lib/national-id'
import type { City, Province, UserGender } from '../../types/app'
import { userGenders } from '../../types/app'

export type ManagerProfileDraft = {
  firstName: string
  lastName: string
  nationalId: string
  phone: string
  birthDate: string
  gender: '' | UserGender
  provinceId: string
  cityId: string
  photoId: string
}

export function emptyManagerProfileDraft(): ManagerProfileDraft {
  return {
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
    birthDate: '',
    gender: '',
    provinceId: '',
    cityId: '',
    photoId: '',
  }
}

export function isManagerProfileComplete(
  user: {
    firstName?: string | null
    lastName?: string | null
    nationalId?: string | null
    phone?: string | null
    birthDate?: string | null
    gender?: string | null
    provinceId?: string | null
    cityId?: string | null
    photoId?: string | null
    countryId?: string | null
  },
  iranId: string,
) {
  const iranian = !user.countryId || !iranId || user.countryId === iranId
  const nationalId = normalizeNationalId(user.nationalId ?? '')
  const phone = parseDigitString(user.phone ?? '')
  const nationalOk = iranian
    ? isValidIranianNationalId(nationalId)
    : nationalId.length >= 5 || (user.nationalId?.trim().length ?? 0) >= 5
  return Boolean(
    user.firstName?.trim() &&
      user.lastName?.trim() &&
      nationalOk &&
      isPhoneReady(phone, iranian) &&
      user.birthDate?.trim() &&
      (user.gender === 'MALE' || user.gender === 'FEMALE') &&
      user.provinceId &&
      user.cityId &&
      user.photoId,
  )
}

export function managerProfileError(
  draft: ManagerProfileDraft,
  t: TFunction,
  iranian: boolean,
) {
  if (!draft.firstName.trim() || !draft.lastName.trim()) return t('users.nameRequired')
  const nationalId = iranian
    ? normalizeNationalId(draft.nationalId)
    : draft.nationalId.trim()
  if (!nationalId) return t('users.nationalIdRequired')
  if (iranian && !isValidIranianNationalId(nationalId)) return t('users.nationalIdInvalid')
  if (!iranian && nationalId.length < 5) return t('users.nationalIdInvalid')
  const phone = parseDigitString(draft.phone)
  if (!phone) return t('users.phoneRequired')
  if (!isPhoneReady(phone, iranian)) return t('reservations.managerPhoneInvalid')
  if (!draft.birthDate) return t('reservations.managerBirthDateRequired')
  if (draft.gender !== 'MALE' && draft.gender !== 'FEMALE') {
    return t('reservations.managerGenderRequired')
  }
  if (!draft.provinceId) return t('reservations.managerProvinceRequired')
  if (!draft.cityId) return t('reservations.managerCityRequired')
  if (!draft.photoId) return t('reservations.managerPhotoRequired')
  return null
}

export function ReservationManagerProfileStep({
  draft,
  onChange,
  countryId,
  iranian = true,
  onUploading,
}: {
  draft: ManagerProfileDraft
  onChange: (patch: Partial<ManagerProfileDraft>) => void
  countryId: string
  iranian?: boolean
  onUploading?: (uploading: boolean) => void
}) {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  const [uploading, setUploading] = useState(false)

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
    queryKey: ['cities', 'lookup', draft.provinceId],
    enabled: Boolean(draft.provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId: draft.provinceId, activeOnly: true },
      })
      return data
    },
  })

  async function uploadPhoto(file: File) {
    setUploading(true)
    onUploading?.(true)
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>('/images', body)
      onChange({ photoId: data.id })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
      onUploading?.(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-ink-600">{t('reservations.createStepHints.manager')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={UserRound} label={t('users.firstName')} htmlFor="manager-first-name">
          <input
            id="manager-first-name"
            className={inputClassName()}
            value={draft.firstName}
            required
            autoComplete="given-name"
            onChange={(event) => onChange({ firstName: event.target.value })}
          />
        </FormField>
        <FormField icon={UserRound} label={t('users.lastName')} htmlFor="manager-last-name">
          <input
            id="manager-last-name"
            className={inputClassName()}
            value={draft.lastName}
            required
            autoComplete="family-name"
            onChange={(event) => onChange({ lastName: event.target.value })}
          />
        </FormField>
        <FormField icon={IdCard} label={t('users.nationalId')} htmlFor="manager-national-id">
          <input
            id="manager-national-id"
            className={`${inputClassName()} digit-field`}
            value={draft.nationalId}
            required
            inputMode="numeric"
            autoComplete="off"
            onChange={(event) =>
              onChange({
                nationalId: iranian
                  ? parseDigitString(event.target.value).slice(0, 10)
                  : event.target.value.slice(0, 20),
              })
            }
          />
        </FormField>
        <FormField icon={Phone} label={t('users.phone')} htmlFor="manager-phone">
          <input
            id="manager-phone"
            className={`${inputClassName()} digit-field`}
            value={draft.phone}
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={11}
            onChange={(event) =>
              onChange({
                phone: parseDigitString(event.target.value).slice(0, 11),
              })
            }
          />
        </FormField>
        <FormField icon={Calendar} label={t('users.birthDate')} htmlFor="manager-birth-date">
          <PersianDateField
            id="manager-birth-date"
            value={draft.birthDate || undefined}
            onChange={(iso) => onChange({ birthDate: iso ?? '' })}
          />
        </FormField>
        <FormField icon={UserRound} label={t('users.gender')} htmlFor="manager-gender">
          <SearchSelect
            id="manager-gender"
            value={draft.gender}
            onChange={(gender) => onChange({ gender: gender as ManagerProfileDraft['gender'] })}
            placeholder={t('users.selectOptional')}
            options={Object.values(userGenders).map((item) => ({
              value: item,
              label: t(`userGenders.${item}`),
            }))}
          />
        </FormField>
        <FormField icon={MapPinned} label={t('reservations.province')} htmlFor="manager-province">
          <SearchSelect
            id="manager-province"
            value={draft.provinceId}
            onChange={(provinceId) => onChange({ provinceId, cityId: '' })}
            placeholder={t('geo.selectProvince')}
            options={(provinces.data ?? []).map((item) => ({
              value: item.id,
              label: nameOf(item),
            }))}
          />
        </FormField>
        <FormField icon={MapPin} label={t('geo.city')} htmlFor="manager-city">
          <SearchSelect
            id="manager-city"
            value={draft.cityId}
            disabled={!draft.provinceId}
            onChange={(cityId) => onChange({ cityId })}
            placeholder={t('geo.selectCity')}
            options={(cities.data ?? []).map((item) => ({
              value: item.id,
              label: nameOf(item),
            }))}
          />
        </FormField>
      </div>
      <FormField icon={ImagePlus} label={t('reservations.managerPhoto')} htmlFor="manager-photo">
        <FileDropField
          id="manager-photo"
          accept="image/*"
          capture="user"
          previewUrl={draft.photoId ? getImageUrl(draft.photoId) : undefined}
          uploading={uploading}
          onFile={(file) => void uploadPhoto(file)}
          onClear={() => onChange({ photoId: '' })}
        />
      </FormField>
    </div>
  )
}
