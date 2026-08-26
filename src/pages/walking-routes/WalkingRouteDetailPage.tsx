import {
  AlignLeft,
  ArrowUpDown,
  Fence,
  Globe2,
  MapPin,
  MapPinned,
  Milestone,
  Route,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
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
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { WalkingRoute } from '../../types/app'
import { WalkingRouteTabNav, type WalkingRouteTab } from './WalkingRouteTabs'

export function WalkingRouteDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const [tab, setTab] = useState<WalkingRouteTab>('general')
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
    value == null ? '—' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`
  const n = (value: number) => formatNumber(value, locale)
  const empty = '—'
  const borderLabel = `${item.entryBorder.name} — ${name(item.entryBorder.city)}`

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
            <FormMetaChip icon={Fence} label={item.entryBorder.name} />
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
              <FormFactTile
                icon={MapPinned}
                label={t('geo.province')}
                value={name(item.entryBorder.province)}
                tone="teal"
              />
              <FormFactTile
                icon={MapPin}
                label={t('geo.city')}
                value={name(item.entryBorder.city)}
                tone="mint"
              />
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
                {item.stages.map((stage) => (
                  <article
                    key={stage.id ?? stage.stageNumber}
                    className="space-y-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white p-4"
                  >
                    <FormSectionTitle icon={Milestone} className="mb-0">
                      {t('walkingRoutes.stage')} {n(stage.stageNumber)}
                    </FormSectionTitle>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      <FormFactTile
                        icon={MapPin}
                        label={t('walkingRoutes.city')}
                        value={name(stage.city)}
                        tone="teal"
                      />
                      <FormFactTile
                        icon={MapPinned}
                        label={t('geo.province')}
                        value={name(stage.city.province)}
                        tone="mint"
                      />
                      <FormFactTile
                        icon={ArrowUpDown}
                        label={t('walkingRoutes.distanceToPreviousKm')}
                        value={km(stage.distanceToPreviousKm)}
                        empty={stage.distanceToPreviousKm == null}
                        tone="ink"
                      />
                      <FormFactTile
                        icon={ArrowUpDown}
                        label={t('walkingRoutes.distanceToNextKm')}
                        value={km(stage.distanceToNextKm)}
                        empty={stage.distanceToNextKm == null}
                        tone="teal"
                      />
                      <FormFactTile
                        icon={Milestone}
                        label={t('walkingRoutes.stageDistanceToMashhadKm')}
                        value={km(stage.distanceToMashhadKm)}
                        empty={stage.distanceToMashhadKm == null}
                        tone="mint"
                      />
                      <FormFactTile
                        icon={AlignLeft}
                        label={t('walkingRoutes.description')}
                        value={
                          stage.description ? (
                            <span className="whitespace-pre-wrap">{stage.description}</span>
                          ) : (
                            empty
                          )
                        }
                        empty={!stage.description}
                        tone="ink"
                        className="sm:col-span-2"
                      />
                    </div>
                  </article>
                ))}
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
    </div>
  )
}
