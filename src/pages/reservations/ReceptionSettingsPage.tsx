import {
  Banknote,
  BadgeCheck,
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  Globe2,
  Info,
  LayoutGrid,
  Plus,
  ScrollText,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  PageHeader,
  ToggleField,
  cardClassName,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { addDaysIso, currentPersianYear, persianYearOptions } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Country, PlacementGenderPolicy, ReceptionSettings, ReservationType } from '../../types/app'
import { ReceptionMultilineItems } from './ReceptionTypeContent'

type DraftPlan = {
  key: string
  id?: string
  coverageAmount: number
  premiumAmount: number
  description: string
}

type FeatureCountryIdsKey =
  | 'mashhadPlacementCountryIds'
  | 'routePlacementCountryIds'
  | 'companionsCountryIds'
  | 'insuranceCountryIds'
  | 'individualCountryIds'
  | 'groupCountryIds'
  | 'caravanCountryIds'

type Draft = Omit<
  ReceptionSettings,
  | 'year'
  | 'exists'
  | 'insurancePlans'
  | 'mashhadPlacementCountries'
  | 'routePlacementCountries'
  | 'companionsCountries'
  | 'insuranceCountries'
  | 'individualCountries'
  | 'groupCountries'
  | 'caravanCountries'
> & {
  insurancePlans: DraftPlan[]
} & Record<FeatureCountryIdsKey, string[]>

function idsOf(list?: { id: string }[]) {
  return (list ?? []).map((item) => item.id)
}

function toggleCountryId(ids: string[], countryId: string, on: boolean) {
  return on ? [...ids, countryId] : ids.filter((id) => id !== countryId)
}

function CountryCheckboxGrid({
  label,
  ids,
  countries,
  nameOf,
  onChange,
}: {
  label: string
  ids: string[]
  countries: Country[]
  nameOf: (country: Country) => string
  onChange: (ids: string[]) => void
}) {
  return (
    <FormField icon={Globe2} label={label}>
      <div className="grid gap-2 sm:grid-cols-2">
        {countries.map((country) => (
          <CheckboxField
            key={country.id}
            checked={ids.includes(country.id)}
            onChange={(on) => onChange(toggleCountryId(ids, country.id, on))}
            label={nameOf(country)}
          />
        ))}
      </div>
    </FormField>
  )
}

const emptyDraft = (): Draft => ({
  individualEnabled: false,
  individualMaleCapacity: 0,
  individualFemaleCapacity: 0,
  individualAutoApprove: false,
  individualPlacementMode: 'MANUAL',
  individualIntro: '',
  individualRules: '',
  groupEnabled: false,
  groupMaleCapacity: 0,
  groupFemaleCapacity: 0,
  groupAutoApprove: false,
  groupPlacementMode: 'MANUAL',
  groupIntro: '',
  groupRules: '',
  caravanEnabled: false,
  caravanMaleCapacity: 0,
  caravanFemaleCapacity: 0,
  caravanAutoApprove: false,
  caravanAutoApproveLicenses: false,
  caravanPlacementMode: 'MANUAL',
  caravanIntro: '',
  caravanRules: '',
  placementGenderPolicy: 'SINGLE_GENDER',
  mashhadPlacementCountryIds: [],
  routePlacementCountryIds: [],
  companionsCountryIds: [],
  insuranceCountryIds: [],
  individualCountryIds: [],
  groupCountryIds: [],
  caravanCountryIds: [],
  insuranceOrganization: '',
  insurancePlans: [],
  imamRezaMartyrdomDate: null,
  prophetDemiseDate: null,
})

let planKeySeq = 0
function nextPlanKey() {
  planKeySeq += 1
  return `plan-${planKeySeq}`
}

function emptyPlan(): DraftPlan {
  return {
    key: nextPlanKey(),
    coverageAmount: 0,
    premiumAmount: 0,
    description: '',
  }
}

type ReceptionTab = ReservationType | 'PLACEMENT' | 'INSURANCE' | 'OCCASIONS'

