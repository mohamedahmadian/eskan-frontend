import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Fence,
  Globe2,
  Hash,
  MapPin,
  MapPinned,
  Milestone,
  Plus,
  Route,
  Trash2,
  Type,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard, FormSectionTitle } from '../../components/ui/FormLayout'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { formatNumber } from '../../lib/datetime'
import { getApiErrorMessage, api } from '../../lib/api'
import { stageCoordinates, useGeoName } from '../../lib/geo'
import {
  emptyStationAmenities,
  type Country,
  type EntryBorder,
  type WalkingRoute,
  type WalkingStation,
} from '../../types/app'
import { WalkingRouteTabNav, type WalkingRouteTab } from './WalkingRouteTabs'

export type WalkingRoutePayload = {
  name: string
  distanceToMashhadKm: number
  entryBorderId: string | null
  originCountryIds: string[]
  stages: {
    walkingStationId: string
    stageNumber: number
    distanceToNextKm: number | null
    distanceToPreviousKm: number | null
  }[]
}

type StageDraft = {
  key: string
  walkingStationId: string
  distanceToNextKm: string
  distanceToPreviousKm: string
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function newStageKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function emptyStage(): StageDraft {
  return {
    key: newStageKey(),
    walkingStationId: '',
    distanceToNextKm: '',
    distanceToPreviousKm: '',
  }
}

export function WalkingRouteForm({
  initial,
  countries,
  entryBorders,
  onSubmit,
}: {
  initial?: WalkingRoute
  countries: Country[]
  entryBorders: EntryBorder[]
  onSubmit: (payload: WalkingRoutePayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const [tab, setTab] = useState<WalkingRouteTab>('general')
  const [name, setName] = useState(initial?.name ?? '')
  const [distanceToMashhadKm, setDistanceToMashhadKm] = useState(
    initial?.distanceToMashhadKm != null ? String(initial.distanceToMashhadKm) : '',
  )
  const [entryBorderId, setEntryBorderId] = useState(initial?.entryBorderId ?? '')
  const [originCountryIds, setOriginCountryIds] = useState<string[]>(
    initial?.originCountries.map((country) => country.id) ?? [],
  )
  const [stages, setStages] = useState<StageDraft[]>(
    initial?.stages.length
      ? initial.stages.map((stage) => ({
          key: stage.id ?? newStageKey(),
          walkingStationId: stage.stationId,
          distanceToNextKm: stage.distanceToNextKm != null ? String(stage.distanceToNextKm) : '',
          distanceToPreviousKm:
            stage.distanceToPreviousKm != null ? String(stage.distanceToPreviousKm) : '',
        }))
      : [emptyStage()],
  )
  const [saving, setSaving] = useState(false)

  const stationsQuery = useQuery({
    queryKey: ['walking-stations', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<WalkingStation[]>('/walking-stations')
      return data
    },
  })
  const stations = useMemo(() => {
    const map = new Map<string, WalkingStation>()
    for (const stage of initial?.stages ?? []) {
      if (!stage.stationId) continue
      map.set(stage.stationId, {
        id: stage.stationId,
        cityId: stage.cityId,
        city: stage.city,
        name: stage.name ?? '',
        latitude: stage.latitude,
        longitude: stage.longitude,
        address: stage.address ?? null,
        neshanAddress: stage.neshanAddress ?? null,
        maleCount: stage.maleCount ?? 0,
        femaleCount: stage.femaleCount ?? 0,
        managerName: stage.managerName,
        managerPhone: stage.managerPhone,
        managerTelegram: stage.managerTelegram,
        managerWhatsapp: stage.managerWhatsapp,
        managerEitaa: stage.managerEitaa,
        distanceToMashhadKm: stage.distanceToMashhadKm,
        description: stage.description,
        hasLaundry: stage.hasLaundry ?? emptyStationAmenities.hasLaundry,
        hasInternet: stage.hasInternet ?? emptyStationAmenities.hasInternet,
        hasPrayerRoom: stage.hasPrayerRoom ?? emptyStationAmenities.hasPrayerRoom,
        hasElevator: stage.hasElevator ?? emptyStationAmenities.hasElevator,
        heatingSystem: stage.heatingSystem ?? null,
        coolingSystem: stage.coolingSystem ?? null,
        parkingCapacity: stage.parkingCapacity ?? null,
        bathroomCount: stage.bathroomCount ?? null,
        toiletCount: stage.toiletCount ?? null,
        areaSqm: stage.areaSqm ?? null,
        routes: [],
        createdAt: '',
        updatedAt: '',
      })
    }
    for (const item of stationsQuery.data ?? []) {
      map.set(item.id, item)
    }
    return [...map.values()]
  }, [initial?.stages, stationsQuery.data])
  const stationById = useMemo(
    () => new Map(stations.map((item) => [item.id, item])),
    [stations],
  )

  function panelClass(id: WalkingRouteTab) {
    return `space-y-4 ${tab === id ? '' : 'hidden'}`
  }

  function updateStage(index: number, patch: Partial<StageDraft>) {
    setStages((current) =>
      current.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)),
    )
  }

  function moveStage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= stages.length) return
    setStages((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  function stationOptions(currentId: string) {
    const taken = new Set(
      stages.map((stage) => stage.walkingStationId).filter((id) => id && id !== currentId),
    )
    return [
      { value: '', label: t('walkingRoutes.selectStation') },
      ...stations
        .filter((item) => !taken.has(item.id))
        .map((item) => ({
          value: item.id,
          label: `${item.name} — ${geoName(item.city)}`,
        })),
    ]
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!originCountryIds.length) {
      toast.error(t('walkingRoutes.originCountriesRequired'))
      setTab('originCountries')
      return
    }
    const filledStages = stages.filter((stage) => stage.walkingStationId)
    if (!filledStages.length) {
      toast.error(t('walkingRoutes.stagesRequired'))
      setTab('stages')
      return
    }
    if (filledStages.length !== stages.length) {
      toast.error(t('walkingRoutes.stationRequired'))
      setTab('stages')
      return
    }
    const ids = filledStages.map((stage) => stage.walkingStationId)
    if (new Set(ids).size !== ids.length) {
      toast.error(t('walkingRoutes.stationDuplicate'))
      setTab('stages')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        distanceToMashhadKm: toNumber(distanceToMashhadKm),
        entryBorderId: entryBorderId || null,
        originCountryIds,
        stages: filledStages.map((stage, index) => ({
          walkingStationId: stage.walkingStationId,
          stageNumber: index + 1,
          distanceToNextKm: toOptionalNumber(stage.distanceToNextKm),
          distanceToPreviousKm: toOptionalNumber(stage.distanceToPreviousKm),
        })),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Route}
      title={initial ? initial.name || t('walkingRoutes.edit') : t('walkingRoutes.create')}
      subtitle={initial ? undefined : t('walkingRoutes.createSubtitle')}
    >
      <div className="space-y-4 p-5 sm:p-6">
        <WalkingRouteTabNav tab={tab} onChange={setTab} />
        <AppForm
          onSubmit={submit}
          onInvalid={(event) => {
            const panel = (event.target as HTMLElement | null)?.closest('[data-tab]')
            const next = panel?.getAttribute('data-tab') as WalkingRouteTab | null
            if (next) setTab(next)
          }}
          className="space-y-4"
        >
          <div data-tab="general" className={panelClass('general')}>
            <FormField icon={Type} label={t('walkingRoutes.name')} htmlFor="route-name">
              <input
                id="route-name"
                className={fieldClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={ArrowUpDown}
                label={t('walkingRoutes.distanceToMashhadKm')}
                htmlFor="route-distance"
              >
                <input
                  id="route-distance"
                  className={fieldClassName}
                  type="number"
                  min={0}
                  step="0.01"
                  value={distanceToMashhadKm}
                  onChange={(e) => setDistanceToMashhadKm(e.target.value)}
                  required
                />
              </FormField>
              <FormField icon={Fence} label={t('walkingRoutes.entryBorder')} htmlFor="entry-border">
                <SearchSelect
                  id="entry-border"
                  value={entryBorderId}
                  placeholder={t('walkingRoutes.selectEntryBorder')}
                  onChange={setEntryBorderId}
                  options={[
                    { value: '', label: t('walkingRoutes.selectEntryBorder') },
                    ...entryBorders.map((border) => ({
                      value: border.id,
                      label: `${border.name} — ${geoName(border.city)}`,
                    })),
                  ]}
                />
              </FormField>
            </div>
          </div>

          <div data-tab="originCountries" className={panelClass('originCountries')}>
            <FormField icon={Globe2} label={t('walkingRoutes.originCountries')}>
              <div className="grid gap-2 sm:grid-cols-2">
                {countries.map((country) => {
                  const checked = originCountryIds.includes(country.id)
                  return (
                    <CheckboxField
                      key={country.id}
                      checked={checked}
                      onChange={(on) => {
                        setOriginCountryIds((current) =>
                          on
                            ? [...current, country.id]
                            : current.filter((id) => id !== country.id),
                        )
                      }}
                      label={geoName(country)}
                    />
                  )
                })}
              </div>
            </FormField>
          </div>

          <div data-tab="stages" className={panelClass('stages')}>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const station = stationById.get(stage.walkingStationId)
                const coords = station ? stageCoordinates(station) : null
                return (
                  <article
                    key={stage.key}
                    className="space-y-4 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/80 to-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <FormSectionTitle icon={Milestone} className="mb-0">
                        {t('walkingRoutes.stage')} {formatNumber(index + 1, locale)}
                      </FormSectionTitle>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          icon
                          disabled={index === 0}
                          onClick={() => moveStage(index, -1)}
                          title={t('walkingRoutes.moveUp')}
                          aria-label={t('walkingRoutes.moveUp')}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          icon
                          disabled={index === stages.length - 1}
                          onClick={() => moveStage(index, 1)}
                          title={t('walkingRoutes.moveDown')}
                          aria-label={t('walkingRoutes.moveDown')}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        {stages.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            icon
                            onClick={() =>
                              setStages((current) => current.filter((_, i) => i !== index))
                            }
                            title={t('walkingRoutes.removeStage')}
                            aria-label={t('walkingRoutes.removeStage')}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        icon={Hash}
                        label={t('walkingRoutes.stage')}
                        htmlFor={`stage-number-${stage.key}`}
                      >
                        <input
                          id={`stage-number-${stage.key}`}
                          className={fieldClassName}
                          value={formatNumber(index + 1, locale)}
                          readOnly
                        />
                      </FormField>
                      <FormField
                        icon={Milestone}
                        label={t('walkingRoutes.stationName')}
                        htmlFor={`stage-station-${stage.key}`}
                      >
                        <SearchSelect
                          id={`stage-station-${stage.key}`}
                          value={stage.walkingStationId}
                          required
                          placeholder={t('walkingRoutes.selectStation')}
                          onChange={(walkingStationId) =>
                            updateStage(index, { walkingStationId })
                          }
                          options={stationOptions(stage.walkingStationId)}
                        />
                      </FormField>
                    </div>
                    {station ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <p className="text-sm text-ink-600">
                          <MapPin className="me-1 inline size-4 text-teal-600" aria-hidden />
                          {geoName(station.city)}
                          {station.city.province ? ` — ${geoName(station.city.province)}` : ''}
                        </p>
                        {station.distanceToMashhadKm != null ? (
                          <p className="text-sm text-ink-600">
                            {t('walkingRoutes.stageDistanceToMashhadKm')}:{' '}
                            {formatNumber(station.distanceToMashhadKm, locale)} {t('walkingRoutes.km')}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {coords ? (
                      <FormField icon={MapPinned} label={t('walkingRoutes.location')}>
                        <OsmMapPicker
                          latitude={String(coords.lat)}
                          longitude={String(coords.lng)}
                          active={tab === 'stages'}
                          onChange={() => undefined}
                          readOnly
                        />
                      </FormField>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        icon={ArrowUpDown}
                        label={t('walkingRoutes.distanceToPreviousKm')}
                        htmlFor={`stage-prev-${stage.key}`}
                      >
                        <input
                          id={`stage-prev-${stage.key}`}
                          className={fieldClassName}
                          type="number"
                          min={0}
                          step="0.01"
                          value={stage.distanceToPreviousKm}
                          onChange={(e) =>
                            updateStage(index, { distanceToPreviousKm: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField
                        icon={ArrowUpDown}
                        label={t('walkingRoutes.distanceToNextKm')}
                        htmlFor={`stage-next-${stage.key}`}
                      >
                        <input
                          id={`stage-next-${stage.key}`}
                          className={fieldClassName}
                          type="number"
                          min={0}
                          step="0.01"
                          value={stage.distanceToNextKm}
                          onChange={(e) => updateStage(index, { distanceToNextKm: e.target.value })}
                        />
                      </FormField>
                    </div>
                  </article>
                )
              })}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => setStages([...stages, emptyStage()])}
                >
                  <Plus className="size-4" aria-hidden />
                  {t('walkingRoutes.addStage')}
                </Button>
                <Link to="/base-info/walking-stations/new">
                  <Button type="button" variant="ghost">
                    <Milestone className="size-4" aria-hidden />
                    {t('walkingRoutes.createStation')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <FormActions
            submitLabel={t('walkingRoutes.save')}
            cancelLabel={t('walkingRoutes.cancel')}
            submitting={saving}
            onCancel={() => history.back()}
          />
        </AppForm>
      </div>
    </FormCard>
  )
}
