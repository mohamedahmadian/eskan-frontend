import { AlignLeft, Compass, Hospital, MapPin, MapPinned, Navigation, Phone } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, cardClassName, fieldClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, MedicalCenter, Province } from '../../types/app'

export type MedicalCenterPayload = {
  name: string
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

export function MedicalCenterForm({
  initial,
  provinces,
  cities,
  onProvinceChange,
  onSubmit,
}: {
  initial?: MedicalCenter
  provinces: Province[]
  cities: City[]
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: MedicalCenterPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
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
    <AppForm onSubmit={submit} className={`space-y-4 p-6 ${cardClassName}`}>
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
      <FormField icon={Hospital} label={t('medicalCenters.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Phone} label={t('medicalCenters.phone')} htmlFor="phone">
        <input
          id="phone"
          className={fieldClassName}
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </FormField>
      <FormField icon={MapPin} label={t('medicalCenters.address')} htmlFor="address">
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
      <FormField icon={AlignLeft} label={t('medicalCenters.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('medicalCenters.save')}
        cancelLabel={t('medicalCenters.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
  )
}
