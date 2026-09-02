import {
  AlignLeft,
  MapPin,
  MapPinned,
  Mars,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Share2,
  Type,
  UserRound,
  Venus,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
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
