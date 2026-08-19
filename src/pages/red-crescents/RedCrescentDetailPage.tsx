import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { RedCrescent } from '../../types/app'
import { DetailRow, GeoLocationRows } from '../geo/GeoShared'

export function RedCrescentDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['red-crescent', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RedCrescent>(`/red-crescents/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('redCrescents.details')}
        subtitle={t('redCrescents.detailsSubtitle')}
        action={
          <Link to="/base-info/red-crescents" className="text-sm text-teal-700 hover:underline">
            {t('redCrescents.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('redCrescents.name')} value={item.name} />
          <DetailRow label={t('geo.province')} value={name(item.province)} />
          <DetailRow label={t('geo.city')} value={name(item.city)} />
          <DetailRow label={t('redCrescents.phone')} value={item.phone || '—'} />
          <DetailRow label={t('redCrescents.address')} value={item.address || '—'} />
          <GeoLocationRows
            neshanAddress={item.neshanAddress}
            latitude={item.latitude}
            longitude={item.longitude}
          />
          <DetailRow label={t('redCrescents.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/base-info/red-crescents/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('redCrescents.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('redCrescents.confirmDelete'),
              successMessage: t('redCrescents.deleted'),
              path: `/red-crescents/${item.id}`,
              queryKey: ['red-crescents'],
              onDeleted: () => navigate('/base-info/red-crescents'),
            })
          }
        />
      </article>
    </div>
  )
}
