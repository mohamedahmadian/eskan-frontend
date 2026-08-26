import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Fence,
  Globe2,
  Hash,
  MapPin,
  Milestone,
  Plus,
  Route,
  Trash2,
  Type,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { SearchSelect } from '../../components/ui/SearchSelect'
import { formatNumber } from '../../lib/datetime'
import { getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, Country, EntryBorder, WalkingRoute } from '../../types/app'
import { WalkingRouteTabNav, type WalkingRouteTab } from './WalkingRouteTabs'

export type WalkingRoutePayload = {
  name: string
  distanceToMashhadKm: number
  entryBorderId: string
  originCountryIds: string[]
  stages: {
    cityId: string
    stageNumber: number
    distanceToNextKm: number | null
    distanceToPreviousKm: number | null
    distanceToMashhadKm: number | null
    description: string | null
  }[]
}

type StageDraft = {
  key: string
  cityId: string
  distanceToNextKm: string
  distanceToPreviousKm: string
  distanceToMashhadKm: string
  description: string
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
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
    cityId: '',
    distanceToNextKm: '',
    distanceToPreviousKm: '',
    distanceToMashhadKm: '',
    description: '',
  }
}

function citySelectOptions(
  cities: City[],
  name: (item: { nameFa: string; nameEn: string }) => string,
  emptyLabel: string,
) {
  return [
    { value: '', label: emptyLabel },
    ...cities.map((city) => ({
      value: city.id,
      label: `${name(city)} — ${name(city.province)}`,
    })),
  ]
}

export function WalkingRouteForm({
  initial,
  countries,
  iranCities,
  entryBorders,
  onSubmit,
}: {
  initial?: WalkingRoute
  countries: Country[]
  iranCities: City[]
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
          cityId: stage.cityId,
          distanceToNextKm: stage.distanceToNextKm != null ? String(stage.distanceToNextKm) : '',
          distanceToPreviousKm:
            stage.distanceToPreviousKm != null ? String(stage.distanceToPreviousKm) : '',
          distanceToMashhadKm:
            stage.distanceToMashhadKm != null ? String(stage.distanceToMashhadKm) : '',
          description: stage.description ?? '',
        }))
      : [emptyStage()],
  )
  const [saving, setSaving] = useState(false)

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

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!originCountryIds.length) {
      toast.error(t('walkingRoutes.originCountriesRequired'))
      setTab('originCountries')
      return
    }
    const filledStages = stages.filter((stage) => stage.cityId)
    if (!filledStages.length) {
      toast.error(t('walkingRoutes.stagesRequired'))
      setTab('stages')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        distanceToMashhadKm: toNumber(distanceToMashhadKm),
        entryBorderId,
        originCountryIds,
        stages: filledStages.map((stage, index) => ({
          cityId: stage.cityId,
          stageNumber: index + 1,
          distanceToNextKm: toOptionalNumber(stage.distanceToNextKm),
          distanceToPreviousKm: toOptionalNumber(stage.distanceToPreviousKm),
          distanceToMashhadKm: toOptionalNumber(stage.distanceToMashhadKm),
          description: emptyToNull(stage.description),
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
                  required
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
              {stages.map((stage, index) => (
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
                      icon={MapPin}
                      label={t('walkingRoutes.city')}
                      htmlFor={`stage-city-${stage.key}`}
                    >
                      <SearchSelect
                        id={`stage-city-${stage.key}`}
                        value={stage.cityId}
                        required
                        placeholder={t('walkingRoutes.selectCity')}
                        onChange={(cityId) => updateStage(index, { cityId })}
                        options={citySelectOptions(
                          iranCities,
                          geoName,
                          t('walkingRoutes.selectCity'),
                        )}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
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
                    <FormField
                      icon={Milestone}
                      label={t('walkingRoutes.stageDistanceToMashhadKm')}
                      htmlFor={`stage-mashhad-${stage.key}`}
                    >
                      <input
                        id={`stage-mashhad-${stage.key}`}
                        className={fieldClassName}
                        type="number"
                        min={0}
                        step="0.01"
                        value={stage.distanceToMashhadKm}
                        onChange={(e) =>
                          updateStage(index, { distanceToMashhadKm: e.target.value })
                        }
                      />
                    </FormField>
                  </div>
                  <FormField
                    icon={AlignLeft}
                    label={t('walkingRoutes.description')}
                    htmlFor={`stage-desc-${stage.key}`}
                  >
                    <textarea
                      id={`stage-desc-${stage.key}`}
                      className={fieldClassName}
                      rows={3}
                      value={stage.description}
                      onChange={(e) => updateStage(index, { description: e.target.value })}
                    />
                  </FormField>
                </article>
              ))}
              <Button
                type="button"
                variant="soft"
                onClick={() => setStages([...stages, emptyStage()])}
              >
                <Plus className="size-4" aria-hidden />
                {t('walkingRoutes.addStage')}
              </Button>
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
