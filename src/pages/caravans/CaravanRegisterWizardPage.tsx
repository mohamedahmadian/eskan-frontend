import {
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Flag,
  MapPin,
  MapPinned,
  Route,
  Tent,
  UserPlus,
  UserRound,
  Users,
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
  FormActions,
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
import { currentPersianYear, formatNumber, toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Caravan, City, Country, Paginated, Province, WalkingRoute } from '../../types/app'
import { CaravanContactsPanel, firstIncompleteContactRole } from './CaravanContactsPanel'
import { CaravanManagerPicker, type CaravanManagerChoice } from './CaravanManagerPicker'
import {
  caravanContactRoles,
  contactDraftsFromInitial,
  isContactComplete,
  toContactPayloads,
  type CaravanContactDraft,
  type CaravanContactRole,
} from './caravanContacts'

type Step = 1 | 2 | 3

type RegisteredCaravan = {
  id: string
  name: string
  foundedYear: number
  cityName: string
}

function toYear(value: string) {
  const parsed = Number(toLatinDigits(value))
  if (!Number.isInteger(parsed) || parsed < 1300 || parsed > 1600) return null
  return parsed
}

function toCount(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(toLatinDigits(value))
  if (!Number.isInteger(parsed) || parsed < 0) return null
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
  const [walkingRouteId, setWalkingRouteId] = useState('')
  const [maleCount, setMaleCount] = useState('')
  const [femaleCount, setFemaleCount] = useState('')
  const [manager, setManager] = useState<CaravanManagerChoice | null>(null)
  const [contactDrafts, setContactDrafts] = useState<
    Record<CaravanContactRole, CaravanContactDraft>
  >(() => contactDraftsFromInitial())
  const [activeRole, setActiveRole] = useState<CaravanContactRole>(() =>
    firstIncompleteContactRole(contactDraftsFromInitial()),
  )
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

  const walkingRoutes = useQuery({
    queryKey: ['walking-routes', 'lookup', countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: { pageSize: 100, originCountryId: countryId || undefined },
      })
      return data.items
    },
  })

  const totalCount = (toCount(maleCount) ?? 0) + (toCount(femaleCount) ?? 0)

  function applyManager(next: CaravanManagerChoice | null) {
    setManager(next)
    if (!next?.provinceId || !next.cityId) return
    if (next.countryId) setCountryId(next.countryId)
    setProvinceId(next.provinceId)
    setCityId(next.cityId)
  }

  function goToContacts(event: FormEvent) {
    event.preventDefault()
    if (admin && !manager) {
      toast.error(t('caravans.managerRequired'))
      return
    }
    if (toYear(foundedYear) == null) {
      toast.error(t('caravanRegister.foundedYearInvalid'))
      return
    }
    setStep(2)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    for (const role of caravanContactRoles) {
      if (!isContactComplete(contactDrafts[role])) {
        toast.error(
          t('caravans.contactIncomplete', {
            role: t(`caravans.contactRoles.${role}`),
          }),
        )
        setActiveRole(role)
        return
      }
    }

    const year = toYear(foundedYear)
    const male = toCount(maleCount)
    const female = toCount(femaleCount)
    if (year == null || male == null || female == null || !cityId || (admin && !manager)) {
      toast.error(t('caravanRegister.stepIncomplete'))
      setStep(1)
      return
    }
    if (admin && !manager?.phone?.trim()) {
      toast.error(t('caravanRegister.managerPhoneRequired'))
      setStep(1)
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
        walkingRouteId: walkingRouteId || null,
        licenseNumber: licenseNumber.trim() || null,
        licenseImageId: null,
        managerUserId: admin ? manager?.id ?? null : null,
        year: currentPersianYear(),
        totalCount: male + female,
        maleCount: male,
        femaleCount: female,
        eitaa: null,
        bale: null,
        telegram: null,
        instagram: null,
        isActive: false,
        contacts: toContactPayloads(contactDrafts),
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
          <AppForm autoFocusFirst onSubmit={goToContacts} className={formCardBodyClassName}>
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
                    setWalkingRouteId('')
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

            <FormField icon={Route} label={t('caravans.walkingRoute')} htmlFor="register-walkingRouteId">
              <SearchSelect
                id="register-walkingRouteId"
                value={walkingRouteId}
                onChange={setWalkingRouteId}
                placeholder={t('caravans.walkingRoute')}
                options={[
                  { value: '', label: t('caravans.walkingRouteNone') },
                  ...(walkingRoutes.data ?? []).map((route) => ({
                    value: route.id,
                    label: route.name,
                  })),
                ]}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField icon={UserRound} label={t('caravans.maleCount')} htmlFor="register-maleCount">
                <input
                  id="register-maleCount"
                  type="number"
                  min={0}
                  step={1}
                  className={fieldClassName}
                  value={maleCount}
                  required
                  onChange={(e) => setMaleCount(e.target.value)}
                />
              </FormField>
              <FormField icon={UserPlus} label={t('caravans.femaleCount')} htmlFor="register-femaleCount">
                <input
                  id="register-femaleCount"
                  type="number"
                  min={0}
                  step={1}
                  className={fieldClassName}
                  value={femaleCount}
                  required
                  onChange={(e) => setFemaleCount(e.target.value)}
                />
              </FormField>
              <FormField icon={Users} label={t('caravans.totalCount')} htmlFor="register-totalCount">
                <input
                  id="register-totalCount"
                  type="number"
                  className={`${fieldClassName} bg-cream-50 text-ink-700`}
                  value={totalCount}
                  readOnly
                  tabIndex={-1}
                />
              </FormField>
            </div>

            {admin ? (
              <>
                <FormSectionTitle icon={UserRound}>{t('caravans.manager')}</FormSectionTitle>
                <CaravanManagerPicker
                  value={manager}
                  onChange={applyManager}
                  emptyLabel={t('caravans.managerRequired')}
                />
              </>
            ) : null}

            <FormActions
              submitLabel={t('caravanRegister.next')}
              cancelLabel={t('caravans.cancel')}
              onCancel={() => navigate('/my-caravans')}
            />
          </AppForm>
        </FormCard>
      ) : null}

      {step === 2 ? (
        <FormCard
          icon={Users}
          title={t('caravans.sectionContacts')}
          subtitle={t('caravanRegister.contactsHint')}
        >
          <AppForm autoFocusFirst={false} onSubmit={submit} className={formCardBodyClassName}>
            <CaravanContactsPanel
              drafts={contactDrafts}
              activeRole={activeRole}
              onActiveRoleChange={setActiveRole}
              onDraftChange={(role, next) =>
                setContactDrafts((current) => ({ ...current, [role]: next }))
              }
              newPersonInModal
            />
            <FormActions
              submitLabel={t('caravanRegister.submit')}
              cancelLabel={t('caravanRegister.back')}
              submitting={saving}
              onCancel={() => setStep(1)}
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
                value={t('caravanRegister.statusPending')}
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

function RegisterSteps({ step }: { step: Step }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const items = [
    { n: 1 as const, label: t('caravanRegister.stepInfo') },
    { n: 2 as const, label: t('caravanRegister.stepContacts') },
    { n: 3 as const, label: t('caravanRegister.stepDone') },
  ]

  return (
    <ol className="mb-4 grid grid-cols-3 gap-2">
      {items.map((item) => {
        const done = item.n < step || step === 3
        const active = item.n === step && step < 3
        return (
          <li
            key={item.n}
            aria-current={item.n === step ? 'step' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center ${
              active
                ? 'border-teal-400 bg-white shadow-[0_8px_20px_rgba(46,189,182,0.12)]'
                : done
                  ? 'border-teal-100 bg-teal-50'
                  : 'border-line bg-white'
            }`}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                done || active ? 'bg-teal-500 text-white' : 'bg-cream-100 text-ink-500'
              }`}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : formatNumber(item.n, locale)}
            </span>
            <span className="text-xs font-medium text-ink-800">{item.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
