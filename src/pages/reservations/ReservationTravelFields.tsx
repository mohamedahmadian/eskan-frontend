import {
  Building2,
  Calendar,
  Check,
  Footprints,
  HeartHandshake,
  MapPin,
  Mars,
  Route,
  UserRound,
  Users,
  Venus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { DateText } from '../../components/ui/DateText'
import { FormField, fieldClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api } from '../../lib/api'
import { addDaysIso, formatNumber, todayIsoDate } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { canAccessMyCaravans } from '../../lib/roles'
import type { Caravan, City, Paginated, Province, ReservationType, WalkingRoute } from '../../types/app'
import { GROUP_MAX_SIZE } from './reservation-steps'

export function travelDatesError(
  values: Pick<TravelValues, 'walkingStartDate' | 'stayStartDate' | 'stayEndDate'>,
  t: (key: string) => string,
  existingWalkingStart?: string | null,
) {
  if (!values.stayStartDate) {
    return t('reservations.stayStartRequired')
  }
  if (!values.stayEndDate) {
    return t('reservations.stayEndRequired')
  }
  if (
    values.walkingStartDate &&
    values.walkingStartDate < todayIsoDate() &&
    values.walkingStartDate !== existingWalkingStart
  ) {
    return t('reservations.walkingDateInPast')
  }
  if (values.stayStartDate && values.walkingStartDate && values.stayStartDate <= values.walkingStartDate) {
    return t('reservations.walkingRangeInvalid')
  }
  if (values.stayEndDate && values.stayStartDate && values.stayEndDate < values.stayStartDate) {
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
      {type === 'CARAVAN' ? (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-800">{t('reservations.caravan')}</h3>
          <ReservationCaravanField values={values} onChange={onChange} locked={locked} />
        </section>
      ) : null}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-800">{t('reservations.createSteps.dates')}</h3>
        <ReservationDateFields values={values} onChange={onChange} locked={locked} />
      </section>
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-800">{t('reservations.createSteps.optional')}</h3>
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

export function ReservationCountFields({
  values,
  onChange,
  type,
  locked,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  type: ReservationType
  locked?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const male = Number(values.maleCount) || 0
  const female = Number(values.femaleCount) || 0
  const individualMale = type === 'INDIVIDUAL' && male === 1 && female === 0
  const individualFemale = type === 'INDIVIDUAL' && female === 1 && male === 0

  if (type === 'INDIVIDUAL') {
    return (
      <FormField icon={UserRound} label={t('reservations.selectMyGender')}>
        <div className="relative">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('reservations.selectMyGender')}>
            <GenderChoiceCard
              selected={individualMale}
              disabled={locked}
              icon={Mars}
              label={t('reservations.iAmMale')}
              tone="teal"
              onSelect={() => onChange({ maleCount: '1', femaleCount: '0' })}
            />
            <GenderChoiceCard
              selected={individualFemale}
              disabled={locked}
              icon={Venus}
              label={t('reservations.iAmFemale')}
              tone="mint"
              onSelect={() => onChange({ maleCount: '0', femaleCount: '1' })}
            />
          </div>
          {!locked ? (
            <RequiredHidden value={individualMale || individualFemale ? '1' : ''} />
          ) : null}
        </div>
      </FormField>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={Mars} label={t('reservations.maleCount')} htmlFor="maleCount">
          <input
            id="maleCount"
            type="number"
            min={0}
            max={type === 'GROUP' ? GROUP_MAX_SIZE : undefined}
            className={fieldClassName}
            value={values.maleCount}
            onChange={(event) => onChange({ maleCount: event.target.value })}
            required
            disabled={locked}
          />
        </FormField>
        <FormField icon={Venus} label={t('reservations.femaleCount')} htmlFor="femaleCount">
          <input
            id="femaleCount"
            type="number"
            min={0}
            max={type === 'GROUP' ? GROUP_MAX_SIZE : undefined}
            className={fieldClassName}
            value={values.femaleCount}
            onChange={(event) => onChange({ femaleCount: event.target.value })}
            required
            disabled={locked}
          />
        </FormField>
      </div>
      <p className="rounded-2xl bg-cream-50 px-3 py-2 text-sm text-ink-700">
        {t('reservations.totalCount')}: {formatNumber(male + female, locale)} {t('reservations.people')}
        {type === 'GROUP' ? (
          <span className="ms-2 text-ink-500">
            ({t('reservations.groupMaxHint', { count: formatNumber(GROUP_MAX_SIZE, locale) })})
          </span>
        ) : null}
      </p>
    </>
  )
}

export function ReservationDateFields({
  values,
  onChange,
  locked,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  locked?: boolean
}) {
  const { t } = useTranslation()
  const today = todayIsoDate()
  const stayStartMin = values.walkingStartDate
    ? addDaysIso(values.walkingStartDate, 1)
    : undefined
  const walkingMax = values.stayStartDate
    ? addDaysIso(values.stayStartDate, -1)
    : undefined

  function patchStayStart(stayStartDate: string) {
    const patch: Partial<TravelValues> = { stayStartDate }
    if (stayStartDate) {
      const autoEnd = addDaysIso(stayStartDate, 3)
      const previousAutoEnd = values.stayStartDate
        ? addDaysIso(values.stayStartDate, 3)
        : ''
      if (!values.stayEndDate || values.stayEndDate === previousAutoEnd) {
        patch.stayEndDate = autoEnd
      }
    }
    onChange(patch)
  }

  return (
    <div className="space-y-4">
      <DateValueField
        id="walkingStartDate"
        icon={Footprints}
        label={t('reservations.walkingStartDate')}
        value={values.walkingStartDate}
        locked={locked}
        minDate={today}
        maxDate={walkingMax}
        onChange={(walkingStartDate) => onChange({ walkingStartDate })}
      />
      <DateValueField
        id="stayStartDate"
        icon={Calendar}
        label={t('reservations.stayStartDate')}
        value={values.stayStartDate}
        locked={locked}
        required
        minDate={stayStartMin}
        maxDate={values.stayEndDate || undefined}
        onChange={patchStayStart}
      />
      <DateValueField
        id="stayEndDate"
        icon={Calendar}
        label={t('reservations.stayEndDate')}
        value={values.stayEndDate}
        locked={locked}
        required
        minDate={values.stayStartDate || stayStartMin}
        onChange={(stayEndDate) => onChange({ stayEndDate })}
      />
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

export function ReservationCaravanField({
  values,
  onChange,
  locked,
}: {
  values: TravelValues
  onChange: (patch: Partial<TravelValues>) => void
  locked?: boolean
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canCreateCaravan = canAccessMyCaravans(user)

  const caravans = useQuery({
    queryKey: ['caravans', 'mine', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans/mine', {
        params: { pageSize: 100 },
      })
      return data.items
    },
  })

  return (
    <div className="space-y-2">
      <FormField icon={Users} label={t('reservations.caravan')}>
        <SearchSelect
          value={values.caravanId}
          onChange={(caravanId) => onChange({ caravanId })}
          options={(caravans.data ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          }))}
          placeholder={t('reservations.selectCaravan')}
          required
          disabled={locked}
        />
      </FormField>
      {!locked && canCreateCaravan ? (
        <Link to="/my-caravans/new" className="text-sm text-teal-700 hover:underline">
          {t('reservations.createCaravan')}
        </Link>
      ) : null}
    </div>
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
        <p className="text-sm text-ink-800">{value ? <DateText value={value} /> : '—'}</p>
      ) : (
        <PersianDateField
          id={id}
          value={value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={(next) => onChange(next ?? '')}
        />
      )}
    </FormField>
  )
}

function RequiredHidden({ value }: { value: string }) {
  return (
    <input
      tabIndex={-1}
      required
      value={value}
      onChange={() => undefined}
      aria-hidden
      className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
    />
  )
}

function GenderChoiceCard({
  selected,
  disabled,
  icon: Icon,
  label,
  tone,
  onSelect,
}: {
  selected: boolean
  disabled?: boolean
  icon: typeof Mars
  label: string
  tone: 'teal' | 'mint'
  onSelect: () => void
}) {
  const idle =
    tone === 'teal'
      ? 'border-line bg-white hover:border-teal-200'
      : 'border-line bg-white hover:border-mint-300'
  const active =
    tone === 'teal'
      ? 'border-teal-500 bg-teal-50 shadow-[0_8px_18px_rgba(46,189,182,0.2)]'
      : 'border-mint-400 bg-mint-50 shadow-[0_8px_18px_rgba(95,191,122,0.18)]'
  const iconWrap = tone === 'teal' ? 'bg-teal-500 text-white' : 'bg-mint-500 text-white'

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      data-enter-ignore=""
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-start shadow-[0_4px_12px_rgba(20,40,40,0.04)] transition-[box-shadow,transform,border-color,background-color] duration-200 ${
        selected ? active : idle
      } ${
        disabled
          ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:-translate-y-0.5 hover:border-teal-400'
      }`}
    >
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-xs font-semibold text-ink-900">{label}</span>
      {selected ? (
        <Check
          className={`size-3.5 shrink-0 ${tone === 'teal' ? 'text-teal-700' : 'text-mint-600'}`}
          aria-hidden
        />
      ) : null}
    </button>
  )
}
