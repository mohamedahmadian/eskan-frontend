import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { Benefactor } from '../../types/app'
import { DetailRow, GeoLocationRows } from '../geo/GeoShared'

export function BenefactorDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['benefactor', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Benefactor>(`/benefactors/${id}`)
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
        title={t('benefactors.details')}
        subtitle={t('benefactors.detailsSubtitle')}
        action={
          <Link to="/base-info/benefactors" className="text-sm text-teal-700 hover:underline">
            {t('benefactors.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('benefactors.name')} value={item.name} />
          <DetailRow label={t('geo.province')} value={name(item.province)} />
          <DetailRow label={t('geo.city')} value={name(item.city)} />
          <DetailRow label={t('benefactors.phone')} value={item.phone || '—'} />
          <DetailRow label={t('benefactors.address')} value={item.address || '—'} />
          <GeoLocationRows
            neshanAddress={item.neshanAddress}
            latitude={item.latitude}
            longitude={item.longitude}
          />
          <DetailRow label={t('benefactors.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/base-info/benefactors/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('benefactors.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('benefactors.confirmDelete'),
              successMessage: t('benefactors.deleted'),
              path: `/benefactors/${item.id}`,
              queryKey: ['benefactors'],
              onDeleted: () => navigate('/base-info/benefactors'),
            })
          }
        />
      </article>
    </div>
  )
}
