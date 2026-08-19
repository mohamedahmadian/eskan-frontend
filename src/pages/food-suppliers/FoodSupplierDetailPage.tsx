import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { FoodSupplier } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function FoodSupplierDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['food-supplier', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<FoodSupplier>(`/food-suppliers/${id}`)
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
        title={t('foodSuppliers.details')}
        subtitle={t('foodSuppliers.detailsSubtitle')}
        action={
          <Link to="/base-info/food-suppliers" className="text-sm text-teal-700 hover:underline">
            {t('foodSuppliers.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('foodSuppliers.name')} value={item.name} />
          <DetailRow label={t('geo.province')} value={name(item.province)} />
          <DetailRow label={t('geo.city')} value={name(item.city)} />
          <DetailRow label={t('foodSuppliers.phone')} value={item.phone || '—'} />
          <DetailRow label={t('foodSuppliers.address')} value={item.address || '—'} />
          <DetailRow label={t('foodSuppliers.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/base-info/food-suppliers/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('foodSuppliers.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('foodSuppliers.confirmDelete'),
              successMessage: t('foodSuppliers.deleted'),
              path: `/food-suppliers/${item.id}`,
              queryKey: ['food-suppliers'],
              onDeleted: () => navigate('/base-info/food-suppliers'),
            })
          }
        />
      </article>
    </div>
  )
}
