import {
  Building2,
  Bus,
  Calendar,
  Footprints,
  HeartHandshake,
  MapPin,
  MoonStar,
  Route,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { DateText, HijriDateText } from '../../components/ui/DateText'
import { FormField } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type {
  City,
  Paginated,
  Province,
  ReceptionSettings,
  ReservationType,
  WalkingRoute,
} from '../../types/app'
import { ReservationCountFields } from './ReservationCountFields'
import {
  createReservationParty,
  emptyPartyDraft,
  partyDraftError,
  ReservationPartyFields,
  type PartyDraft,
  type PartyKind,
} from './ReservationPartyFields'

export function travelDatesError(
  values: Pick<TravelValues, 'walkingStartDate' | 'stayStartDate' | 'stayEndDate'>,
  t: (key: string) => string,
) {
  if (!values.stayStartDate) {
    return t('reservations.stayStartRequired')
  }
  if (!values.stayEndDate) {
    return t('reservations.stayEndRequired')
  }
  if (values.stayStartDate && values.walkingStartDate && values.stayStartDate <= values.walkingStartDate) {
    return t('reservations.walkingRangeInvalid')
  }
  if (values.stayEndDate && values.stayStartDate && values.stayEndDate <= values.stayStartDate) {
    return t('reservations.stayRangeInvalid')
  }
  return null
}

export type TravelValues = {
  provinceId: string
  originCityId: string
  walkingRouteId: string
  stayStartDate: string
  stayEndDate: string
  walkingStartDate: string
  maleCount: string
  femaleCount: string
  caravanId: string
  groupId: string
  requestsAccommodation: boolean
  requestsBus: boolean
}

export function ReservationTravelFields({
  values,
  onChange,
  type,
  locked,
  iranId,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  type: ReservationType
  locked?: boolean
  iranId: string
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-800">{t('reservations.createSteps.count')}</h3>
        <ReservationCountFields values={values} onChange={onChange} type={type} locked={locked} />
      </section>
      {type === 'GROUP' || type === 'CARAVAN' ? (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-800">
            {t(type === 'CARAVAN' ? 'reservations.createSteps.caravan' : 'reservations.createSteps.group')}
          </h3>
          <ReservationTravelPartyField values={values} onChange={onChange} type={type} locked={locked} />
        </section>
      ) : null}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-800">{t('reservations.createSteps.dates')}</h3>
        <ReservationDateFields values={values} onChange={onChange} locked={locked} />
      </section>
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-800">{t('reservations.createSteps.optional')}</h3>
        <ReservationApplicantFields values={values} onChange={onChange} locked={locked} />
        <OptionalInfoHint />
        <ReservationOptionalGeoFields
          values={values}
          onChange={onChange}
          locked={locked}
          iranId={iranId}
        />
      </section>
    </div>
  )
}

export function ReservationApplicantFields({
  values,
  onChange,
  locked,
}: {
  values: Pick<TravelValues, 'requestsAccommodation' | 'requestsBus'>
  onChange: (patch: Partial<TravelValues>) => void
  locked?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CheckboxField
        id="requestsAccommodation"
        checked={values.requestsAccommodation}
        disabled={locked}
        onChange={(requestsAccommodation) => onChange({ requestsAccommodation })}
        label={
          <span className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t('reservations.requestsAccommodation')}
          </span>
        }
      />
      <CheckboxField
        id="requestsBus"
        checked={values.requestsBus}
        disabled={locked}
        onChange={(requestsBus) => onChange({ requestsBus })}
        label={
          <span className="flex items-center gap-2">
            <Bus className="size-4 shrink-0 text-teal-600" aria-hidden />
            {t('reservations.requestsBus')}
          </span>
        }
      />
    </div>
  )
}

export function OptionalInfoHint() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-teal-100 bg-gradient-to-l from-mint-50 via-white to-teal-50 px-3 py-2.5 shadow-[0_6px_16px_rgba(20,40,40,0.04)]">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
        <HeartHandshake className="size-3.5" aria-hidden />
      </span>
      <p className="text-[11px] leading-5 text-ink-600">{t('reservations.optionalHint')}</p>
    </div>
  )
}

