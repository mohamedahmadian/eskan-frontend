import {
  AlignLeft,
  ArrowUpDown,
  Bath,
  BookOpen,
  Car,
  Droplets,
  Flame,
  MapPin,
  MapPinned,
  Mars,
  Maximize2,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Share2,
  Shirt,
  Snowflake,
  Type,
  UserRound,
  Venus,
  Wifi,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { parseDigitString, toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { City, Province, WalkingStation } from '../../types/app'

export type WalkingStationPayload = {
  name: string
  cityId: string
  latitude: number | null
  longitude: number | null
  address: string | null
  neshanAddress: string | null
  maleCount: number
  femaleCount: number
  managerName: string | null
  managerPhone: string | null
  managerTelegram: string | null
  managerWhatsapp: string | null
  managerEitaa: string | null
  distanceToMashhadKm: number | null
  description: string | null
  hasLaundry: boolean
  hasInternet: boolean
  hasPrayerRoom: boolean
  hasElevator: boolean
  heatingSystem: string | null
  coolingSystem: string | null
  parkingCapacity: number | null
  bathroomCount: number | null
  toiletCount: number | null
  areaSqm: number | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toCount(value: string) {
  const parsed = Number(toLatinDigits(value.trim()))
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.floor(parsed)
}

function toCoordString(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? '' : String(value)
}

export function WalkingStationForm({
  initial,
  provinces,
  cities,
  onProvinceChange,
  onSubmit,
}: {
  initial?: WalkingStation
  provinces: Province[]
  cities: City[]
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: WalkingStationPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    provinceId: initial?.city.provinceId ?? '',
    cityId: initial?.cityId ?? '',
    latitude: toCoordString(initial?.latitude),
    longitude: toCoordString(initial?.longitude),
    address: initial?.address ?? '',
    neshanAddress: initial?.neshanAddress ?? '',
    maleCount: String(initial?.maleCount ?? 0),
    femaleCount: String(initial?.femaleCount ?? 0),
    managerName: initial?.managerName ?? '',
    managerPhone: initial?.managerPhone ?? '',
    managerTelegram: initial?.managerTelegram ?? '',
    managerWhatsapp: initial?.managerWhatsapp ?? '',
    managerEitaa: initial?.managerEitaa ?? '',
    distanceToMashhadKm:
      initial?.distanceToMashhadKm != null ? String(initial.distanceToMashhadKm) : '',
    description: initial?.description ?? '',
    hasLaundry: initial?.hasLaundry ?? false,
    hasInternet: initial?.hasInternet ?? false,
    hasPrayerRoom: initial?.hasPrayerRoom ?? false,
    hasElevator: initial?.hasElevator ?? false,
    heatingSystem: initial?.heatingSystem ?? '',
    coolingSystem: initial?.coolingSystem ?? '',
    parkingCapacity: initial?.parkingCapacity != null ? String(initial.parkingCapacity) : '',
    bathroomCount: initial?.bathroomCount != null ? String(initial.bathroomCount) : '',
    toiletCount: initial?.toiletCount != null ? String(initial.toiletCount) : '',
    areaSqm: initial?.areaSqm != null ? String(initial.areaSqm) : '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const selectedCity = cities.find((item) => item.id === values.cityId)
  const mapFocus =
    toOptionalNumber(values.latitude) == null &&
    toOptionalNumber(values.longitude) == null &&
    selectedCity?.latitude != null &&
    selectedCity.longitude != null
      ? { lat: selectedCity.latitude, lng: selectedCity.longitude, zoom: 13 }
      : null

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        cityId: values.cityId,
        latitude: toOptionalNumber(values.latitude),
        longitude: toOptionalNumber(values.longitude),
        address: emptyToNull(values.address),
        neshanAddress: emptyToNull(values.neshanAddress),
        maleCount: toCount(values.maleCount),
        femaleCount: toCount(values.femaleCount),
        managerName: emptyToNull(values.managerName),
        managerPhone: emptyToNull(values.managerPhone),
        managerTelegram: emptyToNull(values.managerTelegram),
        managerWhatsapp: emptyToNull(values.managerWhatsapp),
        managerEitaa: emptyToNull(values.managerEitaa),
        distanceToMashhadKm: toOptionalNumber(values.distanceToMashhadKm),
        description: emptyToNull(values.description),
        hasLaundry: values.hasLaundry,
        hasInternet: values.hasInternet,
        hasPrayerRoom: values.hasPrayerRoom,
        hasElevator: values.hasElevator,
        heatingSystem: emptyToNull(values.heatingSystem),
        coolingSystem: emptyToNull(values.coolingSystem),
        parkingCapacity: toOptionalNumber(values.parkingCapacity),
        bathroomCount: toOptionalNumber(values.bathroomCount),
        toiletCount: toOptionalNumber(values.toiletCount),
        areaSqm: toOptionalNumber(values.areaSqm),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Milestone}
      title={initial ? initial.name || t('walkingStations.edit') : t('walkingStations.create')}
      subtitle={initial ? undefined : t('walkingStations.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('walkingStations.name')} htmlFor="station-name">
          <input
            id="station-name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={1}
          />
        </FormField>
        <FormField icon={MapPinned} label={t('geo.province')} htmlFor="station-province">
          <SearchSelect
            id="station-province"
            value={values.provinceId}
            required
            onChange={(next) => {
              set('provinceId', next)
              set('cityId', '')
              onProvinceChange(next)
            }}
            placeholder={t('geo.selectProvince')}
            options={[
              { value: '', label: t('geo.selectProvince') },
              ...provinces.map((province) => ({
                value: province.id,
                label: name(province),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPin} label={t('geo.city')} htmlFor="station-city">
          <SearchSelect
            id="station-city"
            value={values.cityId}
            required
            disabled={!values.provinceId}
            onChange={(next) => set('cityId', next)}
            placeholder={t('geo.selectCity')}
            options={[
              { value: '', label: t('geo.selectCity') },
              ...cities.map((city) => ({
                value: city.id,
                label: name(city),
              })),
            ]}
          />
        </FormField>
        <FormField icon={MapPinned} label={t('walkingStations.location')}>
          <OsmMapPicker
            latitude={values.latitude}
            longitude={values.longitude}
            focus={mapFocus}
            onChange={(latitude, longitude) => {
              set('latitude', latitude)
              set('longitude', longitude)
            }}
          />
        </FormField>
        <FormField icon={MapPin} label={t('walkingStations.address')} htmlFor="station-address">
          <textarea
            id="station-address"
            className={fieldClassName}
            rows={3}
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </FormField>
        <FormField
          icon={Navigation}
          label={t('walkingStations.neshanAddress')}
          htmlFor="station-neshan"
        >
          <input
            id="station-neshan"
            className={fieldClassName}
            value={values.neshanAddress}
            onChange={(e) => set('neshanAddress', e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            icon={Mars}
            label={t('walkingStations.maleCount')}
            htmlFor="station-male"
          >
            <input
              id="station-male"
              className={fieldClassName}
              type="number"
              min={0}
              step={1}
              value={values.maleCount}
              onChange={(e) => set('maleCount', e.target.value)}
            />
          </FormField>
          <FormField
            icon={Venus}
            label={t('walkingStations.femaleCount')}
            htmlFor="station-female"
          >
            <input
              id="station-female"
              className={fieldClassName}
              type="number"
              min={0}
              step={1}
              value={values.femaleCount}
              onChange={(e) => set('femaleCount', e.target.value)}
            />
          </FormField>
        </div>
        <FormField
          icon={Milestone}
          label={t('walkingRoutes.stageDistanceToMashhadKm')}
          htmlFor="station-mashhad"
        >
          <input
            id="station-mashhad"
            className={fieldClassName}
            type="number"
            min={0}
            step="0.01"
            value={values.distanceToMashhadKm}
            onChange={(e) => set('distanceToMashhadKm', e.target.value)}
          />
        </FormField>
        <FormSectionTitle icon={Shirt}>{t('walkingStations.sectionAmenities')}</FormSectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <AmenityCheck
            icon={Shirt}
            label={t('walkingStations.hasLaundry')}
            checked={values.hasLaundry}
            onChange={(checked) => set('hasLaundry', checked)}
            onLabel={t('walkingStations.equipped')}
            offLabel={t('walkingStations.notEquipped')}
          />
          <AmenityCheck
            icon={Wifi}
            label={t('walkingStations.hasInternet')}
            checked={values.hasInternet}
            onChange={(checked) => set('hasInternet', checked)}
            onLabel={t('walkingStations.equipped')}
            offLabel={t('walkingStations.notEquipped')}
          />
          <AmenityCheck
            icon={BookOpen}
            label={t('walkingStations.hasPrayerRoom')}
            checked={values.hasPrayerRoom}
            onChange={(checked) => set('hasPrayerRoom', checked)}
            onLabel={t('walkingStations.equipped')}
            offLabel={t('walkingStations.notEquipped')}
          />
          <AmenityCheck
            icon={ArrowUpDown}
            label={t('walkingStations.hasElevator')}
            checked={values.hasElevator}
            onChange={(checked) => set('hasElevator', checked)}
            onLabel={t('walkingStations.equipped')}
            offLabel={t('walkingStations.notEquipped')}
          />
        </div>
        <FormField
          icon={Flame}
          label={t('walkingStations.heatingSystem')}
          htmlFor="station-heating"
        >
          <input
            id="station-heating"
            className={fieldClassName}
            value={values.heatingSystem}
            onChange={(e) => set('heatingSystem', e.target.value)}
          />
        </FormField>
        <FormField
          icon={Snowflake}
          label={t('walkingStations.coolingSystem')}
          htmlFor="station-cooling"
        >
          <input
            id="station-cooling"
            className={fieldClassName}
            value={values.coolingSystem}
            onChange={(e) => set('coolingSystem', e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            icon={Car}
            label={t('walkingStations.parkingCapacity')}
            htmlFor="station-parking"
          >
            <input
              id="station-parking"
              className={fieldClassName}
              type="number"
              min={0}
              step={1}
              value={values.parkingCapacity}
              onChange={(e) => set('parkingCapacity', e.target.value)}
            />
          </FormField>
          <FormField
            icon={Bath}
            label={t('walkingStations.bathroomCount')}
            htmlFor="station-bath"
          >
            <input
              id="station-bath"
              className={fieldClassName}
              type="number"
              min={0}
              step={1}
              value={values.bathroomCount}
              onChange={(e) => set('bathroomCount', e.target.value)}
            />
          </FormField>
          <FormField
            icon={Droplets}
            label={t('walkingStations.toiletCount')}
            htmlFor="station-toilet"
          >
            <input
              id="station-toilet"
              className={fieldClassName}
              type="number"
              min={0}
              step={1}
              value={values.toiletCount}
              onChange={(e) => set('toiletCount', e.target.value)}
            />
          </FormField>
          <FormField icon={Maximize2} label={t('walkingStations.areaSqm')} htmlFor="station-area">
            <input
              id="station-area"
              className={fieldClassName}
              type="number"
              min={0}
              step="0.01"
              value={values.areaSqm}
              onChange={(e) => set('areaSqm', e.target.value)}
            />
          </FormField>
        </div>
        <FormSectionTitle icon={UserRound}>{t('walkingRoutes.sectionManager')}</FormSectionTitle>
        <FormField
          icon={UserRound}
          label={t('walkingStations.managerName')}
          htmlFor="station-manager"
        >
          <input
            id="station-manager"
            className={fieldClassName}
            value={values.managerName}
            onChange={(e) => set('managerName', e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Phone} label={t('walkingRoutes.managerPhone')} htmlFor="station-phone">
            <input
              id="station-phone"
              className={`${fieldClassName} digit-field`}
              value={values.managerPhone}
              onChange={(e) => set('managerPhone', parseDigitString(e.target.value).slice(0, 15))}
            />
          </FormField>
          <FormField
            icon={Phone}
            label={t('walkingRoutes.managerWhatsapp')}
            htmlFor="station-whatsapp"
          >
            <input
              id="station-whatsapp"
              className={`${fieldClassName} digit-field`}
              value={values.managerWhatsapp}
              onChange={(e) =>
                set('managerWhatsapp', parseDigitString(e.target.value).slice(0, 15))
              }
            />
          </FormField>
          <FormField
            icon={MessageCircle}
            label={t('walkingRoutes.managerTelegram')}
            htmlFor="station-telegram"
          >
            <input
              id="station-telegram"
              className={fieldClassName}
              dir="ltr"
              value={values.managerTelegram}
              onChange={(e) => set('managerTelegram', e.target.value)}
            />
          </FormField>
          <FormField icon={Share2} label={t('walkingRoutes.managerEitaa')} htmlFor="station-eitaa">
            <input
              id="station-eitaa"
              className={fieldClassName}
              dir="ltr"
              value={values.managerEitaa}
              onChange={(e) => set('managerEitaa', e.target.value)}
            />
          </FormField>
        </div>
        <FormField
          icon={AlignLeft}
          label={t('walkingRoutes.description')}
          htmlFor="station-description"
        >
          <textarea
            id="station-description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('walkingStations.save')}
          cancelLabel={t('walkingStations.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
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