function toDraft(data: ReceptionSettings | Draft): Draft {
  const countryIds =
    'mashhadPlacementCountryIds' in data
      ? {
          mashhadPlacementCountryIds: data.mashhadPlacementCountryIds,
          routePlacementCountryIds: data.routePlacementCountryIds,
          companionsCountryIds: data.companionsCountryIds,
          insuranceCountryIds: data.insuranceCountryIds,
          individualCountryIds: data.individualCountryIds,
          groupCountryIds: data.groupCountryIds,
          caravanCountryIds: data.caravanCountryIds,
        }
      : {
          mashhadPlacementCountryIds: idsOf(data.mashhadPlacementCountries),
          routePlacementCountryIds: idsOf(data.routePlacementCountries),
          companionsCountryIds: idsOf(data.companionsCountries),
          insuranceCountryIds: idsOf(data.insuranceCountries),
          individualCountryIds: idsOf(data.individualCountries),
          groupCountryIds: idsOf(data.groupCountries),
          caravanCountryIds: idsOf(data.caravanCountries),
        }
  return {
    individualEnabled: data.individualEnabled,
    individualMaleCapacity: data.individualMaleCapacity,
    individualFemaleCapacity: data.individualFemaleCapacity,
    individualAutoApprove: data.individualAutoApprove,
    individualPlacementMode: data.individualPlacementMode ?? 'MANUAL',
    individualIntro: data.individualIntro ?? '',
    individualRules: data.individualRules ?? '',
    groupEnabled: data.groupEnabled,
    groupMaleCapacity: data.groupMaleCapacity,
    groupFemaleCapacity: data.groupFemaleCapacity,
    groupAutoApprove: data.groupAutoApprove,
    groupPlacementMode: data.groupPlacementMode ?? 'MANUAL',
    groupIntro: data.groupIntro ?? '',
    groupRules: data.groupRules ?? '',
    caravanEnabled: data.caravanEnabled,
    caravanMaleCapacity: data.caravanMaleCapacity,
    caravanFemaleCapacity: data.caravanFemaleCapacity,
    caravanAutoApprove: data.caravanAutoApprove,
    caravanAutoApproveLicenses: data.caravanAutoApproveLicenses ?? false,
    caravanPlacementMode: data.caravanPlacementMode ?? 'MANUAL',
    caravanIntro: data.caravanIntro ?? '',
    caravanRules: data.caravanRules ?? '',
    placementGenderPolicy: data.placementGenderPolicy ?? 'SINGLE_GENDER',
    ...countryIds,
    insuranceOrganization: data.insuranceOrganization ?? '',
    insurancePlans: (data.insurancePlans ?? []).map((plan) => ({
      key: 'id' in plan && plan.id ? plan.id : nextPlanKey(),
      id: 'id' in plan && plan.id ? plan.id : undefined,
      coverageAmount: plan.coverageAmount ?? 0,
      premiumAmount: plan.premiumAmount ?? 0,
      description: plan.description ?? '',
    })),
    imamRezaMartyrdomDate: data.imamRezaMartyrdomDate ?? null,
    prophetDemiseDate: data.prophetDemiseDate ?? null,
  }
}

function toPayload(draft: Draft) {
  const { insurancePlans, ...rest } = draft
  return {
    ...rest,
    insurancePlans: insurancePlans.map((plan) => ({
      ...(plan.id ? { id: plan.id } : {}),
      coverageAmount: plan.coverageAmount,
      premiumAmount: plan.premiumAmount,
      description: plan.description,
    })),
  }
}

const types: ReservationType[] = ['INDIVIDUAL', 'GROUP', 'CARAVAN']
const tabs: ReceptionTab[] = [...types, 'PLACEMENT', 'INSURANCE', 'OCCASIONS']

