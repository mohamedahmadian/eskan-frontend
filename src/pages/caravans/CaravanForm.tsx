import {
  AlignLeft,
  BadgeCheck,
  Calendar,
  FileImage,
  Flag,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  Route,
  Share2,
  Tent,
  ToggleRight,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  AppForm,
  FormActions,
  FormField,
  ToggleField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard } from '../../components/ui/FormLayout'
import { FileDropField } from '../../components/ui/FileDropField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { currentPersianYear, toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Caravan, City, Country, Paginated, Province, WalkingRoute } from '../../types/app'
import { CaravanContactsPanel, firstIncompleteContactRole } from './CaravanContactsPanel'
import {
  CaravanManagerPicker,
  type CaravanManagerChoice,
} from './CaravanManagerPicker'
import {
  caravanContactRoles,
  contactDraftsFromInitial,
  isContactIncomplete,
  toContactPayloads,
  type CaravanContactDraft,
  type CaravanContactPayload,
  type CaravanContactRole,
} from './caravanContacts'
import { CaravanTabNav, caravanTabs, type CaravanTab } from './CaravanTabs'
import { CaravanYearAlert } from './CaravanYearAlert'
import { CaravanActivityYearField, CaravanYearsCard } from './CaravanYearsCard'

export type CaravanPayload = {
  name: string
  description: string | null
  officeAddress: string | null
  officePhone: string | null
  foundedYear: number | null
  cityId: string
  walkingRouteId: string | null
  licenseNumber: string | null
  licenseImageId: string | null
  managerUserId?: string | null
  year?: number
  totalCount: number
  maleCount: number
  femaleCount: number
  eitaa: string | null
  bale: string | null
  telegram: string | null
  instagram: string | null
  isActive: boolean
  contacts: CaravanContactPayload[]
}

