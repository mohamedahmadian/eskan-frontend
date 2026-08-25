import {
  AlignLeft,
  Building2,
  CalendarDays,
  FileBadge2,
  FileImage,
  IdCard,
  MapPin,
  Phone,
  Search,
  Tent,
  UserRound,
} from 'lucide-react'
import { DateObject } from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormMetaChip,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { FileDropField } from '../../components/ui/FileDropField'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { localizeDigits, toIsoDateOnly } from '../../lib/datetime'
import { optimizeImageFile } from '../../lib/optimize-image'
import { useGeoName } from '../../lib/geo'
import { isValidIranianNationalId, normalizeNationalId } from '../../lib/national-id'
import type { CaravanManagerLookup, IssuedLicenseCaravan } from '../../types/app'

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function todayIso() {
  return toIsoDateOnly(new DateObject({ calendar: gregorian }))
}

export function IssueLicensePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const nameOf = useGeoName()
  const [nationalId, setNationalId] = useState('')
  const [lookup, setLookup] = useState<CaravanManagerLookup | null>(null)
  const [looking, setLooking] = useState(false)
  const [caravanId, setCaravanId] = useState('')
  const [description, setDescription] = useState('')
  const [issuedAt, setIssuedAt] = useState(todayIso())
  const [fileId, setFileId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedCaravan = lookup?.caravans.find((item) => item.id === caravanId) ?? null
  const empty = '—'

  async function onLookup(event: FormEvent) {
    event.preventDefault()
    const id = normalizeNationalId(nationalId)
    if (!isValidIranianNationalId(id)) {
      toast.error(t('licenses.nationalIdInvalid'))
      return
    }
    setLooking(true)
    setLookup(null)
    setCaravanId('')
    try {
      const { data } = await api.get<CaravanManagerLookup>('/issued-licenses/lookup', {
        params: { nationalId: id },
      })
      setLookup(data)
      if (data.caravans.length === 1) {
        setCaravanId(data.caravans[0].id)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('licenses.managerNotFound')))
    } finally {
      setLooking(false)
    }
  }

  async function onUpload(file: File) {
    setUploading(true)
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>('/images', body)
      setFileId(data.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
    }
  }

  async function onIssue(event: FormEvent) {
    event.preventDefault()
    if (!lookup || !caravanId) return
    if (!issuedAt) {
      toast.error(t('licenses.issuedAtRequired'))
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post<{ id: string }>('/issued-licenses', {
        managerUserId: lookup.manager.id,
        caravanId,
        issuedAt,
        description: emptyToNull(description),
        fileId: emptyToNull(fileId),
      })
      toast.success(t('licenses.issued'))
      navigate(`/licenses/issued/${data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${formShellClassName} space-y-4`}>
      <PageHeader title={t('menus.issueLicense')} subtitle={t('licenses.issueSubtitle')} />

      <FormCard icon={Search} title={t('licenses.lookup')} subtitle={t('licenses.issueSubtitle')}>
        <AppForm onSubmit={onLookup} className={formCardBodyClassName}>
          <FormField icon={IdCard} label={t('users.nationalId')} htmlFor="license-nationalId">
            <input
              id="license-nationalId"
              className={fieldClassName}
              value={nationalId}
              onChange={(e) => {
                setNationalId(e.target.value)
                setLookup(null)
                setCaravanId('')
              }}
              required
              inputMode="numeric"
            />
          </FormField>
          <FormActions
            submitLabel={t('licenses.lookup')}
            submitting={looking}
            onCancel={() => history.back()}
            cancelLabel={t('common.cancel')}
          />
        </AppForm>
      </FormCard>

      {lookup ? (
        <>
          <FormCard
            icon={UserRound}
            title={t('licenses.managerInfo')}
            subtitle={lookup.manager.fullName}
            chips={
              <>
                {lookup.manager.nationalId ? (
                  <FormMetaChip icon={IdCard} copyValue={lookup.manager.nationalId} />
                ) : null}
                {lookup.manager.phone ? (
                  <FormMetaChip icon={Phone} copyValue={lookup.manager.phone} />
                ) : null}
                {lookup.manager.city ? (
                  <FormMetaChip icon={MapPin} label={nameOf(lookup.manager.city)} />
                ) : null}
              </>
            }
          >
            <div className="grid gap-2 p-5 sm:grid-cols-2 sm:gap-3 sm:p-6">
              <FormFactTile
                icon={UserRound}
                label={t('users.fullName')}
                value={lookup.manager.fullName}
                tone="teal"
              />
              <FormFactTile
                icon={IdCard}
                label={t('users.nationalId')}
                copyValue={lookup.manager.nationalId}
                tone="mint"
              />
              <FormFactTile
                icon={Phone}
                label={t('users.phone')}
                copyValue={lookup.manager.phone}
                tone="ink"
              />
              <FormFactTile
                icon={MapPin}
                label={t('geo.city')}
                value={lookup.manager.city ? nameOf(lookup.manager.city) : empty}
                empty={!lookup.manager.city}
                tone="teal"
              />
            </div>
          </FormCard>

          <FormCard
            icon={FileBadge2}
            title={t('menus.issueLicense')}
            subtitle={t('licenses.caravanInfo')}
          >
            <AppForm onSubmit={onIssue} className="space-y-5 p-5 sm:p-6">
              {lookup.caravans.length ? (
                <>
                  <FormField icon={Tent} label={t('licenses.caravan')} htmlFor="license-caravan">
                    <SearchSelect
                      id="license-caravan"
                      value={caravanId}
                      required
                      onChange={setCaravanId}
                      placeholder={t('licenses.selectCaravan')}
                      options={[
                        { value: '', label: t('licenses.selectCaravan') },
                        ...lookup.caravans.map((caravan) => ({
                          value: caravan.id,
                          label: caravan.name,
                        })),
                      ]}
                    />
                  </FormField>

                  {selectedCaravan ? <CaravanSummary caravan={selectedCaravan} /> : null}

                  <div className="space-y-4">
                    <FormSectionTitle icon={FileBadge2}>
                      {t('licenses.licenseInfo')}
                    </FormSectionTitle>
                    <FormField
                      icon={AlignLeft}
                      label={t('licenses.description')}
                      htmlFor="license-notes"
                    >
                      <textarea
                        id="license-notes"
                        className={fieldClassName}
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </FormField>
                    <FormField
                      icon={CalendarDays}
                      label={t('licenses.issuedAt')}
                      htmlFor="license-issuedAt"
                    >
                      <PersianDateField
                        id="license-issuedAt"
                        value={issuedAt}
                        onChange={(next) => setIssuedAt(next ?? '')}
                      />
                    </FormField>
                    <FormField icon={FileImage} label={t('licenses.file')} htmlFor="license-file">
                      <FileDropField
                        id="license-file"
                        accept="image/jpeg,image/png,image/webp,image/*"
                        maxBytes={8 * 1024 * 1024}
                        uploading={uploading}
                        previewUrl={fileId ? getImageUrl(fileId) : undefined}
                        onFile={onUpload}
                        onClear={() => setFileId('')}
                      />
                    </FormField>
                  </div>

                  <FormActions
                    submitLabel={t('licenses.issue')}
                    submitting={saving}
                    onCancel={() => navigate('/licenses/issued')}
                    cancelLabel={t('common.cancel')}
                  />
                </>
              ) : (
                <FormEmptyHint>{t('licenses.noCaravans')}</FormEmptyHint>
              )}
            </AppForm>
          </FormCard>
        </>
      ) : null}
    </div>
  )
}

