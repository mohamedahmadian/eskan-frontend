import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState, DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { RedCrescent } from '../../types/app'
import { DetailRow, GeoLocationRows } from '../geo/GeoShared'

export function RedCrescentDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
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
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('redCrescents.details')} subtitle={t('redCrescents.detailsSubtitle')} />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('redCrescents.name')} value={item.name} />
          <DetailRow label={t('geo.province')} value={name(item.province)} />
          <DetailRow label={t('geo.city')} value={name(item.city)} />
          <DetailRow label={t('redCrescents.phone')} value={item.phone ? localizeDigits(item.phone, locale) : '—'} />
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
