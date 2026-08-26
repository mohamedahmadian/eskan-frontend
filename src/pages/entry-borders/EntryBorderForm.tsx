import { AlignLeft, Fence, Flag, MapPin, MapPinned, ToggleRight, Type } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  ToggleField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, Country, EntryBorder, EntryBorderType, Province } from '../../types/app'
import { ENTRY_BORDER_TYPES } from '../../types/app'

export type EntryBorderPayload = {
  name: string
  neighboringCountryId: string
  provinceId: string
  cityId: string
  borderType: EntryBorderType
  isActive: boolean
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function EntryBorderForm({
  initial,
  countries,
  provinces,
  cities,
  onProvinceChange,
  onSubmit,
}: {
  initial?: EntryBorder
  countries: Country[]
  provinces: Province[]
  cities: City[]
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: EntryBorderPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const name = useGeoName()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    neighboringCountryId: initial?.neighboringCountryId ?? '',
    provinceId: initial?.provinceId ?? '',
    cityId: initial?.cityId ?? '',
    borderType: (initial?.borderType ?? '') as EntryBorderType | '',
    isActive: initial?.isActive ?? true,
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values.borderType) {
      toast.error(t('entryBorders.selectType'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        neighboringCountryId: values.neighboringCountryId,
        provinceId: values.provinceId,
        cityId: values.cityId,
        borderType: values.borderType,
        isActive: values.isActive,
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
      icon={Fence}
      title={initial?.name || t('entryBorders.create')}
      subtitle={initial?.name ? undefined : t('entryBorders.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('entryBorders.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField
          icon={Flag}
          label={t('entryBorders.neighboringCountry')}
          htmlFor="neighboringCountryId"
        >
          <SearchSelect
            id="neighboringCountryId"
            value={values.neighboringCountryId}
            required
            onChange={(next) => set('neighboringCountryId', next)}
            placeholder={t('entryBorders.selectCountry')}
            options={[
              { value: '', label: t('entryBorders.selectCountry') },
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
        <FormField icon={Fence} label={t('entryBorders.borderType')} htmlFor="borderType">
          <SearchSelect
            id="borderType"
            value={values.borderType}
            required
            onChange={(next) => set('borderType', next as EntryBorderType)}
            placeholder={t('entryBorders.selectType')}
            options={[
              { value: '', label: t('entryBorders.selectType') },
              ...ENTRY_BORDER_TYPES.map((type) => ({
                value: type,
                label: t(`entryBorders.types.${type}`),
              })),
            ]}
          />
        </FormField>
        <FormField icon={ToggleRight} label={t('geo.isActive')} htmlFor="isActive">
          <ToggleField
            id="isActive"
            checked={values.isActive}
            onChange={(next) => set('isActive', next)}
            onLabel={t('geo.active')}
            offLabel={t('geo.inactive')}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('entryBorders.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('entryBorders.save')}
          cancelLabel={t('entryBorders.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
