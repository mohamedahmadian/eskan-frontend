import { AlignLeft, CookingPot, MapPin, Navigation, Phone, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import { parseDigitString } from '../../lib/datetime'
import type { Restaurant } from '../../types/app'

export type RestaurantPayload = {
  name: string
  managerName: string | null
  managerPhone: string | null
  address: string | null
  neshanAddress: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function RestaurantForm({
  initial,
  onSubmit,
}: {
  initial?: Restaurant
  onSubmit: (payload: RestaurantPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    managerName: initial?.managerName ?? '',
    managerPhone: initial?.managerPhone ?? '',
    address: initial?.address ?? '',
    neshanAddress: initial?.neshanAddress ?? '',
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
        managerName: emptyToNull(values.managerName),
        managerPhone: emptyToNull(values.managerPhone),
        address: emptyToNull(values.address),
        neshanAddress: emptyToNull(values.neshanAddress),
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
      icon={CookingPot}
      title={initial ? initial.name || t('restaurants.edit') : t('restaurants.create')}
      subtitle={initial ? undefined : t('restaurants.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={CookingPot} label={t('restaurants.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={UserRound} label={t('restaurants.managerName')} htmlFor="managerName">
          <input
            id="managerName"
            className={fieldClassName}
            value={values.managerName}
            onChange={(e) => set('managerName', e.target.value)}
          />
        </FormField>
        <FormField icon={Phone} label={t('restaurants.managerPhone')} htmlFor="managerPhone">
          <input
            id="managerPhone"
            className={`${fieldClassName} digit-field`}
            value={values.managerPhone}
            onChange={(e) => set('managerPhone', parseDigitString(e.target.value).slice(0, 15))}
          />
        </FormField>
        <FormField icon={MapPin} label={t('restaurants.address')} htmlFor="address">
          <textarea
            id="address"
            className={fieldClassName}
            rows={3}
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </FormField>
        <FormField icon={Navigation} label={t('restaurants.neshanAddress')} htmlFor="neshanAddress">
          <input
            id="neshanAddress"
            className={fieldClassName}
            value={values.neshanAddress}
            onChange={(e) => set('neshanAddress', e.target.value)}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('restaurants.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormActions
          submitLabel={t('restaurants.save')}
          cancelLabel={t('restaurants.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
