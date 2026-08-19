import { useQuery } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailActions, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { WalkingRoute } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function WalkingRouteDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
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
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  const km = (value: number | null | undefined) =>
    value == null ? '—' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('walkingRoutes.details')}
        subtitle={t('walkingRoutes.detailsSubtitle')}
        action={
          <Link to="/base-info/walking-routes" className="text-sm text-teal-700 hover:underline">
            {t('walkingRoutes.backToList')}
          </Link>
        }
      />
      <div className="space-y-4">
        <Section title={t('walkingRoutes.sectionGeneral')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('walkingRoutes.name')} value={item.name} />
            <DetailRow
              label={t('walkingRoutes.distanceToMashhadKm')}
              value={km(item.distanceToMashhadKm)}
            />
            <DetailRow
              label={t('walkingRoutes.entryBorder')}
              value={`${name(item.entryBorderCity)} — ${name(item.entryBorderCity.province)}`}
            />
          </dl>
        </Section>
        <Section title={t('walkingRoutes.sectionOriginCountries')}>
          {item.originCountries.length ? (
            <dl className="grid gap-1 text-sm">
              {item.originCountries.map((country) => (
                <DetailRow key={country.id} label={name(country)} value={country.iso2} />
              ))}
            </dl>
          ) : (
            <p className="text-sm text-ink-500">—</p>
          )}
        </Section>
        <Section title={t('walkingRoutes.sectionStages')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">{t('walkingRoutes.stage')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('walkingRoutes.city')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('geo.province')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('walkingRoutes.distanceToPreviousKm')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('walkingRoutes.distanceToNextKm')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('walkingRoutes.stageDistanceToMashhadKm')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('walkingRoutes.description')}</th>
                </tr>
              </thead>
              <tbody>
                {item.stages.map((stage) => (
                  <tr key={stage.id ?? stage.stageNumber} className="border-t border-line">
                    <td className="px-3 py-2">{formatNumber(stage.stageNumber, locale)}</td>
                    <td className="px-3 py-2">{name(stage.city)}</td>
                    <td className="px-3 py-2">{name(stage.city.province)}</td>
                    <td className="px-3 py-2">{km(stage.distanceToPreviousKm)}</td>
                    <td className="px-3 py-2">{km(stage.distanceToNextKm)}</td>
                    <td className="px-3 py-2">{km(stage.distanceToMashhadKm)}</td>
                    <td className="px-3 py-2">{stage.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <div className={`p-6 ${cardClassName}`}>
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
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={`p-6 ${cardClassName}`}>
      <h2 className="mb-4 text-base font-semibold text-ink-900">{title}</h2>
      {children}
    </article>
  )
}
