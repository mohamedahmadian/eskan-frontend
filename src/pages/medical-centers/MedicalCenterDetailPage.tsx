import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoadingState, DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { MedicalCenter } from '../../types/app'
import { DetailRow, GeoLocationRows } from '../geo/GeoShared'

export function MedicalCenterDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['medical-center', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<MedicalCenter>(`/medical-centers/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('medicalCenters.details')}
        subtitle={t('medicalCenters.detailsSubtitle')}
        action={
          <Link to="/base-info/medical-centers" className="text-sm text-teal-700 hover:underline">
            {t('medicalCenters.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('medicalCenters.name')} value={item.name} />
          <DetailRow label={t('geo.province')} value={name(item.province)} />
          <DetailRow label={t('geo.city')} value={name(item.city)} />
          <DetailRow label={t('medicalCenters.phone')} value={item.phone || '—'} />
          <DetailRow label={t('medicalCenters.address')} value={item.address || '—'} />
          <GeoLocationRows
            neshanAddress={item.neshanAddress}
            latitude={item.latitude}
            longitude={item.longitude}
          />
          <DetailRow label={t('medicalCenters.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/base-info/medical-centers/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('medicalCenters.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('medicalCenters.confirmDelete'),
              successMessage: t('medicalCenters.deleted'),
              path: `/medical-centers/${item.id}`,
              queryKey: ['medical-centers'],
              onDeleted: () => navigate('/base-info/medical-centers'),
            })
          }
        />
      </article>
    </div>
  )
}