function typeKeys(type: ReservationType) {
  if (type === 'INDIVIDUAL') {
    return {
      enabled: 'individualEnabled',
      male: 'individualMaleCapacity',
      female: 'individualFemaleCapacity',
      auto: 'individualAutoApprove',
      placement: 'individualPlacementMode',
      intro: 'individualIntro',
      rules: 'individualRules',
      countries: 'individualCountryIds',
      hint: 'autoApproveHintIndividual',
      title: 'individual',
    } as const
  }
  if (type === 'GROUP') {
    return {
      enabled: 'groupEnabled',
      male: 'groupMaleCapacity',
      female: 'groupFemaleCapacity',
      auto: 'groupAutoApprove',
      placement: 'groupPlacementMode',
      intro: 'groupIntro',
      rules: 'groupRules',
      countries: 'groupCountryIds',
      hint: 'autoApproveHintGroup',
      title: 'group',
    } as const
  }
  return {
    enabled: 'caravanEnabled',
    male: 'caravanMaleCapacity',
    female: 'caravanFemaleCapacity',
    auto: 'caravanAutoApprove',
    placement: 'caravanPlacementMode',
    intro: 'caravanIntro',
    rules: 'caravanRules',
    countries: 'caravanCountryIds',
    hint: 'autoApproveHintCaravan',
    title: 'caravan',
  } as const
}

function tabLabel(item: ReceptionTab, t: (key: string) => string) {
  if (item === 'PLACEMENT') return t('receptionSettings.placement')
  if (item === 'INSURANCE') return t('receptionSettings.insurance')
  if (item === 'OCCASIONS') return t('receptionSettings.occasions')
  return t(`receptionSettings.${typeKeys(item).title}`)
}

