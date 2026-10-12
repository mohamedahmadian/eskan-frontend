import {
  AlignLeft,
  ArrowUpDown,
  BadgeCheck,
  Bath,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplets,
  Eye,
  Flag,
  Flame,
  Landmark,
  LayoutGrid,
  LogIn,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  School,
  Shirt,
  Snowflake,
  Sparkles,
  User,
  UserCheck,
  UserRound,
  Users,
  Wifi,
  X,
  BookOpen,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  AppForm,
  Button,
  FormField,
  LoadingState,
  PageHeader,
  ToggleField,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormFactTile,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import {
  accommodationTypes,
  genderTypes,
  managementTypes,
  type Accommodation,
  type AccommodationType,
  type City,
  type Country,
  type GenderType,
  type ManagementType,
  type Province,
  type SchoolDistrict,
} from '../../types/app'

type Step = 1 | 2 | 3 | 4 | 5 | 6
type IntroduceVariant = 'panel' | 'public'

type IntroducedAccommodation = {
  id: string
  name: string
  cityName: string
  address: string
  maleCapacity: number
  femaleCapacity: number
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toNumber(value: string, fallback = 0) {
  if (value.trim() === '') return fallback
  const parsed = Number(toLatinDigits(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(toLatinDigits(value))
  return Number.isFinite(parsed) ? parsed : null
}

function coordinatesParts(value: string) {
  const latin = toLatinDigits(value).trim()
  if (!latin) return { latitude: '', longitude: '' }
  const parts = latin.split(/[,،]/).map((part) => part.trim())
  return {
    latitude: parts[0] ?? '',
    longitude: parts[1] ?? '',
  }
}

function parseCoordinates(value: string): { latitude: number | null; longitude: number | null } | 'invalid' {
  const trimmed = toLatinDigits(value).trim()
  if (!trimmed) return { latitude: null, longitude: null }
  const parts = trimmed.split(/[,،]/).map((part) => part.trim()).filter((part) => part.length > 0)
  if (parts.length !== 2) return 'invalid'
  const latitude = Number(parts[0])
  const longitude = Number(parts[1])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'invalid'
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return 'invalid'
  return { latitude, longitude }
}

export function AccommodationIntroduceWizardPage({
  variant = 'panel',
}: {
  variant?: IntroduceVariant
}) {
  const isPublic = variant === 'public'
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const nameOf = useGeoName()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [introducerFirstName, setIntroducerFirstName] = useState('')
  const [introducerLastName, setIntroducerLastName] = useState('')
  const [introducerPhone, setIntroducerPhone] = useState('')
  const [loginWithPhone, setLoginWithPhone] = useState(false)
  const [name, setName] = useState('')
  const identityStep = 1
  const generalStep = (isPublic ? 2 : 1) as Step
  const locationStep = (isPublic ? 3 : 2) as Step
  const capacityStep = (isPublic ? 4 : 3) as Step
  const amenitiesStep = (isPublic ? 5 : 4) as Step
  const doneStep = (isPublic ? 6 : 5) as Step
  const [type, setType] = useState<AccommodationType>(accommodationTypes.HOUSE)
  const [genderType, setGenderType] = useState<GenderType>(genderTypes.MIXED)
  const [managementType, setManagementType] = useState<ManagementType>(
    managementTypes.SELF_SUFFICIENT,
  )
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [isPrimary, setIsPrimary] = useState(true)
  const [countryId, setCountryId] = useState(user?.countryId ?? '')
  const [provinceId, setProvinceId] = useState(user?.provinceId ?? '')
  const [cityId, setCityId] = useState('')
  const [address, setAddress] = useState('')
  const [neshanAddress, setNeshanAddress] = useState('')
  const [coordinates, setCoordinates] = useState('')
  const [maleCapacity, setMaleCapacity] = useState('0')
  const [femaleCapacity, setFemaleCapacity] = useState('0')
  const [hasLaundry, setHasLaundry] = useState(false)
  const [hasInternet, setHasInternet] = useState(false)
  const [hasPrayerRoom, setHasPrayerRoom] = useState(false)
  const [hasElevator, setHasElevator] = useState(false)
  const [heatingSystem, setHeatingSystem] = useState('')
  const [coolingSystem, setCoolingSystem] = useState('')
  const [parkingCapacity, setParkingCapacity] = useState('')
  const [bathroomCount, setBathroomCount] = useState('')
  const [toiletCount, setToiletCount] = useState('')
  const [classroomCount, setClassroomCount] = useState('')
  const [schoolDistrictId, setSchoolDistrictId] = useState('')
  const isSchool = type === accommodationTypes.SCHOOL
  const [done, setDone] = useState<IntroducedAccommodation | null>(null)

  const schoolDistricts = useQuery({
    queryKey: ['school-districts', 'lookup'],
    enabled: isSchool,
    queryFn: async () => {
      const { data } = await api.get<SchoolDistrict[]>('/school-districts')
      return data
    },
  })

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  const iranId = countries.data?.find((country) => country.iso2 === 'IR')?.id ?? ''
  const selectedCountryId = countryId || user?.countryId || iranId

  useEffect(() => {
    if (countryId || !selectedCountryId) return
    setCountryId(selectedCountryId)
  }, [countryId, selectedCountryId])

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', selectedCountryId],
    enabled: Boolean(selectedCountryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: selectedCountryId, activeOnly: true },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })

  const maleDisabled = genderType === genderTypes.FEMALE
  const femaleDisabled = genderType === genderTypes.MALE
  const capacityFieldClassName = `${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`
  const mapCoordinates = useMemo(() => coordinatesParts(coordinates), [coordinates])

  function applyGender(next: GenderType) {
    setGenderType(next)
    if (next === genderTypes.MALE) setFemaleCapacity('0')
    if (next === genderTypes.FEMALE) setMaleCapacity('0')
  }

  function goNext(event: FormEvent, next: Step) {
    event.preventDefault()
    if (isPublic && step === identityStep) {
      const phoneDigits = toLatinDigits(introducerPhone).replace(/\D/g, '')
      if (
        introducerFirstName.trim().length < 2 ||
        introducerLastName.trim().length < 2
      ) {
        toast.error(t('users.nameRequired'))
        return
      }
      if (!/^09\d{9}$/.test(phoneDigits)) {
        toast.error(t('accommodationIntroduce.phoneInvalid'))
        return
      }
    }
    if (step === locationStep) {
      if (parseCoordinates(coordinates) === 'invalid') {
        toast.error(t('accommodations.coordinatesInvalid'))
        return
      }
      if (!cityId) {
        toast.error(t('accommodationIntroduce.cityRequired'))
        return
      }
    }
    setStep(next)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = parseCoordinates(coordinates)
    if (parsed === 'invalid' || !cityId || name.trim().length < 2) {
      toast.error(t('accommodationIntroduce.stepIncomplete'))
      setStep(parsed === 'invalid' || !cityId ? locationStep : generalStep)
      return
    }

    const male = maleDisabled ? 0 : toNumber(maleCapacity)
    const female = femaleDisabled ? 0 : toNumber(femaleCapacity)
    const payload = {
      name: name.trim(),
      type,
      genderType,
      managementType,
      maleCapacity: male,
      femaleCapacity: female,
      phone: emptyToNull(phone),
      address: emptyToNull(address),
      neshanAddress: emptyToNull(neshanAddress),
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      description: emptyToNull(description),
      countryId: emptyToNull(selectedCountryId),
      provinceId: emptyToNull(provinceId),
      cityId,
      hasLaundry,
      hasInternet,
      hasPrayerRoom,
      hasElevator,
      heatingSystem: emptyToNull(heatingSystem),
      coolingSystem: emptyToNull(coolingSystem),
      parkingCapacity: toOptionalNumber(parkingCapacity),
      bathroomCount: toOptionalNumber(bathroomCount),
      toiletCount: toOptionalNumber(toiletCount),
      classroomCount: isSchool ? toOptionalNumber(classroomCount) : null,
      schoolDistrictId: isSchool ? emptyToNull(schoolDistrictId) : null,
      isPrimary,
    }
    setSaving(true)
    try {
      const data = await (async () => {
        if (isPublic) {
          const response = await api.post<Accommodation & { loginWithPhone?: boolean }>(
            '/public/accommodations/introduce',
            {
              ...payload,
              introducerFirstName: introducerFirstName.trim(),
              introducerLastName: introducerLastName.trim(),
              introducerPhone: toLatinDigits(introducerPhone).replace(/\D/g, ''),
            },
          )
          setLoginWithPhone(Boolean(response.data.loginWithPhone))
          return response.data
        }
        const response = await api.post<Accommodation>('/accommodations/introduce', payload)
        try {
          await refresh()
        } catch {
          /* success page still opens if profile refresh fails */
        }
        return response.data
      })()
      const city = (cities.data ?? []).find((item) => item.id === cityId)
      setDone({
        id: data.id,
        name: data.name,
        cityName: data.city ? nameOf(data.city) : city ? nameOf(city) : '',
        address: data.address?.trim() || address.trim(),
        maleCapacity: data.maleCapacity,
        femaleCapacity: data.femaleCapacity,
      })
      setStep(doneStep)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (!countries.data || (!isPublic && !user)) {
    return <LoadingState />
  }

  const introducedCapacity = done
    ? [
        done.maleCapacity > 0
          ? t('accommodationIntroduce.capacityMen', {
              count: formatNumber(done.maleCapacity, locale),
            })
          : '',
        done.femaleCapacity > 0
          ? t('accommodationIntroduce.capacityWomen', {
              count: formatNumber(done.femaleCapacity, locale),
            })
          : '',
      ]
        .filter(Boolean)
        .join(t('accommodationIntroduce.capacityJoin'))
    : ''

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Building2}
        title={t('accommodationIntroduce.title')}
        subtitle={t('accommodationIntroduce.subtitle')}
        backTo={isPublic ? '/' : false}
      />
      <IntroduceSteps step={step} variant={variant} doneStep={doneStep} />

      {isPublic && step === identityStep ? (
        <FormCard
          icon={UserRound}
          title={t('accommodationIntroduce.stepIdentity')}
          subtitle={t('accommodationIntroduce.identityHint')}
        >
          <AppForm onSubmit={(event) => goNext(event, generalStep)} className={formCardBodyClassName}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={User}
                label={t('users.firstName')}
                htmlFor="introduce-first-name"
              >
                <input
                  id="introduce-first-name"
                  className={fieldClassName}
                  value={introducerFirstName}
                  onChange={(e) => setIntroducerFirstName(e.target.value)}
                  required
                  minLength={2}
                />
              </FormField>
              <FormField
                icon={UserRound}
                label={t('users.lastName')}
                htmlFor="introduce-last-name"
              >
                <input
                  id="introduce-last-name"
                  className={fieldClassName}
                  value={introducerLastName}
                  onChange={(e) => setIntroducerLastName(e.target.value)}
                  required
                  minLength={2}
                />
              </FormField>
            </div>
            <FormField
              icon={Phone}
              label={t('users.phone')}
              htmlFor="introduce-owner-phone"
            >
              <input
                id="introduce-owner-phone"
                className={`${fieldClassName} digit-field`}
                inputMode="tel"
                value={introducerPhone}
                onChange={(e) => setIntroducerPhone(toLatinDigits(e.target.value))}
                required
                minLength={10}
              />
            </FormField>
            <WizardStepActions
              submitLabel={t('accommodationIntroduce.next')}
              backLabel={t('accommodations.cancel')}
              onBack={() => navigate('/')}
              submitIcon="next"
              backIcon="cancel"
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === generalStep ? (
        <FormCard
          icon={Building2}
          title={t('accommodations.tabs.general')}
          subtitle={t('accommodationIntroduce.generalHint')}
        >
          <AppForm onSubmit={(event) => goNext(event, locationStep)} className={formCardBodyClassName}>
            <FormField icon={Building2} label={t('accommodations.name')} htmlFor="introduce-name">
              <input
                id="introduce-name"
                className={fieldClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField icon={Landmark} label={t('accommodations.type')} htmlFor="introduce-type">
                <SearchSelect
                  id="introduce-type"
                  value={type}
                  onChange={(next) => setType(next as AccommodationType)}
                  options={Object.values(accommodationTypes).map((item) => ({
                    value: item,
                    label: t(`accommodationTypes.${item}`),
                  }))}
                />
              </FormField>
              <FormField icon={Users} label={t('accommodations.genderType')} htmlFor="introduce-gender">
                <SearchSelect
                  id="introduce-gender"
                  value={genderType}
                  onChange={(next) => applyGender(next as GenderType)}
                  options={Object.values(genderTypes).map((item) => ({
                    value: item,
                    label: t(`genderTypes.${item}`),
                  }))}
                />
              </FormField>
            </div>
            <FormField
              icon={BadgeCheck}
              label={t('accommodations.managementType')}
              htmlFor="introduce-management"
            >
              <SearchSelect
                id="introduce-management"
                value={managementType}
                onChange={(next) => setManagementType(next as ManagementType)}
                options={Object.values(managementTypes).map((item) => ({
                  value: item,
                  label: t(`managementTypes.${item}`),
                }))}
              />
            </FormField>
            <FormField icon={Phone} label={t('accommodations.phone')} htmlFor="introduce-phone">
              <input
                id="introduce-phone"
                className={`${fieldClassName} digit-field`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormField icon={AlignLeft} label={t('accommodations.description')} htmlFor="introduce-description">
              <textarea
                id="introduce-description"
                className={fieldClassName}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <FormField icon={UserCheck} label={t('accommodations.isPrimary')}>
              <ToggleField
                checked={isPrimary}
                onChange={setIsPrimary}
                onLabel={t('common.yes')}
                offLabel={t('common.no')}
              />
            </FormField>
            <WizardStepActions
              submitLabel={t('accommodationIntroduce.next')}
              backLabel={isPublic ? t('accommodationIntroduce.back') : t('accommodations.cancel')}
              onBack={() => (isPublic ? setStep(identityStep) : navigate(-1))}
              submitIcon="next"
              backIcon={isPublic ? 'previous' : 'cancel'}
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === locationStep ? (
        <FormCard
          icon={MapPin}
          title={t('accommodations.tabs.location')}
          subtitle={t('accommodationIntroduce.locationHint')}
        >
          <AppForm
            autoFocusFirst={false}
            onSubmit={(event) => goNext(event, capacityStep)}
            className={formCardBodyClassName}
          >
            <FormField icon={Flag} label={t('geo.country')} htmlFor="introduce-country">
              <SearchSelect
                id="introduce-country"
                value={selectedCountryId}
                placeholder={t('geo.selectCountry')}
                onChange={(next) => {
                  setCountryId(next)
                  setProvinceId('')
                  setCityId('')
                }}
                options={[
                  { value: '', label: t('geo.selectCountry') },
                  ...countries.data.map((country) => ({
                    value: country.id,
                    label: nameOf(country),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={MapPinned} label={t('geo.province')} htmlFor="introduce-province">
              <SearchSelect
                id="introduce-province"
                value={provinceId}
                disabled={!selectedCountryId}
                placeholder={t('geo.selectProvince')}
                onChange={(next) => {
                  setProvinceId(next)
                  setCityId('')
                }}
                options={[
                  { value: '', label: t('geo.selectProvince') },
                  ...(provinces.data ?? []).map((province) => ({
                    value: province.id,
                    label: nameOf(province),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={MapPin} label={t('geo.city')} htmlFor="introduce-city">
              <SearchSelect
                id="introduce-city"
                value={cityId}
                disabled={!provinceId}
                placeholder={t('geo.selectCity')}
                onChange={setCityId}
                options={[
                  { value: '', label: t('geo.selectCity') },
                  ...(cities.data ?? []).map((city) => ({
                    value: city.id,
                    label: nameOf(city),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={MapPin} label={t('accommodations.address')} htmlFor="introduce-address">
              <textarea
                id="introduce-address"
                className={fieldClassName}
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>
            <FormField
              icon={Navigation}
              label={t('accommodations.neshanAddress')}
              htmlFor="introduce-neshan"
            >
              <input
                id="introduce-neshan"
                className={fieldClassName}
                value={neshanAddress}
                onChange={(e) => setNeshanAddress(e.target.value)}
              />
            </FormField>
            <FormField icon={Compass} label={t('accommodations.coordinates')} htmlFor="introduce-coordinates">
              <input
                id="introduce-coordinates"
                className={`${fieldClassName} digit-field`}
                inputMode="decimal"
                placeholder={t('accommodations.coordinatesPlaceholder')}
                value={coordinates}
                onChange={(e) => setCoordinates(toLatinDigits(e.target.value))}
              />
            </FormField>
            <OsmMapPicker
              latitude={mapCoordinates.latitude}
              longitude={mapCoordinates.longitude}
              active={step === locationStep}
              onChange={(latitude, longitude) => {
                setCoordinates(latitude && longitude ? `${latitude},${longitude}` : '')
              }}
            />
            <WizardStepActions
              submitLabel={t('accommodationIntroduce.next')}
              backLabel={t('accommodationIntroduce.back')}
              onBack={() => setStep(generalStep)}
              submitIcon="next"
              backIcon="previous"
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === capacityStep ? (
        <FormCard
          icon={Users}
          title={t('accommodationIntroduce.stepCapacity')}
          subtitle={t('accommodationIntroduce.capacityHint')}
        >
          <AppForm
            autoFocusFirst={false}
            onSubmit={(event) => goNext(event, amenitiesStep)}
            className={formCardBodyClassName}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField icon={Users} label={t('accommodations.maleCapacity')} htmlFor="introduce-male">
                <input
                  id="introduce-male"
                  type="number"
                  min={0}
                  disabled={maleDisabled}
                  className={capacityFieldClassName}
                  value={maleDisabled ? '0' : maleCapacity}
                  onChange={(e) => setMaleCapacity(e.target.value)}
                />
              </FormField>
              <FormField icon={Users} label={t('accommodations.femaleCapacity')} htmlFor="introduce-female">
                <input
                  id="introduce-female"
                  type="number"
                  min={0}
                  disabled={femaleDisabled}
                  className={capacityFieldClassName}
                  value={femaleDisabled ? '0' : femaleCapacity}
                  onChange={(e) => setFemaleCapacity(e.target.value)}
                />
              </FormField>
            </div>
            <WizardStepActions
              submitLabel={t('accommodationIntroduce.next')}
              backLabel={t('accommodationIntroduce.back')}
              onBack={() => setStep(locationStep)}
              submitIcon="next"
              backIcon="previous"
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === amenitiesStep ? (
        <FormCard
          icon={Sparkles}
          title={t('accommodations.tabs.amenities')}
          subtitle={t('accommodationIntroduce.amenitiesHint')}
        >
          <AppForm autoFocusFirst={false} onSubmit={submit} className={formCardBodyClassName}>
            {isSchool ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  icon={School}
                  label={t('accommodations.schoolDistrict')}
                  htmlFor="introduce-school-district"
                >
                  <SearchSelect
                    id="introduce-school-district"
                    value={schoolDistrictId}
                    placeholder={t('schoolDistricts.select')}
                    onChange={setSchoolDistrictId}
                    options={[
                      { value: '', label: t('schoolDistricts.none') },
                      ...(schoolDistricts.data ?? []).map((item) => ({
                        value: item.id,
                        label: item.name,
                      })),
                    ]}
                  />
                </FormField>
                <FormField
                  icon={LayoutGrid}
                  label={t('accommodations.classroomCount')}
                  htmlFor="introduce-classroom-count"
                >
                  <input
                    id="introduce-classroom-count"
                    type="number"
                    min={0}
                    className={fieldClassName}
                    value={classroomCount}
                    onChange={(e) => setClassroomCount(e.target.value)}
                  />
                </FormField>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <AmenityCheck
                icon={Shirt}
                label={t('accommodations.hasLaundry')}
                checked={hasLaundry}
                onChange={setHasLaundry}
                onLabel={t('accommodations.equipped')}
                offLabel={t('accommodations.notEquipped')}
              />
              <AmenityCheck
                icon={Wifi}
                label={t('accommodations.hasInternet')}
                checked={hasInternet}
                onChange={setHasInternet}
                onLabel={t('accommodations.equipped')}
                offLabel={t('accommodations.notEquipped')}
              />
              <AmenityCheck
                icon={BookOpen}
                label={t('accommodations.hasPrayerRoom')}
                checked={hasPrayerRoom}
                onChange={setHasPrayerRoom}
                onLabel={t('accommodations.equipped')}
                offLabel={t('accommodations.notEquipped')}
              />
              <AmenityCheck
                icon={ArrowUpDown}
                label={t('accommodations.hasElevator')}
                checked={hasElevator}
                onChange={setHasElevator}
                onLabel={t('accommodations.equipped')}
                offLabel={t('accommodations.notEquipped')}
              />
            </div>
            <FormField icon={Flame} label={t('accommodations.heatingSystem')} htmlFor="introduce-heating">
              <input
                id="introduce-heating"
                className={fieldClassName}
                value={heatingSystem}
                onChange={(e) => setHeatingSystem(e.target.value)}
              />
            </FormField>
            <FormField icon={Snowflake} label={t('accommodations.coolingSystem')} htmlFor="introduce-cooling">
              <input
                id="introduce-cooling"
                className={fieldClassName}
                value={coolingSystem}
                onChange={(e) => setCoolingSystem(e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField icon={Car} label={t('accommodations.parkingCapacity')} htmlFor="introduce-parking">
                <input
                  id="introduce-parking"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  value={parkingCapacity}
                  onChange={(e) => setParkingCapacity(e.target.value)}
                />
              </FormField>
              <FormField icon={Bath} label={t('accommodations.bathroomCount')} htmlFor="introduce-bathroom">
                <input
                  id="introduce-bathroom"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  value={bathroomCount}
                  onChange={(e) => setBathroomCount(e.target.value)}
                />
              </FormField>
              <FormField icon={Droplets} label={t('accommodations.toiletCount')} htmlFor="introduce-toilet">
                <input
                  id="introduce-toilet"
                  type="number"
                  min={0}
                  className={fieldClassName}
                  value={toiletCount}
                  onChange={(e) => setToiletCount(e.target.value)}
                />
              </FormField>
            </div>
            <WizardStepActions
              submitLabel={t('accommodationIntroduce.submit')}
              backLabel={t('accommodationIntroduce.back')}
              onBack={() => setStep(capacityStep)}
              submitting={saving}
              submitIcon="check"
              backIcon="previous"
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === doneStep && done ? (
        <FormCard
          icon={CheckCircle2}
          title={
            isPublic
              ? t('accommodationIntroduce.publicSuccessTitle')
              : t('accommodationIntroduce.successTitle')
          }
        >
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.35)]">
                <CheckCircle2 className="size-8" aria-hidden />
              </span>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-700">
                {isPublic
                  ? t('accommodationIntroduce.publicSuccessBody')
                  : t('accommodationIntroduce.successBody')}
              </p>
            </div>
            <p className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm leading-7 text-ink-800">
              {isPublic
                ? t('accommodationIntroduce.publicSuccessReview')
                : t('accommodationIntroduce.successReview')}
            </p>
            {isPublic ? (
              <p className="rounded-2xl border border-mint-100 bg-mint-50 px-4 py-3 text-sm leading-7 text-ink-800">
                {loginWithPhone
                  ? t('accommodationIntroduce.publicSuccessLogin')
                  : t('accommodationIntroduce.publicSuccessLoginExisting')}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Building2}
                label={t('accommodations.name')}
                value={done.name}
                tone="teal"
              />
              <FormFactTile
                icon={MapPin}
                label={t('geo.city')}
                value={done.cityName || '—'}
                tone="mint"
              />
              <FormFactTile
                icon={MapPinned}
                label={t('accommodations.address')}
                value={done.address || '—'}
                tone="teal"
              />
              {introducedCapacity ? (
                <FormFactTile
                  icon={Users}
                  label={t('accommodationIntroduce.capacity')}
                  value={introducedCapacity}
                  tone="mint"
                />
              ) : null}
            </div>
            {isPublic ? (
              <Link
                to="/login"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-teal-500 px-[0.9rem] py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                <LogIn className="size-4" aria-hidden />
                {t('landing.login')}
              </Link>
            ) : (
              <Button type="button" onClick={() => navigate(`/introduced-accommodations/${done.id}`)}>
                <Eye className="size-4" aria-hidden />
                {t('accommodationIntroduce.viewAccommodation')}
              </Button>
            )}
          </div>
        </FormCard>
      ) : null}
    </div>
  )
}

function WizardStepActions({
  submitLabel,
  backLabel,
  onBack,
  submitting = false,
  submitIcon,
  backIcon,
}: {
  submitLabel: string
  backLabel: string
  onBack: () => void
  submitting?: boolean
  submitIcon: 'next' | 'check'
  backIcon: 'previous' | 'cancel'
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button type="button" data-form-cancel="" onClick={onBack}>
        {backIcon === 'previous' ? (
          <ChevronRight className="size-4" aria-hidden />
        ) : (
          <X className="size-4" aria-hidden />
        )}
        {backLabel}
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitIcon === 'check' ? <Check className="size-4" aria-hidden /> : null}
        {submitLabel}
        {submitIcon === 'next' ? <ChevronLeft className="size-4" aria-hidden /> : null}
      </Button>
    </div>
  )
}

function IntroduceSteps({
  step,
  variant,
  doneStep,
}: {
  step: Step
  variant: IntroduceVariant
  doneStep: Step
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const isPublic = variant === 'public'
  const items = [
    ...(isPublic
      ? [{ n: 1 as Step, label: t('accommodationIntroduce.stepIdentity') }]
      : []),
    { n: (isPublic ? 2 : 1) as Step, label: t('accommodations.tabs.general') },
    { n: (isPublic ? 3 : 2) as Step, label: t('accommodations.tabs.location') },
    { n: (isPublic ? 4 : 3) as Step, label: t('accommodationIntroduce.stepCapacity') },
    { n: (isPublic ? 5 : 4) as Step, label: t('accommodations.tabs.amenities') },
    { n: doneStep, label: t('accommodationIntroduce.stepDone') },
  ]

  return (
    <ol className={`mb-4 grid grid-cols-3 gap-2 ${isPublic ? 'sm:grid-cols-6' : 'sm:grid-cols-5'}`}>
      {items.map((item) => {
        const complete = item.n < step || step === doneStep
        const active = item.n === step && step !== doneStep
        return (
          <li
            key={item.n}
            aria-current={item.n === step ? 'step' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center ${
              active
                ? 'border-teal-400 bg-white shadow-[0_8px_20px_rgba(46,189,182,0.12)]'
                : complete
                  ? 'border-teal-100 bg-teal-50'
                  : 'border-line bg-white'
            }`}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                complete || active ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-500'
              }`}
            >
              {complete ? <Check className="size-3.5" aria-hidden /> : formatNumber(item.n, locale)}
            </span>
            <span className="text-xs font-medium text-ink-800">{item.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function AmenityCheck({
  icon: Icon,
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  icon: typeof Shirt
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  onLabel: string
  offLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-ink-800">
        <Icon className="size-4 text-teal-600" aria-hidden />
        {label}
      </span>
      <ToggleField checked={checked} onChange={onChange} onLabel={onLabel} offLabel={offLabel} />
    </div>
  )
}