type ManagerOption = CaravanManagerChoice

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toCount(value: string) {
  if (value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

function initialContactDrafts(initial?: Caravan) {
  return contactDraftsFromInitial(
    initial?.contacts as
      | Array<{
          role: CaravanContactRole
          user: {
            id: string
            firstName: string
            lastName: string
            nationalId: string | null
            phone: string | null
            birthDate?: string | null
          }
        }>
      | undefined,
  )
}

function toOptionalYear(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

function suggestedCaravanName(
  personName: string | null | undefined,
  format: (name: string) => string,
) {
  const trimmed = personName?.trim()
  if (!trimmed) return ''
  return format(trimmed)
}

function toManagerOption(
  user:
    | CaravanManagerChoice
    | NonNullable<Caravan['manager']>,
): ManagerOption {
  return {
    id: user.id,
    fullName: user.fullName,
    nationalId: user.nationalId,
    phone: user.phone,
    countryId: 'countryId' in user ? user.countryId : null,
    provinceId: 'provinceId' in user ? user.provinceId : null,
    cityId: 'cityId' in user ? user.cityId : null,
  }
}

export function CaravanForm({
  initial,
  initialCountryId = '',
  initialProvinceId = '',
  countries,
  provinces,
  cities,
  selectManager = true,
  currentUserId,
  defaultCountryId,
  defaultProvinceId,
  defaultCityId,
  onCountryChange,
  onProvinceChange,
  onSubmit,
}: {
  initial?: Caravan
  initialCountryId?: string
  initialProvinceId?: string
  countries: Country[]
  provinces: Province[]
  cities: City[]
  /** Admin can pick a pilgrim as manager; pilgrims/managers use current user. */
  selectManager?: boolean
  currentUserId?: string
  defaultCountryId?: string | null
  defaultProvinceId?: string | null
  defaultCityId?: string | null
  onCountryChange: (countryId: string) => void
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: CaravanPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const nameOf = useGeoName()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<CaravanTab>('basic')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nameTouched, setNameTouched] = useState(Boolean(initial?.name))
  const [name, setName] = useState(() =>
    initial?.name ??
      suggestedCaravanName(user?.fullName, (person) => t('caravans.defaultName', { name: person })),
  )
  const [description, setDescription] = useState(initial?.description ?? '')
  const [officeAddress, setOfficeAddress] = useState(initial?.officeAddress ?? '')
  const [officePhone, setOfficePhone] = useState(initial?.officePhone ?? '')
  const [foundedYear, setFoundedYear] = useState(
    initial?.foundedYear != null ? String(initial.foundedYear) : '',
  )
  const [countryId, setCountryId] = useState(
    initial?.city?.province?.countryId ?? initialCountryId,
  )
  const [provinceId, setProvinceId] = useState(
    initial?.city?.provinceId ?? initialProvinceId,
  )
  const [cityId, setCityId] = useState(initial?.cityId ?? '')
  const [walkingRouteId, setWalkingRouteId] = useState(initial?.walkingRouteId ?? '')
  const [licenseNumber, setLicenseNumber] = useState(initial?.licenseNumber ?? '')
  const [licenseImageId, setLicenseImageId] = useState(initial?.licenseImageId ?? '')
  const [managerUserId, setManagerUserId] = useState(
    initial?.managerUserId ?? (selectManager ? '' : (currentUserId ?? '')),
  )
  const [selectedManager, setSelectedManager] = useState<ManagerOption | null>(() =>
    initial?.manager ? toManagerOption(initial.manager) : null,
  )
  const [activityYear, setActivityYear] = useState(String(currentPersianYear()))
  const [maleCount, setMaleCount] = useState(String(initial?.maleCount ?? 0))
  const [femaleCount, setFemaleCount] = useState(String(initial?.femaleCount ?? 0))
  const [eitaa, setEitaa] = useState(initial?.eitaa ?? '')
  const [bale, setBale] = useState(initial?.bale ?? '')
  const [telegram, setTelegram] = useState(initial?.telegram ?? '')
  const [instagram, setInstagram] = useState(initial?.instagram ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [contactDrafts, setContactDrafts] = useState<
    Record<CaravanContactRole, CaravanContactDraft>
  >(() => initialContactDrafts(initial))
  const [activeContactRole, setActiveContactRole] = useState<CaravanContactRole>(() =>
    firstIncompleteContactRole(initialContactDrafts(initial)),
  )
  const geoTouchedRef = useRef(Boolean(initial?.cityId))

  const totalCountValue = toCount(maleCount) + toCount(femaleCount)

  const walkingRoutes = useQuery({
    queryKey: ['walking-routes', 'lookup', countryId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: {
          pageSize: 100,
          originCountryId: countryId || undefined,
        },
      })
      return data.items
    },
  })

  function applyGeoFromProfile(
    nextCountryId?: string | null,
    nextProvinceId?: string | null,
    nextCityId?: string | null,
  ) {
    if (!nextProvinceId || !nextCityId) return
    if (nextCountryId) {
      setCountryId(nextCountryId)
      onCountryChange(nextCountryId)
    }
    setProvinceId(nextProvinceId)
    setCityId(nextCityId)
    onProvinceChange(nextProvinceId)
  }

  useEffect(() => {
    if (initial?.managerUserId) {
      setManagerUserId(initial.managerUserId)
      return
    }
    if (!selectManager && currentUserId) {
      setManagerUserId(currentUserId)
    }
  }, [initial?.managerUserId, selectManager, currentUserId])

  useEffect(() => {
    if (initial || nameTouched) return
    const next = suggestedCaravanName(
      selectedManager?.fullName ?? user?.fullName,
      (person) => t('caravans.defaultName', { name: person }),
    )
    if (!next) return
    setName(next)
    const input = nameInputRef.current
    if (input && document.activeElement === input) {
      requestAnimationFrame(() => {
        if (document.activeElement === input) input.select()
      })
    }
  }, [initial, nameTouched, selectedManager?.fullName, user?.fullName, t])

  useEffect(() => {
    if (initial || geoTouchedRef.current) return
    if (!selectManager && defaultProvinceId && defaultCityId) {
      applyGeoFromProfile(defaultCountryId, defaultProvinceId, defaultCityId)
      geoTouchedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once from profile defaults
  }, [initial, selectManager, defaultCountryId, defaultProvinceId, defaultCityId])

  const tabs = useMemo(
    () =>
      (selectManager || initial?.id
        ? caravanTabs
        : caravanTabs.filter((item) => item !== 'years')) as CaravanTab[],
    [selectManager, initial?.id],
  )
  const editYears = Boolean(selectManager && initial?.id)

  function panelClass(id: CaravanTab) {
    return `space-y-4 ${tab === id ? '' : 'hidden'}`
  }

  async function uploadLicense(file: File) {
    const body = new FormData()
    body.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post<{ id: string }>('/images', body)
      setLicenseImageId(data.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const resolvedManagerId = selectManager ? managerUserId : (currentUserId ?? managerUserId)

    for (const role of caravanContactRoles) {
      if (isContactIncomplete(contactDrafts[role])) {
        toast.error(
          t('caravans.contactIncomplete', {
            role: t(`caravans.contactRoles.${role}`),
          }),
        )
        setTab('contacts')
        setActiveContactRole(role)
        return
      }
    }

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: emptyToNull(description),
        officeAddress: emptyToNull(officeAddress),
        officePhone: emptyToNull(officePhone),
        foundedYear: toOptionalYear(foundedYear),
        cityId,
        walkingRouteId: emptyToNull(walkingRouteId),
        licenseNumber: emptyToNull(licenseNumber),
        licenseImageId: emptyToNull(licenseImageId),
        totalCount: totalCountValue,
        maleCount: toCount(maleCount),
        femaleCount: toCount(femaleCount),
        eitaa: emptyToNull(eitaa),
        bale: emptyToNull(bale),
        telegram: emptyToNull(telegram),
        instagram: emptyToNull(instagram),
        isActive,
        contacts: toContactPayloads(contactDrafts),
        ...(!initial
          ? {
              managerUserId: resolvedManagerId || null,
              year: Number(toLatinDigits(activityYear)) || currentPersianYear(),
            }
          : {}),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {initial ? <CaravanYearAlert caravan={initial} /> : null}
    <FormCard
      icon={Tent}
      title={initial ? initial.name || t('caravans.edit') : t('caravans.create')}
      subtitle={initial ? undefined : t('caravans.createSubtitle')}
    >
    <div className="space-y-4 p-5 sm:p-6">
      <CaravanTabNav tab={tab} tabs={tabs} onChange={setTab} />
      {tab === 'years' && initial ? (
        <CaravanYearsCard caravan={initial} canAssign={editYears} />
      ) : (
      <AppForm
        onSubmit={submit}
        onInvalid={(event) => {
          const panel = (event.target as HTMLElement | null)?.closest('[data-tab]')
          const next = panel?.getAttribute('data-tab') as CaravanTab | null
          if (next) setTab(next)
        }}
        className="space-y-4"
      >
        <div data-tab="basic" className={panelClass('basic')}>
          <FormField icon={Tent} label={t('caravans.name')} htmlFor="name">
            <input
              id="name"
              ref={nameInputRef}
              className={fieldClassName}
              value={name}
              onChange={(e) => {
                setNameTouched(true)
                setName(e.target.value)
              }}
              onFocus={(e) => {
                if (!initial && !nameTouched) e.currentTarget.select()
              }}
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField icon={Flag} label={t('geo.country')} htmlFor="countryId">
              <SearchSelect
                id="countryId"
                value={countryId}
                required
                onChange={(next) => {
                  setCountryId(next)
                  setProvinceId('')
                  setCityId('')
                  setWalkingRouteId('')
                  geoTouchedRef.current = true
                  onCountryChange(next)
                  onProvinceChange('')
                }}
                placeholder={t('geo.selectCountry')}
                options={[
                  { value: '', label: t('geo.selectCountry') },
                  ...countries.map((country) => ({
                    value: country.id,
                    label: nameOf(country),
                  })),
                ]}
              />
            </FormField>

            <FormField icon={MapPinned} label={t('geo.province')} htmlFor="provinceId">
              <SearchSelect
                id="provinceId"
                value={provinceId}
                required
                disabled={!countryId}
                onChange={(next) => {
                  setProvinceId(next)
                  setCityId('')
                  geoTouchedRef.current = true
                  onProvinceChange(next)
                }}
                placeholder={t('geo.selectProvince')}
                options={[
                  { value: '', label: t('geo.selectProvince') },
                  ...provinces.map((province) => ({
                    value: province.id,
                    label: nameOf(province),
                  })),
                ]}
              />
            </FormField>

            <FormField icon={MapPin} label={t('caravans.city')} htmlFor="cityId">
              <SearchSelect
                id="cityId"
                value={cityId}
                required
                disabled={!provinceId}
                onChange={(next) => {
                  setCityId(next)
                  geoTouchedRef.current = true
                }}
                placeholder={t('geo.selectCity')}
                options={[
                  { value: '', label: t('geo.selectCity') },
                  ...cities.map((city) => ({
                    value: city.id,
                    label: nameOf(city),
                  })),
                ]}
              />
            </FormField>
          </div>

          <FormField icon={Route} label={t('caravans.walkingRoute')} htmlFor="walkingRouteId">
            <SearchSelect
              id="walkingRouteId"
              value={walkingRouteId}
              onChange={setWalkingRouteId}
              placeholder={t('caravans.walkingRoute')}
              options={[
                { value: '', label: t('caravans.walkingRouteNone') },
                ...(walkingRoutes.data ?? []).map((route) => ({
                  value: route.id,
                  label: route.name,
                })),
                ...(walkingRouteId &&
                initial?.walkingRoute &&
                initial.walkingRoute.id === walkingRouteId &&
                !(walkingRoutes.data ?? []).some((route) => route.id === walkingRouteId)
                  ? [
                      {
                        value: initial.walkingRoute.id,
                        label: initial.walkingRoute.name,
                      },
                    ]
                  : []),
              ]}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField icon={UserRound} label={t('caravans.maleCount')} htmlFor="maleCount">
              <input
                id="maleCount"
                type="number"
                min={0}
                className={fieldClassName}
                value={maleCount}
                onChange={(e) => setMaleCount(e.target.value)}
              />
            </FormField>
            <FormField icon={UserPlus} label={t('caravans.femaleCount')} htmlFor="femaleCount">
              <input
                id="femaleCount"
                type="number"
                min={0}
                className={fieldClassName}
                value={femaleCount}
                onChange={(e) => setFemaleCount(e.target.value)}
              />
            </FormField>
            <FormField icon={Users} label={t('caravans.totalCount')} htmlFor="totalCount">
              <input
                id="totalCount"
                type="number"
                className={`${fieldClassName} bg-cream-50 text-ink-700`}
                value={totalCountValue}
                readOnly
                tabIndex={-1}
              />
            </FormField>
          </div>

          {initial && selectManager ? (
            <FormField icon={ToggleRight} label={t('caravans.status')} htmlFor="isActive">
              <ToggleField
                id="isActive"
                checked={isActive}
                onChange={setIsActive}
                onLabel={t('geo.active')}
                offLabel={t('geo.inactive')}
              />
            </FormField>
          ) : null}
        </div>

        <div data-tab="extra" className={panelClass('extra')}>
          <FormField icon={MapPin} label={t('caravans.officeAddress')} htmlFor="officeAddress">
            <textarea
              id="officeAddress"
              className={`${fieldClassName} min-h-24`}
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
            />
          </FormField>
          <FormField icon={Phone} label={t('caravans.officePhone')} htmlFor="officePhone">
            <input
              id="officePhone"
              className={fieldClassName}
              value={officePhone}
              onChange={(e) => setOfficePhone(e.target.value)}
              dir="ltr"
            />
          </FormField>
          <FormField icon={Calendar} label={t('caravans.foundedYear')} htmlFor="foundedYear">
            <input
              id="foundedYear"
              type="number"
              min={1300}
              className={fieldClassName}
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
            />
          </FormField>
          <FormField icon={AlignLeft} label={t('caravans.description')} htmlFor="description">
            <textarea
              id="description"
              className={`${fieldClassName} min-h-24`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </div>

        <div data-tab="contacts" className={panelClass('contacts')}>
          <CaravanContactsPanel
            drafts={contactDrafts}
            activeRole={activeContactRole}
            onActiveRoleChange={setActiveContactRole}
            onDraftChange={(role, next) =>
              setContactDrafts((current) => ({ ...current, [role]: next }))
            }
          />
        </div>

        <div data-tab="license" className={panelClass('license')}>
          <FormField icon={BadgeCheck} label={t('caravans.licenseNumber')} htmlFor="licenseNumber">
            <input
              id="licenseNumber"
              className={fieldClassName}
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </FormField>

          <FormField icon={FileImage} label={t('caravans.licenseImage')} htmlFor="licenseImage">
            <FileDropField
              id="licenseImage"
              accept="image/*"
              capture="environment"
              previewUrl={licenseImageId ? getImageUrl(licenseImageId) : undefined}
              uploading={uploading}
              onFile={(file) => void uploadLicense(file)}
              onClear={() => setLicenseImageId('')}
            />
          </FormField>
        </div>

        <div data-tab="social" className={panelClass('social')}>
          <FormField icon={Share2} label={t('caravans.eitaa')} htmlFor="eitaa">
            <input
              id="eitaa"
              className={fieldClassName}
              value={eitaa}
              onChange={(e) => setEitaa(e.target.value)}
              dir="ltr"
            />
          </FormField>
          <FormField icon={MessageCircle} label={t('caravans.bale')} htmlFor="bale">
            <input
              id="bale"
              className={fieldClassName}
              value={bale}
              onChange={(e) => setBale(e.target.value)}
              dir="ltr"
            />
          </FormField>
          <FormField icon={MessageCircle} label={t('caravans.telegram')} htmlFor="telegram">
            <input
              id="telegram"
              className={fieldClassName}
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              dir="ltr"
            />
          </FormField>
          <FormField icon={Share2} label={t('caravans.instagram')} htmlFor="instagram">
            <input
              id="instagram"
              className={fieldClassName}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              dir="ltr"
            />
          </FormField>
        </div>

        {selectManager && !initial ? (
          <div data-tab="years" className={panelClass('years')}>
            <p className="text-sm leading-6 text-ink-600">{t('caravans.activityYearsHint')}</p>
            <CaravanActivityYearField
              year={activityYear}
              onYearChange={setActivityYear}
              inputId="create-caravan-activity-year"
            />
            <CaravanManagerPicker
              value={selectedManager}
              onChange={(next) => {
                setSelectedManager(next)
                setManagerUserId(next?.id ?? '')
                if (next?.provinceId && next?.cityId) {
                  applyGeoFromProfile(next.countryId, next.provinceId, next.cityId)
                  geoTouchedRef.current = true
                }
              }}
              emptyLabel={t('caravans.withoutManager')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField icon={UserRound} label={t('caravans.maleCount')} htmlFor="create-year-maleCount">
                <input
                  id="create-year-maleCount"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  value={maleCount}
                  onChange={(e) => setMaleCount(e.target.value)}
                />
              </FormField>
              <FormField icon={UserPlus} label={t('caravans.femaleCount')} htmlFor="create-year-femaleCount">
                <input
                  id="create-year-femaleCount"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  value={femaleCount}
                  onChange={(e) => setFemaleCount(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        ) : null}

        <div>
          <FormActions
            submitLabel={t('caravans.save')}
            cancelLabel={t('caravans.cancel')}
            submitting={saving || uploading}
            onCancel={() => history.back()}
          />
        </div>
      </AppForm>
      )}
    </div>
    </FormCard>
    </div>
  )
}
