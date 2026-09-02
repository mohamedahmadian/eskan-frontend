import {
  AlignLeft,
  Calendar,
  Globe,
  ImagePlus,
  Landmark,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Share2,
  Type,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { currentPersianYear } from '../../lib/datetime'
import { optimizeImageFile } from '../../lib/optimize-image'
import type { HeadquartersInfo } from '../../types/app'

const MASHHAD_FOCUS = { lat: 36.287, lng: 59.6158, zoom: 13 }

export type HeadquartersInfoPayload = {
  name: string
  title: string | null
  address: string | null
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  activityStartYear: number
  website: string | null
  eitaa: string | null
  bale: string | null
  telegram: string | null
  instagram: string | null
  logoId: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toCoordString(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? '' : String(value)
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function HeadquartersInfoForm({
  initial,
  onSubmit,
}: {
  initial?: HeadquartersInfo
  onSubmit: (payload: HeadquartersInfoPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoId, setLogoId] = useState(initial?.logoId ?? '')
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    title: initial?.title ?? '',
    address: initial?.address ?? '',
    neshanAddress: initial?.neshanAddress ?? '',
    latitude: toCoordString(initial?.latitude),
    longitude: toCoordString(initial?.longitude),
    description: initial?.description ?? '',
    activityStartYear:
      initial?.activityStartYear != null ? String(initial.activityStartYear) : '',
    website: initial?.website ?? '',
    eitaa: initial?.eitaa ?? '',
    bale: initial?.bale ?? '',
    telegram: initial?.telegram ?? '',
    instagram: initial?.instagram ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>('/images', body)
      setLogoId(data.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        title: emptyToNull(values.title),
        address: emptyToNull(values.address),
        neshanAddress: emptyToNull(values.neshanAddress),
        latitude: toOptionalNumber(values.latitude),
        longitude: toOptionalNumber(values.longitude),
        description: emptyToNull(values.description),
        activityStartYear: Number(values.activityStartYear),
        website: emptyToNull(values.website),
        eitaa: emptyToNull(values.eitaa),
        bale: emptyToNull(values.bale),
        telegram: emptyToNull(values.telegram),
        instagram: emptyToNull(values.instagram),
        logoId: emptyToNull(logoId),
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
      title={initial ? initial.name || t('headquartersInfo.edit') : t('headquartersInfo.create')}
      subtitle={initial ? undefined : t('headquartersInfo.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={Landmark} label={t('headquartersInfo.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Type} label={t('headquartersInfo.titleLabel')} htmlFor="title">
          <input
            id="title"
            className={fieldClassName}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </FormField>
        <FormField
          icon={Calendar}
          label={t('headquartersInfo.activityStartYear')}
          htmlFor="activityStartYear"
        >
          <input
            id="activityStartYear"
            type="number"
            min={1300}
            max={currentPersianYear()}
            className={fieldClassName}
            value={values.activityStartYear}
            onChange={(e) => set('activityStartYear', e.target.value)}
            required
          />
        </FormField>
        <FormField icon={MapPin} label={t('headquartersInfo.address')} htmlFor="address">
          <textarea
            id="address"
            className={fieldClassName}
            rows={3}
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </FormField>
        <FormField
          icon={Navigation}
          label={t('headquartersInfo.neshanAddress')}
          htmlFor="neshanAddress"
        >
          <input
            id="neshanAddress"
            className={fieldClassName}
            dir="ltr"
            value={values.neshanAddress}
            onChange={(e) => set('neshanAddress', e.target.value)}
          />
        </FormField>
        <FormField icon={MapPinned} label={t('headquartersInfo.location')}>
          <OsmMapPicker
            latitude={values.latitude}
            longitude={values.longitude}
            variant="always"
            showGeolocate
            focus={
              values.latitude && values.longitude
                ? undefined
                : MASHHAD_FOCUS
            }
            onChange={(latitude, longitude) => {
              set('latitude', latitude)
              set('longitude', longitude)
            }}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('headquartersInfo.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormField icon={Globe} label={t('headquartersInfo.website')} htmlFor="website">
          <input
            id="website"
            className={fieldClassName}
            dir="ltr"
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </FormField>
        <FormField icon={Share2} label={t('headquartersInfo.eitaa')} htmlFor="eitaa">
          <input
            id="eitaa"
            className={fieldClassName}
            dir="ltr"
            value={values.eitaa}
            onChange={(e) => set('eitaa', e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('headquartersInfo.bale')} htmlFor="bale">
          <input
            id="bale"
            className={fieldClassName}
            dir="ltr"
            value={values.bale}
            onChange={(e) => set('bale', e.target.value)}
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('headquartersInfo.telegram')} htmlFor="telegram">
          <input
            id="telegram"
            className={fieldClassName}
            dir="ltr"
            value={values.telegram}
            onChange={(e) => set('telegram', e.target.value)}
          />
        </FormField>
        <FormField icon={Share2} label={t('headquartersInfo.instagram')} htmlFor="instagram">
          <input
            id="instagram"
            className={fieldClassName}
            dir="ltr"
            value={values.instagram}
            onChange={(e) => set('instagram', e.target.value)}
          />
        </FormField>
        <FormField icon={ImagePlus} label={t('headquartersInfo.logo')} htmlFor="logo">
          <FileDropField
            id="logo"
            accept="image/*"
            capture="environment"
            previewUrl={logoId ? getImageUrl(logoId) : undefined}
            uploading={uploading}
            onFile={(file) => void uploadLogo(file)}
            onClear={() => setLogoId('')}
          />
        </FormField>
        <FormActions
          submitLabel={t('headquartersInfo.save')}
          cancelLabel={t('headquartersInfo.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
