import { Hash, Languages, Shapes, Tags, ToggleRight, Type } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { slugifyCode } from '../../lib/geo'
import { getNavIcon } from '../../lib/icons'
import { placeTypeIconValues } from '../../lib/place-type-icons'
import type { PlaceType } from '../../types/app'

export type PlaceTypePayload = {
  code: string
  nameFa: string
  nameEn: string
  icon: string
  isActive: boolean
  sortOrder: number
}

export function PlaceTypeForm({
  initial,
  onSubmit,
}: {
  initial?: PlaceType
  onSubmit: (payload: PlaceTypePayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [codeTouched, setCodeTouched] = useState(Boolean(initial?.code))
  const [values, setValues] = useState({
    nameFa: initial?.nameFa ?? '',
    nameEn: initial?.nameEn ?? '',
    code: initial?.code ?? '',
    icon: initial?.icon ?? 'landmark',
    isActive: initial?.isActive ?? true,
    sortOrder: String(initial?.sortOrder ?? 0),
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        nameFa: values.nameFa.trim(),
        nameEn: values.nameEn.trim(),
        code: slugifyCode(values.code) || slugifyCode(values.nameEn),
        icon: values.icon,
        isActive: values.isActive,
        sortOrder: Number(values.sortOrder) || 0,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Tags}
      title={initial ? initial.nameFa || t('placeTypes.edit') : t('placeTypes.create')}
      subtitle={initial ? undefined : t('placeTypes.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Type} label={t('geo.nameFa')} htmlFor="nameFa">
          <input
            id="nameFa"
            className={fieldClassName}
            value={values.nameFa}
            onChange={(e) => set('nameFa', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Languages} label={t('geo.nameEn')} htmlFor="nameEn">
          <input
            id="nameEn"
            className={fieldClassName}
            value={values.nameEn}
            onChange={(e) => {
              set('nameEn', e.target.value)
              if (!codeTouched) {
                set('code', slugifyCode(e.target.value))
              }
            }}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Hash} label={t('placeTypes.code')} htmlFor="code">
          <input
            id="code"
            className={fieldClassName}
            value={values.code}
            onChange={(e) => {
              setCodeTouched(true)
              set('code', e.target.value)
            }}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Shapes} label={t('placeTypes.icon')} htmlFor="icon">
          <SearchSelect
            id="icon"
            value={values.icon}
            required
            onChange={(next) => set('icon', next)}
            placeholder={t('placeTypes.selectIcon')}
            options={placeTypeIconValues.map((value) => ({
              value,
              label: t(`placeTypes.icons.${value}`),
            }))}
          />
        </FormField>
        <FormField icon={Hash} label={t('geo.sortOrder')} htmlFor="sortOrder">
          <input
            id="sortOrder"
            type="number"
            min={0}
            className={fieldClassName}
            value={values.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </FormField>
        <FormField icon={ToggleRight} label={t('geo.isActive')} htmlFor="isActive">
          <ToggleField
            id="isActive"
            checked={values.isActive}
            onChange={(checked) => set('isActive', checked)}
            onLabel={t('geo.active')}
            offLabel={t('geo.inactive')}
          />
        </FormField>
        <FormActions
          submitLabel={t('placeTypes.save')}
          cancelLabel={t('placeTypes.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}

export function PlaceTypeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = getNavIcon(name)
  return <Icon className={className} aria-hidden />
}
