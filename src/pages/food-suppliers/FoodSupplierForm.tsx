import { AlignLeft, MapPin, MapPinned, Phone, UtensilsCrossed } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, FoodSupplier, Province } from '../../types/app'

export type FoodSupplierPayload = {
  name: string
  provinceId: string
  cityId: string
  phone: string | null
  address: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function FoodSupplierForm({
  initial,
  initialProvinceId = '',
  initialCityId = '',
  provinces,
  cities,
  onProvinceChange,
  onSubmit,
}: {
  initial?: FoodSupplier
  initialProvinceId?: string
  initialCityId?: string
  provinces: Province[]
  cities: City[]
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: FoodSupplierPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    provinceId: initial?.provinceId ?? initialProvinceId,
    cityId: initial?.cityId ?? initialCityId,
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
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
      icon={UtensilsCrossed}
      title={initial ? initial.name || t('foodSuppliers.edit') : t('foodSuppliers.create')}
      subtitle={initial ? undefined : t('foodSuppliers.createSubtitle')}
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
      <FormField icon={UtensilsCrossed} label={t('foodSuppliers.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Phone} label={t('foodSuppliers.phone')} htmlFor="phone">
        <input
          id="phone"
          className={fieldClassName}
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </FormField>
      <FormField icon={MapPin} label={t('foodSuppliers.address')} htmlFor="address">
        <textarea
          id="address"
          className={fieldClassName}
          rows={3}
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('foodSuppliers.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('foodSuppliers.save')}
        cancelLabel={t('foodSuppliers.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
    </FormCard>
  )
}
