import {
  AlignLeft,
  ArrowUpDown,
  BadgeCheck,
  Bath,
  Building2,
  Car,
  Droplets,
  Flag,
  Flame,
  Landmark,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
  Route,
  Share2,
  Shirt,
  Snowflake,
  ToggleRight,
  UserCheck,
  Users,
  Wifi,
  BookOpen,
  Compass,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, cardClassName, fieldClassName } from '../../components/ui/Form'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { currentPersianYear } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import {
  accommodationStatuses,
  accommodationTypes,
  genderTypes,
  managementTypes,
  type Accommodation,
  type AccommodationStatus,
  type AccommodationType,
  type Country,
  type GenderType,
  type ManagedUser,
  type ManagementType,
  type Province,
  type City,
} from '../../types/app'
import { AccommodationManagersCard } from './AccommodationManagersCard'
import { AccommodationTabNav, type AccommodationTab } from './AccommodationTabs'

export type AccommodationPayload = {
  name: string
  type: AccommodationType
  status: AccommodationStatus
  genderType: GenderType
  managementType: ManagementType
  maleCapacity: number
  femaleCapacity: number
  assignedMaleCapacity: number
  assignedFemaleCapacity: number
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
  managerUserIds?: string[]
  primaryManagerUserId?: string | null
  isPrimary?: boolean
}

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
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<AccommodationTab>('general')
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? accommodationTypes.HOUSE,
    status: initial?.status ?? accommodationStatuses.ACTIVE,
    genderType: initial?.genderType ?? genderTypes.MIXED,
    managementType: initial?.managementType ?? managementTypes.SELF_SUFFICIENT,
    maleCapacity: String(initial?.maleCapacity ?? 0),
    femaleCapacity: String(initial?.femaleCapacity ?? 0),
    assignedMaleCapacity: String(initial?.assignedMaleCapacity ?? 0),
    assignedFemaleCapacity: String(initial?.assignedFemaleCapacity ?? 0),
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    neshanAddress: initial?.neshanAddress ?? '',
    latitude: initial?.latitude != null ? String(initial.latitude) : '',
    longitude: initial?.longitude != null ? String(initial.longitude) : '',
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
    managerUserIds: (initial?.managers ?? [])
      .filter((item) => item.year === currentPersianYear())
      .map((item) => item.userId),
    primaryManagerUserId:
      (initial?.managers ?? []).find(
        (item) => item.year === currentPersianYear() && item.isPrimary,
      )?.userId ?? '',
    isPrimary: initial?.managers
      ? initial.managers.some(
          (item) =>
            item.year === currentPersianYear() &&
            item.isPrimary &&
            item.userId === currentUserId,
        )
      : true,
  })

  const tabs = useMemo(
    () =>
      (
        ['general', 'location', 'capacity', 'amenities', 'social'] as AccommodationTab[]
      ).concat(isAdmin ? ['managers'] : []),
    [isAdmin],
  )

  function panelClass(id: AccommodationTab) {
    return `space-y-4 p-6 ${cardClassName} ${tab === id ? '' : 'hidden'}`
  }

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function toggleManager(userId: string) {
    setValues((current) => {
      const selected = current.managerUserIds.includes(userId)
        ? current.managerUserIds.filter((id) => id !== userId)
        : [...current.managerUserIds, userId]
      const primaryManagerUserId = selected.includes(current.primaryManagerUserId)
        ? current.primaryManagerUserId
        : (selected[0] ?? '')
      return { ...current, managerUserIds: selected, primaryManagerUserId }
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type,
        status: values.status,
        genderType: values.genderType,
        managementType: values.managementType,
        maleCapacity: toNumber(values.maleCapacity),
        femaleCapacity: toNumber(values.femaleCapacity),
        assignedMaleCapacity: toNumber(values.assignedMaleCapacity),
        assignedFemaleCapacity: toNumber(values.assignedFemaleCapacity),
        phone: emptyToNull(values.phone),
        address: emptyToNull(values.address),
        neshanAddress: emptyToNull(values.neshanAddress),
        latitude: toOptionalNumber(values.latitude),
        longitude: toOptionalNumber(values.longitude),
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
        ...(isAdmin && !initial?.id
          ? {
              managerUserIds: values.managerUserIds,
              primaryManagerUserId: emptyToNull(values.primaryManagerUserId),
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
      <AccommodationTabNav tab={tab} tabs={tabs} onChange={setTab} />

      {tab === 'managers' && editManagers && initial ? (
        <AccommodationManagersCard accommodation={initial} users={users} />
      ) : (
        <AppForm
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
          <FormField icon={Landmark} label={t('accommodations.type')} htmlFor="type">
            <SearchSelect
              id="type"
              value={values.type}
              onChange={(next) => set('type', next as AccommodationType)}
              options={Object.values(accommodationTypes).map((type) => ({
                value: type,
                label: t(`accommodationTypes.${type}`),
              }))}
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
        <FormField icon={Users} label={t('accommodations.genderType')} htmlFor="genderType">
          <SearchSelect
            id="genderType"
            value={values.genderType}
            onChange={(next) => set('genderType', next as GenderType)}
            options={Object.values(genderTypes).map((gender) => ({
              value: gender,
              label: t(`genderTypes.${gender}`),
            }))}
          />
        </FormField>
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
        <FormField icon={Phone} label={t('accommodations.phone')} htmlFor="phone">
          <input
            id="phone"
            className={fieldClassName}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </FormField>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Compass} label={t('accommodations.latitude')} htmlFor="latitude">
            <input
              id="latitude"
              type="number"
              step="any"
              className={fieldClassName}
              value={values.latitude}
              onChange={(e) => set('latitude', e.target.value)}
            />
          </FormField>
          <FormField icon={Compass} label={t('accommodations.longitude')} htmlFor="longitude">
            <input
              id="longitude"
              type="number"
              step="any"
              className={fieldClassName}
              value={values.longitude}
              onChange={(e) => set('longitude', e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <div data-tab="capacity" className={panelClass('capacity')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Users} label={t('accommodations.maleCapacity')} htmlFor="maleCapacity">
            <input
              id="maleCapacity"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.maleCapacity}
              onChange={(e) => set('maleCapacity', e.target.value)}
            />
          </FormField>
          <FormField icon={Users} label={t('accommodations.femaleCapacity')} htmlFor="femaleCapacity">
            <input
              id="femaleCapacity"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.femaleCapacity}
              onChange={(e) => set('femaleCapacity', e.target.value)}
            />
          </FormField>
          <FormField
            icon={UserCheck}
            label={t('accommodations.assignedMaleCapacity')}
            htmlFor="assignedMaleCapacity"
          >
            <input
              id="assignedMaleCapacity"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.assignedMaleCapacity}
              onChange={(e) => set('assignedMaleCapacity', e.target.value)}
            />
          </FormField>
          <FormField
            icon={UserCheck}
            label={t('accommodations.assignedFemaleCapacity')}
            htmlFor="assignedFemaleCapacity"
          >
            <input
              id="assignedFemaleCapacity"
              type="number"
              min={0}
              className={fieldClassName}
              value={values.assignedFemaleCapacity}
              onChange={(e) => set('assignedFemaleCapacity', e.target.value)}
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

      {isAdmin && !initial?.id ? (
        <div data-tab="managers" className={panelClass('managers')}>
          <div className="space-y-2">
            {users.length ? (
              users.map((user) => (
                <CheckboxField
                  key={user.id}
                  checked={values.managerUserIds.includes(user.id)}
                  onChange={(on) => {
                    const selected = values.managerUserIds.includes(user.id)
                    if (on !== selected) toggleManager(user.id)
                  }}
                  label={
                    <span>
                      {user.fullName}
                      <span className="ms-2 text-ink-400">{user.username}</span>
                    </span>
                  }
                />
              ))
            ) : (
              <p className="text-sm text-ink-500">{t('accommodations.noManagers')}</p>
            )}
          </div>
          <FormField icon={UserCheck} label={t('accommodations.primaryManager')} htmlFor="primaryManagerUserId">
            <SearchSelect
              id="primaryManagerUserId"
              value={values.primaryManagerUserId}
              disabled={!values.managerUserIds.length}
              placeholder={t('accommodations.selectPrimaryManager')}
              onChange={(next) => set('primaryManagerUserId', next)}
              options={[
                { value: '', label: t('accommodations.selectPrimaryManager') },
                ...users
                  .filter((user) => values.managerUserIds.includes(user.id))
                  .map((user) => ({
                    value: user.id,
                    label: user.fullName,
                  })),
              ]}
            />
          </FormField>
        </div>
      ) : null}

      <div className={`p-6 ${cardClassName}`}>
        <FormActions
          submitLabel={t('accommodations.save')}
          cancelLabel={t('accommodations.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </div>
        </AppForm>
      )}
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