function ReceptionTypeTabNav({
  tab,
  onChange,
}: {
  tab: ReceptionTab
  onChange: (tab: ReceptionTab) => void
}) {
  const { t } = useTranslation()
  return (
    <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
            tab === item
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
          }`}
        >
          {tabLabel(item, t)}
        </button>
      ))}
    </nav>
  )
}

export function ReceptionSettingsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const queryClient = useQueryClient()
  const [year, setYear] = useState(String(currentPersianYear()))
  const [tab, setTab] = useState<ReceptionTab>('INDIVIDUAL')
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })

  const settings = useQuery({
    queryKey: ['reception-settings', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${year}`)
      return data
    },
  })

  useEffect(() => {
    if (!settings.data) return
    setDraft(toDraft(settings.data))
  }, [settings.data])

  const save = useMutation({
    mutationFn: async (payload: Draft) => {
      const { data } = await api.put<ReceptionSettings>(
        `/reception-settings/${year}`,
        toPayload(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reception-settings', year] })
      void queryClient.invalidateQueries({ queryKey: ['reception-settings', year, 'capacity'] })
      toast.success(t('receptionSettings.saved'))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function patchEnabled(key: keyof Draft, checked: boolean) {
    const next = { ...draft, [key]: checked }
    setDraft(next)
    if (occasionsSequenceError(next)) {
      setTab('OCCASIONS')
      toast.error(t('receptionSettings.occasionsSequenceInvalid'))
      return
    }
    save.mutate(next)
  }

  function patchProphetDemiseDate(iso?: string) {
    const prophetDemiseDate = iso ?? null
    setDraft((current) => ({
      ...current,
      prophetDemiseDate,
      imamRezaMartyrdomDate: prophetDemiseDate ? addDaysIso(prophetDemiseDate, 1) : null,
    }))
  }

  function occasionsSequenceError(source: Draft = draft) {
    const prophet = source.prophetDemiseDate
    const imam = source.imamRezaMartyrdomDate
    if (!prophet && !imam) return null
    if (!prophet || !imam || imam !== addDaysIso(prophet, 1)) {
      return t('receptionSettings.occasionsSequenceInvalid')
    }
    return null
  }

  const occasionError = occasionsSequenceError()

  function patchPlan<K extends keyof DraftPlan>(key: string, field: K, value: DraftPlan[K]) {
    setDraft((current) => ({
      ...current,
      insurancePlans: current.insurancePlans.map((plan) =>
        plan.key === key ? { ...plan, [field]: value } : plan,
      ),
    }))
  }

  function addPlan() {
    setDraft((current) => ({
      ...current,
      insurancePlans: [...current.insurancePlans, emptyPlan()],
    }))
  }

  function removePlan(key: string) {
    setDraft((current) => ({
      ...current,
      insurancePlans: current.insurancePlans.filter((plan) => plan.key !== key),
    }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (occasionError) {
      setTab('OCCASIONS')
      toast.error(occasionError)
      return
    }
    save.mutate(draft)
  }

  function panelClass(item: ReceptionTab) {
    return `space-y-4 p-6 ${cardClassName} ${tab === item ? '' : 'hidden'}`
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('menus.receptionSettings')} subtitle={t('receptionSettings.subtitle')} />
      <AppForm
        onSubmit={submit}
        onInvalid={(event) => {
          const panel = (event.target as HTMLElement | null)?.closest('[data-tab]')
          const next = panel?.getAttribute('data-tab') as ReceptionTab | null
          if (next) setTab(next)
        }}
        className="space-y-4"
      >
        <div className={`${cardClassName} p-6`}>
          <FormField icon={Calendar} label={t('receptionSettings.year')}>
            <SearchSelect
              value={year}
              onChange={setYear}
              options={persianYearOptions(locale, Number(year)).map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              placeholder={t('receptionSettings.year')}
            />
          </FormField>
        </div>
        {settings.data && !settings.data.exists ? (
          <aside
            className="flex items-start gap-3 rounded-[22px] border-2 border-gold-100 bg-gradient-to-b from-gold-50 via-gold-50/80 to-white p-5 shadow-[0_14px_36px_rgba(232,184,58,0.18)]"
            role="status"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
              <Info className="size-5" aria-hidden />
            </div>
            <p className="pt-2 text-sm font-medium leading-7 text-ink-900">
              {t('receptionSettings.missingYear')}
            </p>
          </aside>
        ) : null}
        <ReceptionTypeTabNav tab={tab} onChange={setTab} />
        {types.map((type) => {
          const keys = typeKeys(type)
          return (
            <section key={type} data-tab={type} className={panelClass(type)}>
              <FormField icon={Users} label={t('receptionSettings.enabled')}>
                <ToggleField
                  checked={draft[keys.enabled]}
                  onChange={(checked) => patchEnabled(keys.enabled, checked)}
                  onLabel={t('geo.active')}
                  offLabel={t('geo.inactive')}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField icon={Users} label={t('receptionSettings.maleCapacity')} htmlFor={keys.male}>
                  <input
                    id={keys.male}
                    type="number"
                    min={0}
                    className={fieldClassName}
                    value={draft[keys.male]}
                    onChange={(event) => patch(keys.male, Number(event.target.value) || 0)}
                    required
                  />
                </FormField>
                <FormField icon={Users} label={t('receptionSettings.femaleCapacity')} htmlFor={keys.female}>
                  <input
                    id={keys.female}
                    type="number"
                    min={0}
                    className={fieldClassName}
                    value={draft[keys.female]}
                    onChange={(event) => patch(keys.female, Number(event.target.value) || 0)}
                    required
                  />
                </FormField>
              </div>
              <FormField icon={Users} label={t('receptionSettings.autoApprove')}>
                <ToggleField
                  checked={draft[keys.auto]}
                  onChange={(checked) => patch(keys.auto, checked)}
                  onLabel={t('geo.active')}
                  offLabel={t('geo.inactive')}
                />
              </FormField>
              <p className="text-sm leading-7 text-ink-500">{t(`receptionSettings.${keys.hint}`)}</p>
              <FormField icon={LayoutGrid} label={t('receptionSettings.placement')}>
                <ToggleField
                  checked={draft[keys.placement] === 'SYSTEM'}
                  onChange={(checked) =>
                    patch(keys.placement, checked ? 'SYSTEM' : 'MANUAL')
                  }
                  onLabel={t('receptionSettings.placementSystem')}
                  offLabel={t('receptionSettings.placementManual')}
                />
              </FormField>
              <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.placementHint')}</p>
              {type === 'CARAVAN' ? (
                <>
                  <FormField
                    icon={BadgeCheck}
                    label={t('receptionSettings.autoApproveLicenses')}
                  >
                    <ToggleField
                      checked={draft.caravanAutoApproveLicenses}
                      onChange={(checked) => patch('caravanAutoApproveLicenses', checked)}
                      onLabel={t('geo.active')}
                      offLabel={t('geo.inactive')}
                    />
                  </FormField>
                  <p className="text-sm leading-7 text-ink-500">
                    {t('receptionSettings.autoApproveLicensesHint')}
                  </p>
                </>
              ) : null}
              <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.typeCountriesHint')}</p>
              <CountryCheckboxGrid
                label={t('receptionSettings.typeCountries')}
                ids={draft[keys.countries]}
                countries={countries.data ?? []}
                nameOf={nameOf}
                onChange={(ids) => patch(keys.countries, ids)}
              />
              {type === 'CARAVAN' ? (
                <>
                  <p className="text-sm leading-7 text-ink-500">
                    {t('receptionSettings.companionsCountriesHint')}
                  </p>
                  <CountryCheckboxGrid
                    label={t('receptionSettings.companionsCountries')}
                    ids={draft.companionsCountryIds}
                    countries={countries.data ?? []}
                    nameOf={nameOf}
                    onChange={(ids) => patch('companionsCountryIds', ids)}
                  />
                </>
              ) : null}
              <FormField
                icon={Info}
                label={t('receptionSettings.intro')}
                htmlFor={keys.intro}
              >
                <textarea
                  id={keys.intro}
                  className={`${fieldClassName} min-h-28`}
                  value={draft[keys.intro]}
                  onChange={(event) => patch(keys.intro, event.target.value)}
                  maxLength={4000}
                  placeholder={t('receptionSettings.multilineHint')}
                />
              </FormField>
              {draft[keys.intro].trim() ? (
                <ReceptionMultilineItems
                  text={draft[keys.intro]}
                  variant="intro"
                  title={t('receptionSettings.preview')}
                />
              ) : null}
              <FormField
                icon={ScrollText}
                label={t('receptionSettings.rules')}
                htmlFor={keys.rules}
              >
                <textarea
                  id={keys.rules}
                  className={`${fieldClassName} min-h-32`}
                  value={draft[keys.rules]}
                  onChange={(event) => patch(keys.rules, event.target.value)}
                  maxLength={4000}
                  placeholder={t('receptionSettings.multilineHint')}
                />
              </FormField>
              {draft[keys.rules].trim() ? (
                <ReceptionMultilineItems
                  text={draft[keys.rules]}
                  variant="rules"
                  title={t('receptionSettings.preview')}
                />
              ) : null}
            </section>
          )
        })}
        <section data-tab="PLACEMENT" className={panelClass('PLACEMENT')}>
          <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.placementGenderHint')}</p>
          <FormField icon={LayoutGrid} label={t('receptionSettings.placementGender')}>
            <ToggleField
              checked={draft.placementGenderPolicy === 'MIXED'}
              onChange={(checked) =>
                patch(
                  'placementGenderPolicy',
                  (checked ? 'MIXED' : 'SINGLE_GENDER') satisfies PlacementGenderPolicy,
                )
              }
              onLabel={t('receptionSettings.placementGenderMixed')}
              offLabel={t('receptionSettings.placementGenderSingle')}
            />
          </FormField>
          <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.featureCountriesHint')}</p>
          {(
            [
              ['mashhadPlacementCountryIds', 'mashhadPlacementCountries'],
              ['routePlacementCountryIds', 'routePlacementCountries'],
            ] as const
          ).map(([key, labelKey]) => (
            <CountryCheckboxGrid
              key={key}
              label={t(`receptionSettings.${labelKey}`)}
              ids={draft[key]}
              countries={countries.data ?? []}
              nameOf={nameOf}
              onChange={(ids) => patch(key, ids)}
            />
          ))}
        </section>
        <section data-tab="INSURANCE" className={panelClass('INSURANCE')}>
          <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.insuranceHint')}</p>
          <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.insuranceCountriesHint')}</p>
          <CountryCheckboxGrid
            label={t('receptionSettings.insuranceCountries')}
            ids={draft.insuranceCountryIds}
            countries={countries.data ?? []}
            nameOf={nameOf}
            onChange={(ids) => patch('insuranceCountryIds', ids)}
          />
          <FormField
            icon={Building2}
            label={t('receptionSettings.insuranceOrganization')}
            htmlFor="insuranceOrganization"
          >
            <input
              id="insuranceOrganization"
              className={fieldClassName}
              value={draft.insuranceOrganization}
              onChange={(event) => patch('insuranceOrganization', event.target.value)}
              maxLength={200}
            />
          </FormField>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800">
                <Shield className="size-4 text-teal-600" aria-hidden />
                {t('receptionSettings.insurancePlans')}
              </h3>
              <Button type="button" variant="soft" onClick={addPlan}>
                <Plus className="size-4" aria-hidden />
                {t('receptionSettings.addInsurancePlan')}
              </Button>
            </div>
            {draft.insurancePlans.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-cream-50 px-4 py-5 text-sm leading-7 text-ink-500">
                {t('receptionSettings.insurancePlansEmpty')}
              </p>
            ) : (
              draft.insurancePlans.map((plan, index) => (
                <article
                  key={plan.key}
                  className="space-y-4 rounded-2xl border border-line bg-cream-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink-800">
                      {t('receptionSettings.insurancePlanTitle', {
                        n: index + 1,
                      })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      icon
                      aria-label={t('receptionSettings.removeInsurancePlan')}
                      onClick={() => removePlan(plan.key)}
                    >
                      <Trash2 className="size-4 text-red-600" aria-hidden />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      icon={Shield}
                      label={t('receptionSettings.insuranceCoverageAmount')}
                      htmlFor={`coverage-${plan.key}`}
                    >
                      <input
                        id={`coverage-${plan.key}`}
                        type="number"
                        min={0}
                        className={fieldClassName}
                        value={plan.coverageAmount}
                        onChange={(event) =>
                          patchPlan(plan.key, 'coverageAmount', Number(event.target.value) || 0)
                        }
                        required
                      />
                    </FormField>
                    <FormField
                      icon={Banknote}
                      label={t('receptionSettings.insurancePremiumPerPerson')}
                      htmlFor={`premium-${plan.key}`}
                    >
                      <input
                        id={`premium-${plan.key}`}
                        type="number"
                        min={0}
                        className={fieldClassName}
                        value={plan.premiumAmount}
                        onChange={(event) =>
                          patchPlan(plan.key, 'premiumAmount', Number(event.target.value) || 0)
                        }
                        required
                      />
                    </FormField>
                  </div>
                  <FormField
                    icon={FileText}
                    label={t('receptionSettings.insurancePlanDescription')}
                    htmlFor={`desc-${plan.key}`}
                  >
                    <textarea
                      id={`desc-${plan.key}`}
                      className={`${fieldClassName} min-h-24`}
                      value={plan.description}
                      onChange={(event) =>
                        patchPlan(plan.key, 'description', event.target.value)
                      }
                      maxLength={2000}
                    />
                  </FormField>
                </article>
              ))
            )}
          </div>
        </section>
        <section data-tab="OCCASIONS" className={panelClass('OCCASIONS')}>
          <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.occasionsHint')}</p>
          <FormField
            icon={CalendarDays}
            label={t('receptionSettings.prophetDemiseDate')}
            htmlFor="prophetDemiseDate"
          >
            <PersianDateField
              id="prophetDemiseDate"
              value={draft.prophetDemiseDate || undefined}
              onChange={patchProphetDemiseDate}
              showHijri
            />
          </FormField>
          <FormField
            icon={CalendarDays}
            label={t('receptionSettings.imamRezaMartyrdomDate')}
            htmlFor="imamRezaMartyrdomDate"
          >
            <PersianDateField
              id="imamRezaMartyrdomDate"
              value={draft.imamRezaMartyrdomDate || undefined}
              onChange={(iso) => patch('imamRezaMartyrdomDate', iso ?? null)}
              showHijri
            />
          </FormField>
          {occasionError ? (
            <p className="text-sm font-medium leading-7 text-red-700" role="alert">
              {occasionError}
            </p>
          ) : null}
        </section>
        <FormActions submitLabel={t('receptionSettings.save')} submitting={save.isPending} />
      </AppForm>
    </div>
  )
}
