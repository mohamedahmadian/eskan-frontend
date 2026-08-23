import { Banknote, Building2, Calendar, FileText, Info, Users } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  ToggleField,
  cardClassName,
  fieldClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, persianYearOptions } from '../../lib/datetime'
import type { ReceptionSettings, ReservationType } from '../../types/app'

type Draft = Omit<ReceptionSettings, 'year' | 'exists'>
type ReceptionTab = ReservationType | 'INSURANCE'

const emptyDraft = (): Draft => ({
  individualEnabled: false,
  individualMaleCapacity: 0,
  individualFemaleCapacity: 0,
  individualAutoApprove: false,
  groupEnabled: false,
  groupMaleCapacity: 0,
  groupFemaleCapacity: 0,
  groupAutoApprove: false,
  caravanEnabled: false,
  caravanMaleCapacity: 0,
  caravanFemaleCapacity: 0,
  caravanAutoApprove: false,
  insuranceOrganization: '',
  insurancePremiumAmount: 0,
  insuranceCoverage: '',
})

function toDraft(data: ReceptionSettings | Draft): Draft {
  return {
    individualEnabled: data.individualEnabled,
    individualMaleCapacity: data.individualMaleCapacity,
    individualFemaleCapacity: data.individualFemaleCapacity,
    individualAutoApprove: data.individualAutoApprove,
    groupEnabled: data.groupEnabled,
    groupMaleCapacity: data.groupMaleCapacity,
    groupFemaleCapacity: data.groupFemaleCapacity,
    groupAutoApprove: data.groupAutoApprove,
    caravanEnabled: data.caravanEnabled,
    caravanMaleCapacity: data.caravanMaleCapacity,
    caravanFemaleCapacity: data.caravanFemaleCapacity,
    caravanAutoApprove: data.caravanAutoApprove,
    insuranceOrganization: data.insuranceOrganization ?? '',
    insurancePremiumAmount: data.insurancePremiumAmount ?? 0,
    insuranceCoverage: data.insuranceCoverage ?? '',
  }
}

const types: ReservationType[] = ['INDIVIDUAL', 'GROUP', 'CARAVAN']
const tabs: ReceptionTab[] = [...types, 'INSURANCE']

function typeKeys(type: ReservationType) {
  if (type === 'INDIVIDUAL') {
    return {
      enabled: 'individualEnabled',
      male: 'individualMaleCapacity',
      female: 'individualFemaleCapacity',
      auto: 'individualAutoApprove',
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
      hint: 'autoApproveHintGroup',
      title: 'group',
    } as const
  }
  return {
    enabled: 'caravanEnabled',
    male: 'caravanMaleCapacity',
    female: 'caravanFemaleCapacity',
    auto: 'caravanAutoApprove',
    hint: 'autoApproveHintCaravan',
    title: 'caravan',
  } as const
}

function tabLabel(item: ReceptionTab, t: (key: string) => string) {
  if (item === 'INSURANCE') return t('receptionSettings.insurance')
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
  const queryClient = useQueryClient()
  const [year, setYear] = useState(String(currentPersianYear()))
  const [tab, setTab] = useState<ReceptionTab>('INDIVIDUAL')
  const [draft, setDraft] = useState<Draft>(emptyDraft)

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
    mutationFn: async () => {
      const { data } = await api.put<ReceptionSettings>(
        `/reception-settings/${year}`,
        toDraft(draft),
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

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
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
                  onChange={(checked) => patch(keys.enabled, checked)}
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
            </section>
          )
        })}
        <section data-tab="INSURANCE" className={panelClass('INSURANCE')}>
          <p className="text-sm leading-7 text-ink-500">{t('receptionSettings.insuranceHint')}</p>
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
          <FormField
            icon={Banknote}
            label={t('receptionSettings.insurancePremium')}
            htmlFor="insurancePremiumAmount"
          >
            <input
              id="insurancePremiumAmount"
              type="number"
              min={0}
              className={fieldClassName}
              value={draft.insurancePremiumAmount}
              onChange={(event) => patch('insurancePremiumAmount', Number(event.target.value) || 0)}
              required
            />
          </FormField>
          <FormField
            icon={FileText}
            label={t('receptionSettings.insuranceCoverage')}
            htmlFor="insuranceCoverage"
          >
            <textarea
              id="insuranceCoverage"
              className={`${fieldClassName} min-h-32`}
              value={draft.insuranceCoverage}
              onChange={(event) => patch('insuranceCoverage', event.target.value)}
              maxLength={4000}
            />
          </FormField>
        </section>
        <FormActions submitLabel={t('receptionSettings.save')} submitting={save.isPending} />
      </AppForm>
    </div>
  )
}