export function OccasionStayHint() {
  const { t } = useTranslation()
  const year = currentPersianYear()
  const settings = useQuery({
    queryKey: ['reception-settings', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${year}`)
      return data
    },
  })
  const prophetDate = settings.data?.prophetDemiseDate
  const imamDate = settings.data?.imamRezaMartyrdomDate
  if (!prophetDate && !imamDate) return null

  return (
    <aside
      className="relative overflow-hidden rounded-[22px] border border-gold-100 bg-gradient-to-b from-gold-50 via-white to-cream-50 p-4 shadow-[0_12px_28px_rgba(232,184,58,0.14)]"
      role="note"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold-400 via-gold-500 to-teal-400"
        aria-hidden
      />
      <div className="flex items-start gap-3 pt-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
          <MoonStar className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-semibold text-ink-900">{t('reservations.occasionStayTitle')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {prophetDate ? (
              <OccasionDateChip
                label={t('reservations.occasionProphetLabel')}
                value={prophetDate}
              />
            ) : null}
            {imamDate ? (
              <OccasionDateChip
                label={t('reservations.occasionImamRezaLabel')}
                value={imamDate}
              />
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}

function OccasionDateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold-100 bg-white/90 px-3 py-2.5 shadow-[0_4px_12px_rgba(196,146,26,0.06)]">
      <p className="text-[11px] leading-5 text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">
        <DateText value={value} />
      </p>
      <HijriDateText value={value} />
    </div>
  )
}

export function ReservationDateFields({
  values,
  onChange,
  locked,
  showOccasionHint = true,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  locked?: boolean
  showOccasionHint?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <DateValueField
        id="walkingStartDate"
        icon={Footprints}
        label={t('reservations.walkingStartDate')}
        value={values.walkingStartDate}
        locked={locked}
        onChange={(walkingStartDate) => onChange({ walkingStartDate })}
      />
      <div className="grid grid-cols-2 gap-4">
        <DateValueField
          id="stayStartDate"
          icon={Calendar}
          label={t('reservations.stayStartDate')}
          value={values.stayStartDate}
          locked={locked}
          required
          onChange={(stayStartDate) => onChange({ stayStartDate })}
        />
        <DateValueField
          id="stayEndDate"
          icon={Calendar}
          label={t('reservations.stayEndDate')}
          value={values.stayEndDate}
          locked={locked}
          required
          onChange={(stayEndDate) => onChange({ stayEndDate })}
        />
      </div>
      {showOccasionHint ? <OccasionStayHint /> : null}
    </div>
  )
}

export function ReservationOptionalGeoFields({
  values,
  onChange,
  locked,
  iranId,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  locked?: boolean
  iranId: string
}) {
  const { t } = useTranslation()
  const nameOf = useGeoName()

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', iranId],
    enabled: Boolean(iranId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId: iranId, activeOnly: true },
      })
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', values.provinceId],
    enabled: Boolean(values.provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId: values.provinceId, activeOnly: true },
      })
      return data
    },
  })

  const routes = useQuery({
    queryKey: ['walking-routes', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: { pageSize: 100 },
      })
      return data.items
    },
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={Building2} label={t('reservations.province')}>
          <SearchSelect
            value={values.provinceId}
            onChange={(provinceId) => onChange({ provinceId, originCityId: '' })}
            options={[
              { value: '', label: t('reservations.optionalUnspecified') },
              ...(provinces.data ?? []).map((item) => ({
                value: item.id,
                label: nameOf(item),
              })),
            ]}
            placeholder={t('reservations.province')}
            disabled={locked}
          />
        </FormField>
        <FormField icon={MapPin} label={t('reservations.originCity')}>
          <SearchSelect
            value={values.originCityId}
            onChange={(originCityId) => onChange({ originCityId })}
            options={[
              { value: '', label: t('reservations.optionalUnspecified') },
              ...(cities.data ?? []).map((item) => ({
                value: item.id,
                label: nameOf(item),
              })),
            ]}
            placeholder={t('reservations.originCity')}
            disabled={locked || !values.provinceId}
          />
        </FormField>
      </div>
      <FormField icon={Route} label={t('reservations.walkingRoute')}>
        <SearchSelect
          value={values.walkingRouteId}
          onChange={(walkingRouteId) => onChange({ walkingRouteId })}
          options={[
            { value: '', label: t('reservations.walkingRouteNone') },
            ...(routes.data ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          ]}
          placeholder={t('reservations.walkingRoute')}
          disabled={locked}
        />
      </FormField>
    </div>
  )
}

export function ReservationTravelPartyField({
  values,
  onChange,
  type,
  locked,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  type: PartyKind
  locked?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const [draft, setDraft] = useState<PartyDraft>(() => emptyPartyDraft(user))
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()
  const selectedId = type === 'CARAVAN' ? values.caravanId : values.groupId
  const needsCity = !user?.cityId

  async function createParty() {
    const error = partyDraftError(draft, type, t, locale, needsCity)
    if (error) {
      toast.error(error)
      return
    }
    setCreating(true)
    try {
      const created = await createReservationParty(type, draft)
      onChange({
        caravanId: type === 'CARAVAN' ? created.id : '',
        groupId: type === 'GROUP' ? created.id : '',
        maleCount: String(created.maleCount),
        femaleCount: String(created.femaleCount),
      })
      setDraft(emptyPartyDraft(user))
      await queryClient.invalidateQueries({
        queryKey: type === 'CARAVAN' ? ['caravans', 'mine', 'lookup'] : ['groups', 'mine', 'lookup'],
      })
      toast.success(t(type === 'CARAVAN' ? 'caravans.created' : 'groups.created'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setCreating(false)
    }
  }

  return (
    <ReservationPartyFields
      type={type}
      selectedId={selectedId}
      locked={locked}
      draft={draft}
      onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      onSelect={(item) =>
        onChange({
          caravanId: type === 'CARAVAN' ? item.id : '',
          groupId: type === 'GROUP' ? item.id : '',
          maleCount: String(item.maleCount),
          femaleCount: String(item.femaleCount),
        })
      }
      showCreateAction={!locked}
      creating={creating}
      onCreate={() => {
        void createParty()
      }}
    />
  )
}

function DateValueField({
  id,
  icon: Icon,
  label,
  value,
  locked,
  required,
  minDate,
  maxDate,
  onChange,
}: {
  id: string
  icon: typeof Calendar
  label: string
  value: string
  locked?: boolean
  required?: boolean
  minDate?: string
  maxDate?: string
  onChange: (value: string) => void
}) {
  return (
    <FormField icon={Icon} label={required ? `${label} *` : label} htmlFor={id}>
      {locked ? (
        <div className="space-y-1.5">
          <p className="text-sm text-ink-800">{value ? <DateText value={value} /> : '—'}</p>
          <HijriDateText value={value} />
        </div>
      ) : (
        <PersianDateField
          id={id}
          value={value}
          minDate={minDate}
          maxDate={maxDate}
          showHijri
          onChange={(next) => onChange(next ?? '')}
        />
      )}
    </FormField>
  )
}
