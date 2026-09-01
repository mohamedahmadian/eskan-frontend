import {
  AlignLeft,
  ArrowUpDown,
  Fence,
  Globe2,
  MapPin,
  MapPinned,
  MessageCircle,
  Milestone,
  Phone,
  Route,
  Share2,
  Type,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormMetaChip,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { stageCoordinates, useGeoName } from '../../lib/geo'
import type { WalkingRoute, WalkingRouteStage } from '../../types/app'
import { StationNearbyPlaces } from './StationNearbyPlaces'
import { WalkingRouteStationsModal } from './WalkingRouteStationsModal'
import { WalkingRouteTabNav, type WalkingRouteTab } from './WalkingRouteTabs'

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function WalkingRouteDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const [tab, setTab] = useState<WalkingRouteTab>('general')
  const [stationsOpen, setStationsOpen] = useState(false)
  const query = useQuery({
    queryKey: ['walking-route', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<WalkingRoute>(`/walking-routes/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const km = (value: number | null | undefined) =>
    value == null ? '' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`
  const n = (value: number) => formatNumber(value, locale)
  const border = item.entryBorder
  const borderLabel = border ? `${border.name} — ${name(border.city)}` : '—'

  function panelClass(id: WalkingRouteTab) {
    return `space-y-4 ${tab === id ? '' : 'hidden'}`
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('walkingRoutes.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Route} />}
      />
      <FormCard
        icon={Route}
        title={item.name}
        chips={
          <>
            {border ? <FormMetaChip icon={Fence} label={border.name} /> : null}
            <FormMetaChip
              icon={ArrowUpDown}
              label={`${n(item.distanceToMashhadKm)} ${t('walkingRoutes.km')}`}
            />
            <FormMetaChip
              icon={Globe2}
              label={t('walkingRoutes.originCountryCount', {
                value: n(item.originCountries.length),
              })}
            />
            <FormMetaChip
              icon={Milestone}
              label={t('walkingRoutes.stageCountChip', { value: n(item.stages.length) })}
            />
          </>
        }
      >
        <div className="space-y-4 p-5 sm:p-6">
          <WalkingRouteTabNav tab={tab} onChange={setTab} />

          <div data-tab="general" className={panelClass('general')}>
            <FormSectionTitle icon={Route}>{t('walkingRoutes.sectionGeneral')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Route}
                label={t('walkingRoutes.name')}
                value={item.name}
                tone="teal"
              />
              <FormFactTile
                icon={ArrowUpDown}
                label={t('walkingRoutes.distanceToMashhadKm')}
                value={km(item.distanceToMashhadKm)}
                tone="mint"
              />
              <FormFactTile
                icon={Fence}
                label={t('walkingRoutes.entryBorder')}
                value={borderLabel}
                tone="ink"
                className="sm:col-span-2"
              />
              {border ? (
                <>
                  <FormFactTile
                    icon={MapPinned}
                    label={t('geo.province')}
                    value={name(border.province)}
                    tone="teal"
                  />
                  <FormFactTile
                    icon={MapPin}
                    label={t('geo.city')}
                    value={name(border.city)}
                    tone="mint"
                  />
                </>
              ) : null}
            </div>
          </div>

          <div data-tab="originCountries" className={panelClass('originCountries')}>
            <FormSectionTitle icon={Globe2}>
              {t('walkingRoutes.sectionOriginCountries')}
            </FormSectionTitle>
            {item.originCountries.length ? (
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {item.originCountries.map((country, index) => (
                  <FormFactTile
                    key={country.id}
                    icon={Globe2}
                    label={country.iso2}
                    value={name(country)}
                    tone={index % 2 === 0 ? 'teal' : 'mint'}
                  />
                ))}
              </div>
            ) : (
              <FormEmptyHint>{t('walkingRoutes.originCountriesEmpty')}</FormEmptyHint>
            )}
          </div>

          <div data-tab="stages" className={panelClass('stages')}>
            <FormSectionTitle icon={Milestone}>{t('walkingRoutes.sectionStages')}</FormSectionTitle>
            {item.stages.length ? (
              <div className="space-y-3">
                {item.stages.map((stage) => {
                  const title = hasText(stage.name)
                    ? stage.name
                    : `${t('walkingRoutes.stage')} ${n(stage.stageNumber)}`
                  const coords = stageCoordinates(stage)
                  const hasManager =
                    hasText(stage.managerName) ||
                    hasText(stage.managerPhone) ||
                    hasText(stage.managerTelegram) ||
                    hasText(stage.managerWhatsapp) ||
                    hasText(stage.managerEitaa)
                  return (
                    <article
                      key={stage.id ?? stage.stageNumber}
                      className="space-y-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white p-4"
                    >
                      <FormSectionTitle icon={Milestone} className="mb-0">
                        {title}
                      </FormSectionTitle>
                      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        {hasText(stage.name) ? (
                          <FormFactTile
                            icon={Type}
                            label={t('walkingRoutes.stationName')}
                            value={stage.name}
                            tone="teal"
                          />
                        ) : null}
                        <FormFactTile
                          icon={MapPin}
                          label={t('walkingRoutes.city')}
                          value={name(stage.city)}
                          tone="mint"
                        />
                        <FormFactTile
                          icon={MapPinned}
                          label={t('geo.province')}
                          value={name(stage.city.province)}
                          tone="ink"
                        />
                        {stage.distanceToPreviousKm != null ? (
                          <FormFactTile
                            icon={ArrowUpDown}
                            label={t('walkingRoutes.distanceToPreviousKm')}
                            value={km(stage.distanceToPreviousKm)}
                            tone="teal"
                          />
                        ) : null}
                        {stage.distanceToNextKm != null ? (
                          <FormFactTile
                            icon={ArrowUpDown}
                            label={t('walkingRoutes.distanceToNextKm')}
                            value={km(stage.distanceToNextKm)}
                            tone="mint"
                          />
                        ) : null}
                        {stage.distanceToMashhadKm != null ? (
                          <FormFactTile
                            icon={Milestone}
                            label={t('walkingRoutes.stageDistanceToMashhadKm')}
                            value={km(stage.distanceToMashhadKm)}
                            tone="ink"
                          />
                        ) : null}
                        {hasText(stage.description) ? (
                          <FormFactTile
                            icon={AlignLeft}
                            label={t('walkingRoutes.description')}
                            value={<span className="whitespace-pre-wrap">{stage.description}</span>}
                            tone="ink"
                            className="sm:col-span-2"
                          />
                        ) : null}
                      </div>
                      {coords ? (
                        <div className="space-y-2">
                          <FormSectionTitle icon={MapPinned} className="mb-0">
                            {t('walkingRoutes.location')}
                          </FormSectionTitle>
                          <OsmMapPicker
                            latitude={String(coords.lat)}
                            longitude={String(coords.lng)}
                            onChange={() => undefined}
                            active={tab === 'stages'}
                            variant="always"
                            readOnly
                            heightClass="h-64"
                          />
                        </div>
                      ) : null}
                      <StationNearbyPlaces
                        cityId={stage.cityId}
                        latitude={coords?.lat}
                        longitude={coords?.lng}
                      />
                      {hasManager ? (
                        <div className="space-y-2">
                          <FormSectionTitle icon={UserRound} className="mb-0">
                            {t('walkingRoutes.sectionManager')}
                          </FormSectionTitle>
                          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                            {hasText(stage.managerName) ? (
                              <FormFactTile
                                icon={UserRound}
                                label={t('walkingRoutes.managerName')}
                                value={stage.managerName}
                                tone="teal"
                              />
                            ) : null}
                            {hasText(stage.managerPhone) ? (
                              <FormFactTile
                                icon={Phone}
                                label={t('walkingRoutes.managerPhone')}
                                copyValue={stage.managerPhone}
                                tone="mint"
                              />
                            ) : null}
                            {hasText(stage.managerWhatsapp) ? (
                              <FormFactTile
                                icon={Phone}
                                label={t('walkingRoutes.managerWhatsapp')}
                                copyValue={stage.managerWhatsapp}
                                tone="ink"
                              />
                            ) : null}
                            {hasText(stage.managerTelegram) ? (
                              <FormFactTile
                                icon={MessageCircle}
                                label={t('walkingRoutes.managerTelegram')}
                                value={<span dir="ltr">{stage.managerTelegram}</span>}
                                tone="teal"
                              />
                            ) : null}
                            {hasText(stage.managerEitaa) ? (
                              <FormFactTile
                                icon={Share2}
                                label={t('walkingRoutes.managerEitaa')}
                                value={<span dir="ltr">{stage.managerEitaa}</span>}
                                tone="mint"
                              />
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            ) : (
              <FormEmptyHint>{t('walkingRoutes.stagesEmpty')}</FormEmptyHint>
            )}
          </div>

          <DetailActions
            className=""
            editTo={`/base-info/walking-routes/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('walkingRoutes.delete')}
            extra={
              <Button type="button" variant="soft" onClick={() => setStationsOpen(true)}>
                <Milestone className="size-4" aria-hidden />
                {t('walkingRoutes.stages')}
              </Button>
            }
            onDelete={() =>
              confirmDelete({
                message: t('walkingRoutes.confirmDelete'),
                successMessage: t('walkingRoutes.deleted'),
                path: `/walking-routes/${item.id}`,
                queryKey: ['walking-routes'],
                onDeleted: () => navigate('/base-info/walking-routes'),
              })
            }
          />
        </div>
      </FormCard>
      {stationsOpen ? (
        <WalkingRouteStationsModal
          routeId={item.id}
          initialRoute={item}
          onClose={() => setStationsOpen(false)}
        />
      ) : null}
    </div>
  )
}
