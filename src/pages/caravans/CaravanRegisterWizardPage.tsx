import {
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileImage,
  Flag,
  MapPin,
  MapPinned,
  MessageCircle,
  Share2,
  Tent,
  UserRound,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  AppForm,
  Button,
  FormField,
  LoadingState,
  PageHeader,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormFactTile,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { isAdmin } from '../../lib/roles'
import { formatNumber, toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Caravan, City, Country, Province } from '../../types/app'
import { AccommodationImagesField } from '../accommodations/AccommodationImagesField'
import { CaravanManagerPicker, type CaravanManagerChoice } from './CaravanManagerPicker'
import { CaravanStatusBadge } from './CaravanStatusBadge'

type Step = 1 | 2 | 3

type RegisteredCaravan = {
  id: string
  name: string
  foundedYear: number
  cityName: string
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toYear(value: string) {
  const parsed = Number(toLatinDigits(value))
  if (!Number.isInteger(parsed) || parsed < 1300 || parsed > 1600) return null
  return parsed
}

export function CaravanRegisterWizardPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refresh } = useAuth()
  const admin = isAdmin(user)
  const nameOf = useGeoName()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [countryId, setCountryId] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [cityId, setCityId] = useState('')
  const [licenseImageIds, setLicenseImageIds] = useState<string[]>([])
  const [manager, setManager] = useState<CaravanManagerChoice | null>(null)
  const [eitaa, setEitaa] = useState('')
  const [bale, setBale] = useState('')
  const [telegram, setTelegram] = useState('')
  const [instagram, setInstagram] = useState('')
  const [done, setDone] = useState<RegisteredCaravan | null>(null)

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  useEffect(() => {
    if (countryId || !countries.data) return
    const iran = countries.data.find((country) => country.iso2 === 'IR')?.id ?? ''
    if (iran) setCountryId(iran)
  }, [countries.data, countryId])

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId, activeOnly: true },
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

  function goToLicenseStep(event: FormEvent) {
    event.preventDefault()
    const year = toYear(foundedYear)
    if (!name.trim() || year == null || !cityId) {
      toast.error(t('caravanRegister.stepIncomplete'))
      return
    }
    setStep(2)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (admin && !manager) {
      toast.error(t('caravans.managerRequired'))
      return
    }
    const year = toYear(foundedYear)
    if (year == null || !cityId) {
      toast.error(t('caravanRegister.stepIncomplete'))
      return
    }
    if (admin && !manager?.phone?.trim()) {
      toast.error(t('caravanRegister.managerPhoneRequired'))
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post<Caravan>('/caravans/register', {
        name: name.trim(),
        description: null,
        officeAddress: null,
        officePhone: null,
        foundedYear: year,
        cityId,
        licenseNumber: licenseNumber.trim() || null,
        licenseImageIds,
        managerUserId: admin ? manager?.id ?? null : null,
        eitaa: emptyToNull(eitaa),
        bale: emptyToNull(bale),
        telegram: emptyToNull(telegram),
        instagram: emptyToNull(instagram),
      })
      await queryClient.invalidateQueries({ queryKey: ['caravans'] })
      await refresh()
      const city = (cities.data ?? []).find((item) => item.id === cityId)
      setDone({
        id: data.id,
        name: name.trim(),
        foundedYear: year,
        cityName: city ? nameOf(city) : '',
      })
      setStep(3)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  if (!countries.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Tent}
        title={t('caravanRegister.title')}
        subtitle={t('caravanRegister.subtitle')}
        backTo={false}
      />
      <RegisterSteps step={step} />

      {step === 1 ? (
        <FormCard
          icon={Tent}
          title={t('caravanRegister.stepInfo')}
          subtitle={t('caravanRegister.infoHint')}
        >
          <AppForm autoFocusFirst onSubmit={goToLicenseStep} className={formCardBodyClassName}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField icon={Tent} label={t('caravans.name')} htmlFor="register-name">
                <input
                  id="register-name"
                  className={fieldClassName}
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>
              <FormField icon={Calendar} label={t('caravans.foundedYear')} htmlFor="register-foundedYear">
                <input
                  id="register-foundedYear"
                  type="number"
                  min={1300}
                  max={1600}
                  step={1}
                  className={fieldClassName}
                  value={foundedYear}
                  required
                  onChange={(e) => setFoundedYear(e.target.value)}
                />
              </FormField>
            </div>

            <FormField
              icon={BadgeCheck}
              label={t('caravanRegister.licenseNumber')}
              htmlFor="register-licenseNumber"
            >
              <input
                id="register-licenseNumber"
                className={fieldClassName}
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField icon={Flag} label={t('geo.country')} htmlFor="register-countryId">
                <SearchSelect
                  id="register-countryId"
                  value={countryId}
                  required
                  onChange={(next) => {
                    setCountryId(next)
                    setProvinceId('')
                    setCityId('')
                  }}
                  placeholder={t('geo.selectCountry')}
                  options={[
                    { value: '', label: t('geo.selectCountry') },
                    ...countries.data.map((country) => ({
                      value: country.id,
                      label: nameOf(country),
                    })),
                  ]}
                />
              </FormField>
              <FormField icon={MapPinned} label={t('geo.province')} htmlFor="register-provinceId">
                <SearchSelect
                  id="register-provinceId"
                  value={provinceId}
                  required
                  disabled={!countryId}
                  onChange={(next) => {
                    setProvinceId(next)
                    setCityId('')
                  }}
                  placeholder={t('geo.selectProvince')}
                  options={[
                    { value: '', label: t('geo.selectProvince') },
                    ...(provinces.data ?? []).map((province) => ({
                      value: province.id,
                      label: nameOf(province),
                    })),
                  ]}
                />
              </FormField>
              <FormField icon={MapPin} label={t('caravans.city')} htmlFor="register-cityId">
                <SearchSelect
                  id="register-cityId"
                  value={cityId}
                  required
                  disabled={!provinceId}
                  onChange={setCityId}
                  placeholder={t('geo.selectCity')}
                  options={[
                    { value: '', label: t('geo.selectCity') },
                    ...(cities.data ?? []).map((city) => ({
                      value: city.id,
                      label: nameOf(city),
                    })),
                  ]}
                />
              </FormField>
            </div>

            <WizardStepActions
              submitLabel={t('caravanRegister.next')}
              backLabel={t('caravans.cancel')}
              onBack={() => navigate('/my-caravans')}
              submitIcon="next"
              backIcon="cancel"
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === 2 ? (
        <FormCard
          icon={FileImage}
          title={t('caravanRegister.stepLicense')}
          subtitle={t('caravanRegister.licenseHint')}
        >
          <AppForm autoFocusFirst={false} onSubmit={submit} className={formCardBodyClassName}>
            <FormSectionTitle icon={FileImage}>{t('caravans.licenseImages')}</FormSectionTitle>
            <FormField icon={FileImage} label={t('caravans.licenseImages')} htmlFor="register-licenseImages">
              <AccommodationImagesField
                imageIds={licenseImageIds}
                onChange={setLicenseImageIds}
                maxImages={8}
                capture="environment"
                emptyLabel={t('caravans.noLicenseImages')}
                limitLabel={t('caravans.licenseImagesLimit')}
              />
            </FormField>

            <FormSectionTitle icon={UserRound}>{t('caravans.manager')}</FormSectionTitle>
            {admin ? (
              <CaravanManagerPicker
                value={manager}
                onChange={setManager}
                emptyLabel={t('caravans.managerRequired')}
              />
            ) : (
              <FormFactTile
                icon={UserRound}
                label={t('caravans.manager')}
                value={user?.fullName || t('caravanRegister.selfManagerHint')}
                tone="teal"
              />
            )}

            <FormSectionTitle icon={Share2}>{t('caravans.sectionSocial')}</FormSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField icon={Share2} label={t('caravans.eitaa')} htmlFor="register-eitaa">
                <input
                  id="register-eitaa"
                  className={fieldClassName}
                  value={eitaa}
                  onChange={(e) => setEitaa(e.target.value)}
                  dir="ltr"
                />
              </FormField>
              <FormField icon={MessageCircle} label={t('caravans.bale')} htmlFor="register-bale">
                <input
                  id="register-bale"
                  className={fieldClassName}
                  value={bale}
                  onChange={(e) => setBale(e.target.value)}
                  dir="ltr"
                />
              </FormField>
              <FormField icon={MessageCircle} label={t('caravans.telegram')} htmlFor="register-telegram">
                <input
                  id="register-telegram"
                  className={fieldClassName}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  dir="ltr"
                />
              </FormField>
              <FormField icon={Share2} label={t('caravans.instagram')} htmlFor="register-instagram">
                <input
                  id="register-instagram"
                  className={fieldClassName}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  dir="ltr"
                />
              </FormField>
            </div>

            <WizardStepActions
              submitLabel={t('caravanRegister.submit')}
              backLabel={t('caravanRegister.back')}
              onBack={() => setStep(1)}
              submitting={saving}
              submitIcon="check"
              backIcon="previous"
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === 3 && done ? (
        <FormCard icon={CheckCircle2} title={t('caravanRegister.successTitle')}>
          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.35)]">
                <CheckCircle2 className="size-8" aria-hidden />
              </span>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-700">
                {t('caravanRegister.successBody')}
              </p>
            </div>
            <p className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm leading-7 text-ink-800">
              {t('caravanRegister.successReviewBefore')}
              <strong className="font-semibold text-ink-900">
                {t('caravanRegister.successReviewEmphasis')}
              </strong>
            </p>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile icon={Tent} label={t('caravans.name')} value={done.name} tone="teal" />
              <FormFactTile
                icon={Calendar}
                label={t('caravans.foundedYear')}
                value={formatNumber(done.foundedYear, locale)}
                tone="mint"
              />
              <FormFactTile
                icon={MapPin}
                label={t('caravanRegister.originCity')}
                value={done.cityName}
                tone="teal"
              />
              <FormFactTile
                icon={ClipboardCheck}
                label={t('caravans.status')}
                value={<CaravanStatusBadge status="PENDING_REVIEW" />}
                tone="mint"
              />
            </div>
            <Button type="button" onClick={() => navigate(`/my-caravans/${done.id}`)}>
              <Eye className="size-4" aria-hidden />
              {t('caravanRegister.viewCaravan')}
            </Button>
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
      <Button type="submit" disabled={submitting}>
        {submitIcon === 'check' ? <Check className="size-4" aria-hidden /> : null}
        {submitLabel}
        {submitIcon === 'next' ? <ChevronLeft className="size-4" aria-hidden /> : null}
      </Button>
      <Button type="button" variant="ghost" data-form-cancel="" onClick={onBack}>
        {backIcon === 'previous' ? (
          <ChevronRight className="size-4" aria-hidden />
        ) : (
          <X className="size-4" aria-hidden />
        )}
        {backLabel}
      </Button>
    </div>
  )
}

function RegisterSteps({ step }: { step: Step }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const items = [
    { n: 1 as const, label: t('caravanRegister.stepInfo') },
    { n: 2 as const, label: t('caravanRegister.stepLicense') },
    { n: 3 as const, label: t('caravanRegister.stepDone') },
  ]

  return (
    <ol className="mb-4 grid grid-cols-3 gap-2">
      {items.map((item) => {
        const complete = item.n < step || step === 3
        const active = item.n === step && step < 3
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
