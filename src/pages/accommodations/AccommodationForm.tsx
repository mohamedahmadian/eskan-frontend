import {
  AlignLeft,
  ArrowUpDown,
  BadgeCheck,
  Bath,
  Building2,
  CalendarDays,
  Car,
  ClipboardCheck,
  Droplets,
  Flag,
  Flame,
  Images,
  Landmark,
  LayoutGrid,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Percent,
  Phone,
  Route,
  Share2,
  School,
  Shirt,
  Snowflake,
  ToggleRight,
  UserCheck,
  UserRound,
  Users,
  Wifi,
  BookOpen,
  Compass,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, toLatinDigits } from '../../lib/datetime'
import {
  defaultAccommodationTypeId,
  isSchoolAccommodationType,
} from '../../lib/accommodation-type'
import { useGeoName } from '../../lib/geo'
import {
  accommodationInspectionResults,
  accommodationInspectionStatuses,
  accommodationOperationStatuses,
  accommodationStatuses,
  genderTypes,
  managementTypes,
  type Accommodation,
  type AccommodationInspectionResult,
  type AccommodationInspectionStatus,
  type AccommodationOperationStatus,
  type AccommodationStatus,
  type AccommodationType,
  type AccommodationTypeDetails,
  type Country,
  type GenderType,
  type ManagedUser,
  type ManagementType,
  type Province,
  type City,
  type SchoolDistrict,
} from '../../types/app'
import { AccommodationImagesField } from './AccommodationImagesField'
import { AccommodationManagersCard } from './AccommodationManagersCard'
import { AccommodationTabNav, type AccommodationTab } from './AccommodationTabs'
import {
  AccommodationContactsPanel,
  firstIncompleteContactRole,
} from './AccommodationContactsPanel'
import {
  accommodationContactDraftsFromInitial,
  accommodationContactRoles,
  isAccommodationContactComplete,
  toAccommodationContactPayloads,
  type AccommodationContactDraft,
  type AccommodationContactRole,
} from './accommodationContacts'
import {
  accommodationTypeDetailKind,
  typeDetailFormValuesFrom,
  typeDetailsPayloadFromForm,
} from '../../lib/accommodation-type-details'
import {
  AccommodationTypeDetailsFields,
} from './AccommodationTypeDetailsFields'