function CaravanSummary({ caravan }: { caravan: IssuedLicenseCaravan }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const empty = '—'
  const cityLabel = `${nameOf(caravan.city)}${
    caravan.city.province ? ` — ${nameOf(caravan.city.province)}` : ''
  }`

  return (
    <div>
      <FormSectionTitle icon={Building2}>{t('licenses.caravanInfo')}</FormSectionTitle>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        <FormFactTile icon={Tent} label={t('caravans.name')} value={caravan.name} tone="teal" />
        <FormFactTile icon={MapPin} label={t('geo.city')} value={cityLabel} tone="mint" />
        <FormFactTile
          icon={Phone}
          label={t('caravans.officePhone')}
          value={
            caravan.officePhone ? localizeDigits(caravan.officePhone, locale) : empty
          }
          empty={!caravan.officePhone}
          tone="ink"
        />
        <FormFactTile
          icon={IdCard}
          label={t('caravans.licenseNumber')}
          value={
            caravan.licenseNumber ? localizeDigits(caravan.licenseNumber, locale) : empty
          }
          empty={!caravan.licenseNumber}
          tone="teal"
        />
        <FormFactTile
          icon={MapPin}
          label={t('caravans.officeAddress')}
          value={caravan.officeAddress || empty}
          empty={!caravan.officeAddress}
          tone="mint"
          className="sm:col-span-2"
        />
        <FormFactTile
          icon={Building2}
          label={t('users.status')}
          value={caravan.isActive ? t('geo.active') : t('geo.inactive')}
          tone={caravan.isActive ? 'teal' : 'ink'}
        />
      </div>
    </div>
  )
}
