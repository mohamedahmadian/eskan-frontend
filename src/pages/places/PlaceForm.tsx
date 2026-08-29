import {
  AlignLeft,
  Compass,
  Landmark,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  Tags,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, Place, PlaceTypeRef, Province } from '../../types/app'

export type PlacePayload = {
  name: string
  placeTypeId: string
  provinceId: string
  cityId: string
  phone: string | null
  address: string | null
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
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

export function PlaceForm({
  initial,
  provinces,
  cities,
  placeTypes,
  onProvinceChange,
  onSubmit,
}: {
  initial?: Place
  provinces: Province[]
  cities: City[]
  placeTypes: PlaceTypeRef[]
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: PlacePayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    placeTypeId: initial?.placeTypeId ?? '',
    provinceId: initial?.provinceId ?? '',
    cityId: initial?.cityId ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    neshanAddress: initial?.neshanAddress ?? '',
    latitude: initial?.latitude != null ? String(initial.latitude) : '',
    longitude: initial?.longitude != null ? String(initial.longitude) : '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        placeTypeId: values.placeTypeId,
        provinceId: values.provinceId,
        cityId: values.cityId,
        phone: emptyToNull(values.phone),
        address: emptyToNull(values.address),
        neshanAddress: emptyToNull(values.neshanAddress),
        latitude: toOptionalNumber(values.latitude),
        longitude: toOptionalNumber(values.longitude),
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
      icon={Landmark}
      title={initial ? initial.name || t('places.edit') : t('places.create')}
      subtitle={initial ? undefined : t('places.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={MapPinned} label={t('geo.province')} htmlFor="provinceId">
          <SearchSelect
            id="provinceId"
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
        <FormField icon={MapPin} label={t('geo.city')} htmlFor="cityId">
          <SearchSelect
            id="cityId"
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
        <FormField icon={Tags} label={t('places.placeType')} htmlFor="placeTypeId">
          <SearchSelect
            id="placeTypeId"
            value={values.placeTypeId}
            required
            onChange={(next) => set('placeTypeId', next)}
            placeholder={t('places.selectType')}
            options={[
              { value: '', label: t('places.selectType') },
              ...placeTypes.map((type) => ({
                value: type.id,
                label: name(type),
              })),
            ]}
          />
        </FormField>
        <FormField icon={Landmark} label={t('places.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Phone} label={t('places.phone')} htmlFor="phone">
          <input
            id="phone"
            className={`${fieldClassName} digit-field`}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </FormField>
        <FormField icon={MapPin} label={t('places.address')} htmlFor="address">
          <textarea
            id="address"
            className={fieldClassName}
            rows={3}
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </FormField>
        <FormField icon={Navigation} label={t('geo.neshanAddress')} htmlFor="neshanAddress">
          <input
            id="neshanAddress"
            className={fieldClassName}
            value={values.neshanAddress}
            onChange={(e) => set('neshanAddress', e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={Compass} label={t('geo.latitude')} htmlFor="latitude">
            <input
              id="latitude"
              type="number"
              step="any"
              className={fieldClassName}
              value={values.latitude}
              onChange={(e) => set('latitude', e.target.value)}
            />
          </FormField>
          <FormField icon={Compass} label={t('geo.longitude')} htmlFor="longitude">
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
        <OsmMapPicker
          latitude={values.latitude}
          longitude={values.longitude}
          onChange={(latitude, longitude) => {
            set('latitude', latitude)
            set('longitude', longitude)
          }}
        />
        <FormField icon={AlignLeft} label={t('places.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('places.save')}
          cancelLabel={t('places.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