export type AccommodationPayload = {
  name: string
  typeId: string
  status: AccommodationStatus
  genderType: GenderType
  managementType: ManagementType
  maleCapacity: number
  femaleCapacity: number
  overflowPercent: number
  ownerName: string | null
  ownerPhone: string | null
  imageIds?: string[]
  inspectionStatus?: AccommodationInspectionStatus
  inspectionResult?: AccommodationInspectionResult | null
  reviewerId?: string | null
  lastEvaluatedAt?: string | null
  operationStatus?: AccommodationOperationStatus
  phone: string | null
  address: string | null
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
  eitaa: string | null
  bale: string | null
  otherSocial: string | null
  description: string | null
  countryId: string | null
  provinceId: string | null
  cityId: string | null
  distanceToShrineKm: number | null
  distanceToMashhadKm: number | null
  hasLaundry: boolean
  hasInternet: boolean
  hasPrayerRoom: boolean
  hasElevator: boolean
  heatingSystem: string | null
  coolingSystem: string | null
  parkingCapacity: number | null
  bathroomCount: number | null
  toiletCount: number | null
  classroomCount: number | null
  schoolDistrictId: string | null
  year?: number
  managerUserIds?: string[]
  primaryManagerUserId?: string | null
  isPrimary?: boolean
  contacts?: ReturnType<typeof toAccommodationContactPayloads>
} & AccommodationTypeDetails

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toNumber(value: string, fallback = 0) {
  if (value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatCoordinates(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (latitude == null && longitude == null) return ''
  if (latitude != null && longitude != null) return `${latitude},${longitude}`
  return latitude != null ? String(latitude) : String(longitude)
}

function coordinatesParts(value: string) {
  const latin = toLatinDigits(value).trim()
  if (!latin) return { latitude: '', longitude: '' }
  const parts = latin.split(/[,،]/).map((part) => part.trim())
  return {
    latitude: parts[0] ?? '',
    longitude: parts[1] ?? '',
  }
}

function parseCoordinates(value: string): { latitude: number | null; longitude: number | null } | 'invalid' {
  const trimmed = toLatinDigits(value).trim()
  if (!trimmed) return { latitude: null, longitude: null }
  const parts = trimmed.split(/[,،]/).map((part) => part.trim()).filter((part) => part.length > 0)
  if (parts.length !== 2) return 'invalid'
  const latitude = Number(parts[0])
  const longitude = Number(parts[1])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'invalid'
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return 'invalid'
  return { latitude, longitude }
}

export function AccommodationForm({
  initial,
  countries,
  provinces,
  cities,
  users = [],
  isAdmin,
  currentUserId,
  onCountryChange,
  onProvinceChange,
  onSubmit,
  onCancel,
  headerAction,
  createSubtitle,
  contactsOptional = false,
  autoFocus = false,
}: {
  initial?: Accommodation
  countries: Country[]
  provinces: Province[]
  cities: City[]
  users?: ManagedUser[]
  isAdmin: boolean
  currentUserId?: string
  onCountryChange: (countryId: string) => void
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: AccommodationPayload) => Promise<void>
  onCancel?: () => void
  headerAction?: ReactNode
  createSubtitle?: string
  /** Contacts may be left empty; incomplete drafts are not sent. */
  contactsOptional?: boolean
  autoFocus?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<AccommodationTab>('general')
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    typeId: initial?.typeId ?? '',
    status: initial?.status ?? accommodationStatuses.ACTIVE,
    genderType: initial?.genderType ?? genderTypes.MIXED,
    managementType: initial?.managementType ?? managementTypes.SELF_SUFFICIENT,
    maleCapacity: String(initial?.maleCapacity ?? 0),
    femaleCapacity: String(initial?.femaleCapacity ?? 0),
    overflowPercent: String(initial?.overflowPercent ?? 10),
    ownerName: initial?.ownerName ?? '',
    ownerPhone: initial?.ownerPhone ?? '',
    inspectionStatus: initial?.inspectionStatus ?? accommodationInspectionStatuses.NOT_DONE,
    inspectionResult: initial?.inspectionResult ?? '',
    reviewerId: initial?.reviewerId ?? '',
    lastEvaluatedAt: initial?.lastEvaluatedAt ?? '',
    operationStatus: initial?.operationStatus ?? accommodationOperationStatuses.ACTIVE,
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    neshanAddress: initial?.neshanAddress ?? '',
    coordinates: formatCoordinates(initial?.latitude, initial?.longitude),
    eitaa: initial?.eitaa ?? '',
    bale: initial?.bale ?? '',
    otherSocial: initial?.otherSocial ?? '',
    description: initial?.description ?? '',
    countryId: initial?.countryId ?? '',
    provinceId: initial?.provinceId ?? '',
    cityId: initial?.cityId ?? '',
    distanceToShrineKm:
      initial?.distanceToShrineKm != null ? String(initial.distanceToShrineKm) : '',
    distanceToMashhadKm:
      initial?.distanceToMashhadKm != null ? String(initial.distanceToMashhadKm) : '',
    hasLaundry: initial?.hasLaundry ?? false,
    hasInternet: initial?.hasInternet ?? false,
    hasPrayerRoom: initial?.hasPrayerRoom ?? false,
    hasElevator: initial?.hasElevator ?? false,
    heatingSystem: initial?.heatingSystem ?? '',
    coolingSystem: initial?.coolingSystem ?? '',
    parkingCapacity: initial?.parkingCapacity != null ? String(initial.parkingCapacity) : '',
    bathroomCount: initial?.bathroomCount != null ? String(initial.bathroomCount) : '',
    toiletCount: initial?.toiletCount != null ? String(initial.toiletCount) : '',
    classroomCount: initial?.classroomCount != null ? String(initial.classroomCount) : '',
    schoolDistrictId: initial?.schoolDistrictId ?? '',
    managerUserId: '',
    isPrimary: initial?.managers
      ? initial.managers.some(
          (item) => item.isPrimary && item.userId === currentUserId,
        )
      : true,
  })

  const [drafts, setDrafts] = useState<
    Record<AccommodationContactRole, AccommodationContactDraft>
  >(() => accommodationContactDraftsFromInitial(initial?.contacts))
  const [activeContactRole, setActiveContactRole] = useState<AccommodationContactRole>(
    () => firstIncompleteContactRole(drafts),
  )
  const [imageIds, setImageIds] = useState<string[]>(initial?.imageIds ?? [])
  const [typeDetails, setTypeDetails] = useState(() => typeDetailFormValuesFrom(initial))
  const typeOptions = useQuery({
    queryKey: ['accommodation-types', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<AccommodationType[]>('/accommodation-types', {
        params: { activeOnly: true },
      })
      return data
    },
  })
  const selectedType =
    typeOptions.data?.find((item) => item.id === values.typeId) ??
    (initial?.typeId === values.typeId ? initial.type : undefined)
  const isSchool = isSchoolAccommodationType(selectedType)
  const detailKind = accommodationTypeDetailKind(selectedType)

  useEffect(() => {
    if (values.typeId || !typeOptions.data?.length) return
    set('typeId', defaultAccommodationTypeId(typeOptions.data))
  }, [typeOptions.data, values.typeId])
  const districts = useQuery({
    queryKey: ['school-districts', 'lookup'],
    enabled: isSchool,
    queryFn: async () => {
      const { data } = await api.get<SchoolDistrict[]>('/school-districts')
      return data
    },
  })

  const reviewers = useQuery({
    queryKey: ['users', 'lookup', 'accommodation-reviewers'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users')
      return data
    },
  })

  const tabs = useMemo(
    () =>
      (
        [
          'general',
          'location',
          'capacity',
          'amenities',
          ...(detailKind ? (['typeDetails'] as const) : []),
          'images',
          'social',
          'contacts',
        ] as AccommodationTab[]
      )
        .concat(isAdmin ? ['inspection'] : [])
        .concat(isAdmin || initial?.id ? ['managers'] : []),
    [isAdmin, initial?.id, detailKind],
  )

  useEffect(() => {
    if (!detailKind && tab === 'typeDetails') setTab('amenities')
  }, [detailKind, tab])

  function panelClass(id: AccommodationTab) {
    return `space-y-4 ${tab === id ? '' : 'hidden'}`
  }

  const maleCapacityDisabled = values.genderType === genderTypes.FEMALE
  const femaleCapacityDisabled = values.genderType === genderTypes.MALE
  const capacityFieldClassName = `${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`
  const assignedFieldClassName = `${fieldClassName} bg-cream-100 text-ink-700`
  const assignedMaleCapacity = initial?.assignedMaleCapacity ?? 0
  const assignedFemaleCapacity = initial?.assignedFemaleCapacity ?? 0

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function setGenderType(next: GenderType) {
    setValues((current) => ({
      ...current,
      genderType: next,
      ...(next === genderTypes.MALE
        ? { femaleCapacity: '0' }
        : next === genderTypes.FEMALE
          ? { maleCapacity: '0' }
          : {}),
    }))
  }

  const mapCoordinates = useMemo(
    () => coordinatesParts(values.coordinates),
    [values.coordinates],
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = parseCoordinates(values.coordinates)
    if (parsed === 'invalid') {
      toast.error(t('accommodations.coordinatesInvalid'))
      setTab('location')
      return
    }
    if (!values.typeId) {
      toast.error(t('accommodations.type'))
      setTab('general')
      return
    }
    if (contactsOptional) {
      for (const role of accommodationContactRoles) {
        const draft = drafts[role]
        const started = Boolean(
          draft.userId ||
            draft.nationalId.trim() ||
            draft.firstName.trim() ||
            draft.lastName.trim() ||
            draft.phone.trim(),
        )
        if (started && !draft.userId && !isAccommodationContactComplete(draft)) {
          toast.error(
            t('accommodations.contactIncomplete', {
              role: t(`accommodations.contactRoles.${role}`),
            }),
          )
          setTab('contacts')
          setActiveContactRole(role)
          return
        }
      }
    }
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        typeId: values.typeId,
        status: values.status,
        genderType: values.genderType,
        managementType: values.managementType,
        maleCapacity: maleCapacityDisabled ? 0 : toNumber(values.maleCapacity),
        femaleCapacity: femaleCapacityDisabled ? 0 : toNumber(values.femaleCapacity),
        overflowPercent: Math.min(100, Math.max(0, toNumber(values.overflowPercent, 10))),
        ownerName: emptyToNull(values.ownerName),
        ownerPhone: emptyToNull(values.ownerPhone),
        imageIds,
        phone: emptyToNull(values.phone),
        ...(isAdmin
          ? {
              inspectionStatus: values.inspectionStatus,
              inspectionResult: emptyToNull(values.inspectionResult) as
                | AccommodationInspectionResult
                | null,
              reviewerId: emptyToNull(values.reviewerId),
              lastEvaluatedAt: emptyToNull(values.lastEvaluatedAt),
              operationStatus: values.operationStatus,
            }
          : {}),
        address: emptyToNull(values.address),
        neshanAddress: emptyToNull(values.neshanAddress),
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        eitaa: emptyToNull(values.eitaa),
        bale: emptyToNull(values.bale),
        otherSocial: emptyToNull(values.otherSocial),
        description: emptyToNull(values.description),
        countryId: emptyToNull(values.countryId),
        provinceId: emptyToNull(values.provinceId),
        cityId: emptyToNull(values.cityId),
        distanceToShrineKm: toOptionalNumber(values.distanceToShrineKm),
        distanceToMashhadKm: toOptionalNumber(values.distanceToMashhadKm),
        hasLaundry: values.hasLaundry,
        hasInternet: values.hasInternet,
        hasPrayerRoom: values.hasPrayerRoom,
        hasElevator: values.hasElevator,
        heatingSystem: emptyToNull(values.heatingSystem),
        coolingSystem: emptyToNull(values.coolingSystem),
        parkingCapacity: toOptionalNumber(values.parkingCapacity),
        bathroomCount: toOptionalNumber(values.bathroomCount),
        toiletCount: toOptionalNumber(values.toiletCount),
        classroomCount: isSchool ? toOptionalNumber(values.classroomCount) : null,
        schoolDistrictId: isSchool ? emptyToNull(values.schoolDistrictId) : null,
        ...typeDetailsPayloadFromForm(detailKind, typeDetails),
        contacts: toAccommodationContactPayloads(drafts),
        ...(isAdmin && !initial?.id
          ? {
              managerUserIds: values.managerUserId ? [values.managerUserId] : [],
              primaryManagerUserId: emptyToNull(values.managerUserId),
            }
          : !isAdmin
            ? { isPrimary: values.isPrimary }
            : {}),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const editManagers = Boolean(isAdmin && initial?.id)

  return (
    <div className="space-y-4">
      <FormCard
        icon={Building2}
        title={initial ? initial.name || t('accommodations.edit') : t('accommodations.create')}
        subtitle={initial ? undefined : (createSubtitle ?? t('accommodations.createSubtitle'))}
        action={headerAction}
      >
      <div className="space-y-4 p-5 sm:p-6">
      <AccommodationTabNav tab={tab} tabs={tabs} onChange={setTab} />

      {tab === 'managers' && initial ? (
        <AccommodationManagersCard
          accommodation={initial}
          users={users}
          canAssign={editManagers}
        />
      ) : (
        <AppForm
          autoFocusFirst={autoFocus || undefined}
          onSubmit={submit}
          onInvalid={(event) => {
            const panel = (event.target as HTMLElement | null)?.closest('[data-tab]')
            const next = panel?.getAttribute('data-tab') as AccommodationTab | null
            if (next) setTab(next)
          }}
          className="space-y-4"
        >

      <div data-tab="general" className={panelClass('general')}>
        <FormField icon={Building2} label={t('accommodations.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Landmark} label={t('accommodations.type')} htmlFor="typeId">
            <SearchSelect
              id="typeId"
              value={values.typeId}
              placeholder={t('accommodations.type')}
              onChange={(next) => set('typeId', next)}
              required
              options={(() => {
                const items = [...(typeOptions.data ?? [])]
                if (initial?.type && !items.some((item) => item.id === initial.type.id)) {
                  items.unshift({
                    ...initial.type,
                    icon: initial.type.icon ?? 'building-2',
                    isActive: initial.type.isActive ?? true,
                    sortOrder: 0,
                  })
                }
                return items.map((type) => ({
                  value: type.id,
                  label: name(type),
                }))
              })()}
            />
          </FormField>
          <FormField icon={Users} label={t('accommodations.genderType')} htmlFor="genderType">
            <SearchSelect
              id="genderType"
              value={values.genderType}
              onChange={(next) => setGenderType(next as GenderType)}
              options={Object.values(genderTypes).map((gender) => ({
                value: gender,
                label: t(`genderTypes.${gender}`),
              }))}
            />
          </FormField>
        </div>
        <FormField icon={BadgeCheck} label={t('accommodations.managementType')} htmlFor="managementType">
          <SearchSelect
            id="managementType"
            value={values.managementType}
            onChange={(next) => set('managementType', next as ManagementType)}
            options={Object.values(managementTypes).map((type) => ({
              value: type,
              label: t(`managementTypes.${type}`),
            }))}
          />
        </FormField>
        {initial ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField icon={Phone} label={t('accommodations.phone')} htmlFor="phone">
              <input
                id="phone"
                className={fieldClassName}
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </FormField>
            <FormField icon={ToggleRight} label={t('accommodations.status')} htmlFor="status">
              <SearchSelect
                id="status"
                value={values.status}
                onChange={(next) => set('status', next as AccommodationStatus)}
                options={Object.values(accommodationStatuses).map((status) => ({
                  value: status,
                  label: t(`accommodationStatuses.${status}`),
                }))}
              />
            </FormField>
          </div>
        ) : (
          <FormField icon={Phone} label={t('accommodations.phone')} htmlFor="phone">
            <input
              id="phone"
              className={`${fieldClassName} digit-field`}
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </FormField>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={UserRound} label={t('accommodations.ownerName')} htmlFor="ownerName">
            <input
              id="ownerName"
              className={fieldClassName}
              value={values.ownerName}
              onChange={(e) => set('ownerName', e.target.value)}
            />
          </FormField>
          <FormField icon={Phone} label={t('accommodations.ownerPhone')} htmlFor="ownerPhone">
            <input
              id="ownerPhone"
              className={`${fieldClassName} digit-field`}
              value={values.ownerPhone}
              onChange={(e) => set('ownerPhone', toLatinDigits(e.target.value))}
            />
          </FormField>
        </div>
        <FormField icon={AlignLeft} label={t('accommodations.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        {!isAdmin ? (
          <FormField icon={UserCheck} label={t('accommodations.isPrimary')}>
            <ToggleField
              checked={values.isPrimary}
              onChange={(on) => set('isPrimary', on)}
              onLabel={t('common.yes')}
              offLabel={t('common.no')}
            />
          </FormField>
        ) : null}
      </div>

      <div data-tab="location" className={panelClass('location')}>
        <FormField icon={Flag} label={t('geo.country')} htmlFor="countryId">
          <SearchSelect
            id="countryId"
            value={values.countryId}
            placeholder={t('geo.selectCountry')}
            onChange={(countryId) => {
              setValues((current) => ({
                ...current,
                countryId,
                provinceId: '',
                cityId: '',
              }))
              onCountryChange(countryId)
            }}
            options={[
              { value: '', label: t('geo.selectCountry') },
              ...countries.map((country) => ({
                value: country.id,
                label: name(country),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPinned} label={t('geo.province')} htmlFor="provinceId">
          <SearchSelect
            id="provinceId"
            value={values.provinceId}
            disabled={!values.countryId}
            placeholder={t('geo.selectProvince')}
            onChange={(provinceId) => {
              setValues((current) => ({ ...current, provinceId, cityId: '' }))
              onProvinceChange(provinceId)
            }}
            options={[
              { value: '', label: t('geo.selectProvince') },
              ...provinces.map((province) => ({
                value: province.id,
                label: name(province),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPin} label={t('geo.city')} htmlFor="cityId">
          <SearchSelect
            id="cityId"
            value={values.cityId}
            disabled={!values.provinceId}
            placeholder={t('geo.selectCity')}
            onChange={(cityId) => set('cityId', cityId)}
            options={[
              { value: '', label: t('geo.selectCity') },
              ...cities.map((city) => ({
                value: city.id,
                label: name(city),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPin} label={t('accommodations.address')} htmlFor="address">
          <textarea
            id="address"
            className={fieldClassName}
            rows={3}
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </FormField>
        <FormField icon={Navigation} label={t('accommodations.neshanAddress')} htmlFor="neshanAddress">
          <input
            id="neshanAddress"
            className={fieldClassName}
            value={values.neshanAddress}
            onChange={(e) => set('neshanAddress', e.target.value)}
          />
        </FormField>
        <FormField icon={Compass} label={t('accommodations.coordinates')} htmlFor="coordinates">
          <input
            id="coordinates"
            className={`${fieldClassName} digit-field`}
            inputMode="decimal"
            placeholder={t('accommodations.coordinatesPlaceholder')}
            value={values.coordinates}
            onChange={(e) => set('coordinates', toLatinDigits(e.target.value))}
          />
        </FormField>
        <OsmMapPicker
          latitude={mapCoordinates.latitude}
          longitude={mapCoordinates.longitude}
          active={tab === 'location'}
          onChange={(latitude, longitude) => {
            set(
              'coordinates',
              latitude && longitude ? `${latitude},${longitude}` : '',
            )
          }}
        />
      </div>

      <div data-tab="capacity" className={panelClass('capacity')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Users} label={t('accommodations.maleCapacity')} htmlFor="maleCapacity">
            <input
              id="maleCapacity"
              type="number"
              min={0}
              disabled={maleCapacityDisabled}
              className={capacityFieldClassName}
              value={values.maleCapacity}
              onChange={(e) => set('maleCapacity', e.target.value)}
            />
          </FormField>
          <FormField icon={Users} label={t('accommodations.femaleCapacity')} htmlFor="femaleCapacity">
            <input
              id="femaleCapacity"
              type="number"
              min={0}
              disabled={femaleCapacityDisabled}
              className={capacityFieldClassName}
              value={values.femaleCapacity}
              onChange={(e) => set('femaleCapacity', e.target.value)}
            />
          </FormField>
          <FormField
            icon={Percent}
            label={t('accommodations.overflowPercent')}
            htmlFor="overflowPercent"
          >
            <input
              id="overflowPercent"
              type="number"
              min={0}
              max={100}
              className={capacityFieldClassName}
              value={values.overflowPercent}
              onChange={(e) => set('overflowPercent', e.target.value)}
            />
          </FormField>
          <p className="sm:col-span-2 text-sm leading-7 text-ink-500">
            {t('accommodations.overflowHint')}
          </p>
          <FormField
            icon={Users}
            label={t('accommodations.effectiveMaleCapacity')}
            htmlFor="effectiveMaleCapacity"
          >
            <input
              id="effectiveMaleCapacity"
              readOnly
              tabIndex={-1}
              className={assignedFieldClassName}
              value={formatNumber(
                toNumber(values.maleCapacity) +
                  Math.floor((toNumber(values.maleCapacity) * toNumber(values.overflowPercent, 10)) / 100),
                locale,
              )}
            />
          </FormField>
          <FormField
            icon={Users}
            label={t('accommodations.effectiveFemaleCapacity')}
            htmlFor="effectiveFemaleCapacity"
          >
            <input
              id="effectiveFemaleCapacity"
              readOnly
              tabIndex={-1}
              className={assignedFieldClassName}
              value={formatNumber(
                toNumber(values.femaleCapacity) +
                  Math.floor(
                    (toNumber(values.femaleCapacity) * toNumber(values.overflowPercent, 10)) / 100,
                  ),
                locale,
              )}
            />
          </FormField>
          <FormField
            icon={UserCheck}
            label={t('accommodations.assignedMaleCapacity')}
            htmlFor="assignedMaleCapacity"
          >
            <input
              id="assignedMaleCapacity"
              readOnly
              tabIndex={-1}
              className={assignedFieldClassName}
              value={formatNumber(assignedMaleCapacity, locale)}
            />
          </FormField>
          <FormField
            icon={UserCheck}
            label={t('accommodations.assignedFemaleCapacity')}
            htmlFor="assignedFemaleCapacity"
          >
            <input
              id="assignedFemaleCapacity"
              readOnly
              tabIndex={-1}
              className={assignedFieldClassName}
              value={formatNumber(assignedFemaleCapacity, locale)}
            />
          </FormField>
          <FormField icon={Route} label={t('accommodations.distanceToShrineKm')} htmlFor="distanceToShrineKm">
            <input
              id="distanceToShrineKm"
              type="number"
              min={0}
              step="0.1"
              className={fieldClassName}
              value={values.distanceToShrineKm}
              onChange={(e) => set('distanceToShrineKm', e.target.value)}
            />
          </FormField>
          <FormField
            icon={Route}
            label={t('accommodations.distanceToMashhadKm')}
            htmlFor="distanceToMashhadKm"
          >
            <input
              id="distanceToMashhadKm"
              type="number"
              min={0}
              step="0.1"
              className={fieldClassName}
              value={values.distanceToMashhadKm}
              onChange={(e) => set('distanceToMashhadKm', e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <div data-tab="amenities" className={panelClass('amenities')}>
        {isSchool ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              icon={School}
              label={t('accommodations.schoolDistrict')}
              htmlFor="schoolDistrictId"
            >
              <SearchSelect
                id="schoolDistrictId"
                value={values.schoolDistrictId}
                placeholder={t('schoolDistricts.select')}
                onChange={(next) => set('schoolDistrictId', next)}
                options={[
                  { value: '', label: t('schoolDistricts.none') },
                  ...(values.schoolDistrictId &&
                  initial?.schoolDistrict?.id === values.schoolDistrictId &&
                  !(districts.data ?? []).some((item) => item.id === values.schoolDistrictId)
                    ? [
                        {
                          value: initial.schoolDistrict.id,
                          label: initial.schoolDistrict.name,
                        },
                      ]
                    : []),
                  ...(districts.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
            <FormField
              icon={LayoutGrid}
              label={t('accommodations.classroomCount')}
              htmlFor="classroomCount"
            >
              <input
                id="classroomCount"
                type="number"
                min={0}
                className={fieldClassName}
                value={values.classroomCount}
                onChange={(e) => set('classroomCount', e.target.value)}
              />
            </FormField>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <AmenityCheck
            icon={Shirt}
            label={t('accommodations.hasLaundry')}
            checked={values.hasLaundry}
            onChange={(checked) => set('hasLaundry', checked)}
            onLabel={t('accommodations.equipped')}
            offLabel={t('accommodations.notEquipped')}
          />
          <AmenityCheck
            icon={Wifi}
            label={t('accommodations.hasInternet')}
            checked={values.hasInternet}
            onChange={(checked) => set('hasInternet', checked)}
            onLabel={t('accommodations.equipped')}
            offLabel={t('accommodations.notEquipped')}
          />
          <AmenityCheck
            icon={BookOpen}
            label={t('accommodations.hasPrayerRoom')}
            checked={values.hasPrayerRoom}
            onChange={(checked) => set('hasPrayerRoom', checked)}
            onLabel={t('accommodations.equipped')}
            offLabel={t('accommodations.notEquipped')}
          />
          <AmenityCheck
            icon={ArrowUpDown}
            label={t('accommodations.hasElevator')}
            checked={values.hasElevator}
            onChange={(checked) => set('hasElevator', checked)}
            onLabel={t('accommodations.equipped')}
            offLabel={t('accommodations.notEquipped')}
          />
        </div>
        <FormField icon={Flame} label={t('accommodations.heatingSystem')} htmlFor="heatingSystem">
          <input
            id="heatingSystem"
            className={fieldClassName}
            value={values.heatingSystem}
            onChange={(e) => set('heatingSystem', e.target.value)}
          />
        </FormField>
        <FormField icon={Snowflake} label={t('accommodations.coolingSystem')} htmlFor="coolingSystem">
          <input
            id="coolingSystem"
            className={fieldClassName}
            value={values.coolingSystem}
            onChange={(e) => set('coolingSystem', e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField icon={Car} label={t('accommodations.parkingCapacity')} htmlFor="parkingCapacity">
            <input
              id="parkingCapacity"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.parkingCapacity}
              onChange={(e) => set('parkingCapacity', e.target.value)}
            />
          </FormField>
          <FormField icon={Bath} label={t('accommodations.bathroomCount')} htmlFor="bathroomCount">
            <input
              id="bathroomCount"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.bathroomCount}
              onChange={(e) => set('bathroomCount', e.target.value)}
            />
          </FormField>
          <FormField icon={Droplets} label={t('accommodations.toiletCount')} htmlFor="toiletCount">
            <input
              id="toiletCount"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.toiletCount}
              onChange={(e) => set('toiletCount', e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {detailKind ? (
        <div data-tab="typeDetails" className={panelClass('typeDetails')}>
          <AccommodationTypeDetailsFields
            kind={detailKind}
            values={typeDetails}
            onChange={(key, value) =>
              setTypeDetails((current) => ({ ...current, [key]: value }))
            }
          />
        </div>
      ) : null}

      <div data-tab="images" className={panelClass('images')}>
        <FormField icon={Images} label={t('accommodations.images')}>
          <AccommodationImagesField imageIds={imageIds} onChange={setImageIds} />
        </FormField>
      </div>

      <div data-tab="social" className={panelClass('social')}>
        <FormField icon={Share2} label={t('accommodations.eitaa')} htmlFor="eitaa">
          <input
            id="eitaa"
            className={fieldClassName}
            value={values.eitaa}
            onChange={(e) => set('eitaa', e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('accommodations.bale')} htmlFor="bale">
          <input
            id="bale"
            className={fieldClassName}
            value={values.bale}
            onChange={(e) => set('bale', e.target.value)}
          />
        </FormField>
        <FormField icon={Share2} label={t('accommodations.otherSocial')} htmlFor="otherSocial">
          <input
            id="otherSocial"
            className={fieldClassName}
            value={values.otherSocial}
            onChange={(e) => set('otherSocial', e.target.value)}
          />
        </FormField>
      </div>

      <div data-tab="contacts" className={panelClass('contacts')}>
        {contactsOptional ? (
          <p className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm leading-6 text-ink-700">
            {t('accommodations.contactsOptionalHint')}
          </p>
        ) : null}
        <AccommodationContactsPanel
          drafts={drafts}
          activeRole={activeContactRole}
          onActiveRoleChange={setActiveContactRole}
          onDraftChange={(role, draft) =>
            setDrafts((current) => ({ ...current, [role]: draft }))
          }
          fieldsRequired={!contactsOptional}
        />
      </div>

      {isAdmin ? (
        <div data-tab="inspection" className={panelClass('inspection')}>
          <FormField
            icon={ClipboardCheck}
            label={t('accommodations.inspectionStatus')}
            htmlFor="inspectionStatus"
          >
            <SearchSelect
              id="inspectionStatus"
              value={values.inspectionStatus}
              onChange={(next) => set('inspectionStatus', next as AccommodationInspectionStatus)}
              options={Object.values(accommodationInspectionStatuses).map((status) => ({
                value: status,
                label: t(`accommodationInspectionStatuses.${status}`),
              }))}
            />
          </FormField>
          <FormField
            icon={BadgeCheck}
            label={t('accommodations.inspectionResult')}
            htmlFor="inspectionResult"
          >
            <SearchSelect
              id="inspectionResult"
              value={values.inspectionResult}
              placeholder={t('accommodations.inspectionResult')}
              onChange={(next) => set('inspectionResult', next)}
              options={[
                { value: '', label: t('accommodations.inspectionResultNone') },
                ...Object.values(accommodationInspectionResults).map((result) => ({
                  value: result,
                  label: t(`accommodationInspectionResults.${result}`),
                })),
              ]}
            />
          </FormField>
          <FormField icon={UserCheck} label={t('accommodations.reviewer')} htmlFor="reviewerId">
            <SearchSelect
              id="reviewerId"
              value={values.reviewerId}
              placeholder={t('accommodations.selectReviewer')}
              onChange={(next) => set('reviewerId', next)}
              options={[
                { value: '', label: t('accommodations.selectReviewer') },
                ...(reviewers.data ?? []).map((user) => ({
                  value: user.id,
                  label: user.fullName,
                })),
              ]}
            />
          </FormField>
          <FormField
            icon={CalendarDays}
            label={t('accommodations.lastEvaluatedAt')}
            htmlFor="lastEvaluatedAt"
          >
            <PersianDateField
              id="lastEvaluatedAt"
              value={values.lastEvaluatedAt || undefined}
              onChange={(next) => set('lastEvaluatedAt', next ?? '')}
            />
          </FormField>
          <FormField
            icon={ToggleRight}
            label={t('accommodations.operationStatus')}
            htmlFor="operationStatus"
          >
            <SearchSelect
              id="operationStatus"
              value={values.operationStatus}
              onChange={(next) => set('operationStatus', next as AccommodationOperationStatus)}
              options={Object.values(accommodationOperationStatuses).map((status) => ({
                value: status,
                label: t(`accommodationOperationStatuses.${status}`),
              }))}
            />
          </FormField>
        </div>
      ) : null}

      {isAdmin && !initial?.id ? (
        <div data-tab="managers" className={panelClass('managers')}>
          <FormField icon={UserRound} label={t('accommodations.selectManager')} htmlFor="create-activity-manager">
            <SearchSelect
              id="create-activity-manager"
              value={values.managerUserId}
              placeholder={t('accommodations.withoutManager')}
              onChange={(next) => set('managerUserId', next)}
              options={[
                { value: '', label: t('accommodations.withoutManager') },
                ...users.map((user) => ({
                  value: user.id,
                  label: `${user.fullName} — ${user.username}`,
                })),
              ]}
            />
          </FormField>
        </div>
      ) : null}

      <div>
        <FormActions
          submitLabel={t('accommodations.save')}
          cancelLabel={t('accommodations.cancel')}
          submitting={saving}
          onCancel={onCancel ?? (() => history.back())}
        />
      </div>
        </AppForm>
      )}
      </div>
      </FormCard>
    </div>
  )
}

function AmenityCheck({
  icon: Icon,
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  icon: typeof Shirt
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  onLabel: string
  offLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-ink-800">
        <Icon className="size-4 text-teal-600" aria-hidden />
        {label}
      </span>
      <ToggleField checked={checked} onChange={onChange} onLabel={onLabel} offLabel={offLabel} />
    </div>
  )
}
