import {
  Building2,
  Check,
  ChevronDown,
  Footprints,
  MapPin,
  Mars,
  Plus,
  Route,
  Users,
  Venus,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { Button, FormField, fieldClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isCaravanManager, isPilgrim } from '../../lib/roles'
import type {
  Caravan,
  City,
  Country,
  Group,
  Paginated,
  Province,
  WalkingRoute,
} from '../../types/app'
import {
  CaravanManagerPicker,
  type CaravanManagerChoice,
} from '../caravans/CaravanManagerPicker'

const partyCardHoverClass =
  'hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_18px_40px_rgba(46,189,182,0.28),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.35)]'

export type PartyKind = 'GROUP' | 'CARAVAN'

export type PartyDraft = {
  name: string
  provinceId: string
  cityId: string
  walkingRouteId: string
  managerUserId: string
}

export type SelectedParty = {
  id: string
}

/** زائر یا مدیر کاروان: خودش مدیر است؛ در غیر این صورت باید مدیر انتخاب شود. */
export function shouldPickCaravanManager(
  user: { roles?: { code: string }[] } | null | undefined,
) {
  return !(isPilgrim(user) || isCaravanManager(user))
}

export function emptyPartyDraft(user?: {
  id?: string
  provinceId?: string | null
  cityId?: string | null
  roles?: { code: string }[]
} | null): PartyDraft {
  const pickManager = shouldPickCaravanManager(user)
  return {
    name: '',
    provinceId: user?.provinceId ?? '',
    cityId: user?.cityId ?? '',
    walkingRouteId: '',
    managerUserId: pickManager ? '' : (user?.id ?? ''),
  }
}

export function partyDraftError(
  draft: PartyDraft,
  type: PartyKind,
  t: TFunction,
  needsCity: boolean,
) {
  if (draft.name.trim().length < 2) {
    return t('reservations.partyNameRequired')
  }
  if (needsCity && !draft.cityId) {
    return t('reservations.partyCityRequired')
  }
  if (type === 'CARAVAN' && !draft.managerUserId) {
    return t('caravans.managerRequired')
  }
  return null
}

export async function createReservationParty(type: PartyKind, draft: PartyDraft) {
  const payload: {
    name: string
    maleCount: number
    femaleCount: number
    cityId?: string
    walkingRouteId?: string | null
    managerUserId?: string
  } = {
    name: draft.name.trim(),
    maleCount: 0,
    femaleCount: 0,
    cityId: draft.cityId || undefined,
    walkingRouteId: draft.walkingRouteId || null,
  }
  if (draft.managerUserId) {
    payload.managerUserId = draft.managerUserId
  }
  const url = type === 'CARAVAN' ? '/caravans' : '/groups'
  const { data } = await api.post<Group | Caravan>(url, payload)
  return { id: data.id }
}

type PartyItem = {
  id: string
  name: string
  maleCount: number
  femaleCount: number
  totalCount: number
  city?: Group['city']
}

export type PartyItemSnapshot = PartyItem

export function ReservationPartyFields({
  type,
  selectedId,
  onSelect,
  onAdvance,
  locked,
  draft,
  onDraftChange,
  showCreateAction,
  creating,
  onCreate,
  subjectUser,
  hideExistingParties,
  knownSelected,
}: {
  type: PartyKind
  selectedId: string
  onSelect: (item: SelectedParty) => void
  onAdvance?: () => void
  locked?: boolean
  draft: PartyDraft
  onDraftChange: (patch: Partial<PartyDraft>) => void
  showCreateAction?: boolean
  creating?: boolean
  onCreate?: () => void
  /** When creating on behalf of someone, use their roles / identity for manager defaults. */
  subjectUser?: {
    id?: string
    fullName?: string
    nationalId?: string | null
    phone?: string | null
    countryId?: string | null
    provinceId?: string | null
    cityId?: string | null
    roles?: { code: string }[]
  } | null
  /** Skip «my caravans/groups» list (admin on-behalf flow). */
  hideExistingParties?: boolean
  /** Snapshot from reservation when the party is not in «mine» list. */
  knownSelected?: PartyItemSnapshot | null
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const { user } = useAuth()
  const partySubject = subjectUser ?? user
  const isCaravan = type === 'CARAVAN'
  const pickManager = isCaravan && shouldPickCaravanManager(partySubject)
  const [managerChoice, setManagerChoice] = useState<CaravanManagerChoice | null>(null)

  const mine = useQuery({
    queryKey: isCaravan ? ['caravans', 'mine', 'lookup'] : ['groups', 'mine', 'lookup'],
    enabled: !hideExistingParties,
    queryFn: async () => {
      const path = isCaravan ? '/caravans/mine' : '/groups/mine'
      const { data } = await api.get<Paginated<PartyItem>>(path, {
        params: { pageSize: 100 },
      })
      return data.items
    },
  })

  const items = hideExistingParties ? [] : (mine.data ?? [])
  const fromList = items.find((item) => item.id === selectedId)
  const known =
    knownSelected && knownSelected.id === selectedId ? knownSelected : null

  const selectedLookup = useQuery({
    queryKey: [isCaravan ? 'caravans' : 'groups', selectedId, 'party-card'],
    enabled: Boolean(selectedId) && !fromList && !known,
    queryFn: async () => {
      const path = isCaravan ? `/caravans/${selectedId}` : `/groups/${selectedId}`
      const { data } = await api.get<PartyItem>(path)
      return {
        id: data.id,
        name: data.name,
        maleCount: data.maleCount ?? 0,
        femaleCount: data.femaleCount ?? 0,
        totalCount: data.totalCount ?? (data.maleCount ?? 0) + (data.femaleCount ?? 0),
        city: data.city,
      } satisfies PartyItem
    },
  })

  const selected = fromList ?? known ?? selectedLookup.data ?? null
  const [createOpen, setCreateOpen] = useState(() => Boolean(hideExistingParties))
  const createPanelId = useId()
  const PartyIcon = isCaravan ? Footprints : Users

  useEffect(() => {
    if (!draft.managerUserId) setManagerChoice(null)
  }, [draft.managerUserId])

  useEffect(() => {
    if (hideExistingParties || (mine.isSuccess && items.length === 0)) {
      setCreateOpen(true)
    }
  }, [hideExistingParties, mine.isSuccess, items.length])

  function choose(item: PartyItem) {
    setCreateOpen(false)
    onSelect({ id: item.id })
    onAdvance?.()
  }

  return (
    <div className="space-y-5">
      {selected && !fromList ? (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-ink-800">
            {t(isCaravan ? 'reservations.selectedCaravan' : 'reservations.selectedGroup')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PartyChoiceCard
              item={selected}
              selected
              disabled={locked}
              isCaravan={isCaravan}
              cityLabel={selected.city ? nameOf(selected.city) : ''}
              locale={locale}
              onSelect={() => choose(selected)}
            />
          </div>
        </section>
      ) : null}

      {items.length ? (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-ink-800">
            {t(isCaravan ? 'reservations.selectMyCaravan' : 'reservations.selectMyGroup')}
          </p>
          <div className="flex items-start gap-3 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-4 py-3 shadow-[0_8px_20px_rgba(46,189,182,0.12)]">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
              <PartyIcon className="size-4" aria-hidden />
            </span>
            <p className="text-sm font-medium leading-7 text-ink-800">
              {t(isCaravan ? 'reservations.preferExistingCaravan' : 'reservations.preferExistingGroup')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <PartyChoiceCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                disabled={locked}
                isCaravan={isCaravan}
                cityLabel={item.city ? nameOf(item.city) : ''}
                locale={locale}
                onSelect={() => choose(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {locked ? (
        selected || !selectedId ? null : (
          <p className="text-sm text-ink-600">{t('reservations.partySelectedReadonly')}</p>
        )
      ) : (
        <section
          className={`rounded-[22px] border border-dashed border-teal-200 bg-gradient-to-b from-teal-50/70 to-white ${
            createOpen ? '' : 'overflow-hidden'
          }`}
        >
          <button
            type="button"
            aria-expanded={createOpen}
            aria-controls={createPanelId}
            data-enter-ignore=""
            onClick={() => setCreateOpen((open) => !open)}
            className={`flex w-full items-center gap-2.5 p-4 text-start transition hover:bg-teal-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:px-5 sm:py-4 ${
              createOpen ? 'rounded-t-[21px]' : ''
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
              <Plus className="size-4" aria-hidden />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold text-ink-900">
              {t(isCaravan ? 'reservations.preferNewCaravan' : 'reservations.preferNewGroup')}
            </p>
            <ChevronDown
              className={`size-5 shrink-0 text-ink-400 transition ${createOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          <div
            id={createPanelId}
            hidden={!createOpen}
            className="space-y-4 border-t border-teal-100 px-4 pb-4 pt-4 sm:px-5 sm:pb-5"
          >
            <FormField
              icon={PartyIcon}
              label={t(isCaravan ? 'caravans.name' : 'groups.name')}
              htmlFor="partyName"
            >
              <input
                id="partyName"
                className={fieldClassName}
                value={draft.name}
                onChange={(event) => onDraftChange({ name: event.target.value })}
                placeholder={t(isCaravan ? 'caravans.name' : 'groups.name')}
              />
            </FormField>
            <PartyCityFields
              draft={draft}
              onDraftChange={onDraftChange}
              countryId={managerChoice?.countryId || partySubject?.countryId}
            />
            {pickManager ? (
              <CaravanManagerPicker
                value={managerChoice}
                defaultNationalId={
                  partySubject && 'nationalId' in partySubject
                    ? partySubject.nationalId ?? undefined
                    : undefined
                }
                onChange={(next) => {
                  setManagerChoice(next)
                  onDraftChange({
                    managerUserId: next?.id ?? '',
                    ...(next?.provinceId
                      ? { provinceId: next.provinceId, cityId: next.cityId ?? '' }
                      : {}),
                  })
                }}
              />
            ) : null}
            {showCreateAction ? (
              <Button type="button" variant="soft" disabled={creating} onClick={onCreate}>
                <Plus className="size-4" aria-hidden />
                {t(isCaravan ? 'reservations.createCaravan' : 'reservations.createGroup')}
              </Button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}

function PartyChoiceCard({
  item,
  selected,
  disabled,
  isCaravan,
  cityLabel,
  locale,
  onSelect,
}: {
  item: PartyItem
  selected: boolean
  disabled?: boolean
  isCaravan: boolean
  cityLabel: string
  locale: string
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const Icon = isCaravan ? Footprints : Users
  const n = (value: number) => formatNumber(value, locale)
  return (
    <button
      type="button"
      disabled={disabled}
      data-enter-ignore=""
      onClick={onSelect}
      className={`w-full rounded-[22px] border p-4 text-start transition-[box-shadow,transform,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
        selected
          ? 'border-teal-500 bg-teal-50 shadow-[0_16px_36px_rgba(46,189,182,0.24),0_0_0_4px_rgba(255,255,255,0.95),0_0_0_7px_rgba(46,189,182,0.32)]'
          : 'border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]'
      } ${disabled ? 'cursor-not-allowed' : `cursor-pointer ${partyCardHoverClass}`}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
            selected ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600'
          }`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold text-ink-900">{item.name}</p>
            {selected ? <Check className="size-4 shrink-0 text-teal-700" aria-hidden /> : null}
          </div>
          {cityLabel ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {cityLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <PartyCountChip icon={Mars} label={t('reservations.male')} value={n(item.maleCount)} tone="teal" />
        <PartyCountChip icon={Venus} label={t('reservations.female')} value={n(item.femaleCount)} tone="mint" />
        <PartyCountChip icon={Users} label={t('reservations.totalCount')} value={n(item.totalCount)} tone="ink" />
      </div>
    </button>
  )
}

function PartyCountChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: string
  tone: 'teal' | 'mint' | 'ink'
}) {
  const wrap =
    tone === 'teal'
      ? 'bg-teal-50 text-teal-800'
      : tone === 'mint'
        ? 'bg-mint-50 text-mint-700'
        : 'bg-cream-50 text-ink-700'
  return (
    <div className={`rounded-xl px-2 py-1.5 text-center ${wrap}`}>
      <p className="flex items-center justify-center gap-1 text-[10px] font-medium">
        <Icon className="size-3" aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  )
}

function PartyCityFields({
  draft,
  onDraftChange,
  countryId,
}: {
  draft: PartyDraft
  onDraftChange: (patch: Partial<PartyDraft>) => void
  countryId?: string | null
}) {
  const { t } = useTranslation()
  const nameOf = useGeoName()

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''
  const selectedCountryId = countryId || iranId

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
    queryKey: ['cities', 'lookup', draft.provinceId],
    enabled: Boolean(draft.provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId: draft.provinceId, activeOnly: true },
      })
      return data
    },
  })

  const routes = useQuery({
    queryKey: ['walking-routes', 'lookup', selectedCountryId],
    queryFn: async () => {
      const { data } = await api.get<Paginated<WalkingRoute>>('/walking-routes', {
        params: {
          pageSize: 100,
          originCountryId: selectedCountryId || undefined,
        },
      })
      return data.items
    },
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={Building2} label={t('reservations.province')}>
          <SearchSelect
            value={draft.provinceId}
            onChange={(provinceId) => onDraftChange({ provinceId, cityId: '' })}
            options={(provinces.data ?? []).map((item) => ({
              value: item.id,
              label: nameOf(item),
            }))}
            placeholder={t('reservations.province')}
          />
        </FormField>
        <FormField icon={MapPin} label={t('geo.city')}>
          <SearchSelect
            value={draft.cityId}
            onChange={(cityId) => onDraftChange({ cityId })}
            options={(cities.data ?? []).map((item) => ({
              value: item.id,
              label: nameOf(item),
            }))}
            placeholder={t('geo.city')}
            disabled={!draft.provinceId}
          />
        </FormField>
      </div>
      <FormField icon={Route} label={t('reservations.walkingRoute')}>
        <SearchSelect
          value={draft.walkingRouteId}
          onChange={(walkingRouteId) => onDraftChange({ walkingRouteId })}
          options={[
            { value: '', label: t('reservations.walkingRouteNone') },
            ...(routes.data ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          ]}
          placeholder={t('reservations.walkingRoute')}
        />
      </FormField>
    </div>
  )
}
