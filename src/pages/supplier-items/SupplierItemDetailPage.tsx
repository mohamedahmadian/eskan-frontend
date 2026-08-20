import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { DetailActions, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type SupplierItem } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function SupplierItemDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { supplierId, id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['supplier-item', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SupplierItem>(`/supplier-items/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item || !supplierId) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('supplierItems.details')}
        subtitle={t('supplierItems.detailsSubtitle')}
        action={
          <Link
            to={`/logistics/suppliers/${supplierId}/items`}
            className="text-sm text-teal-700 hover:underline"
          >
            {t('supplierItems.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('suppliers.name')} value={item.supplier.name} />
          <DetailRow label={t('supplierItems.year')} value={formatNumber(item.year, locale)} />
          <DetailRow label={t('supplierItems.name')} value={item.name} />
          <DetailRow label={t('supplierItems.unit')} value={formatItemUnit(item.unit, t)} />
          <DetailRow label={t('supplierItems.quantity')} value={formatNumber(item.quantity, locale)} />
          <DetailRow
            label={t('supplierItems.remainingQuantity')}
            value={formatNumber(item.remainingQuantity, locale)}
          />
          <DetailRow
            label={t('supplierItems.deliveryDate')}
            value={<DateText value={item.deliveryDate} />}
          />
          <DetailRow
            label={t('supplierItems.returnDate')}
            value={<DateText value={item.returnDate} />}
          />
          <DetailRow label={t('supplierItems.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/logistics/suppliers/${supplierId}/items/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('supplierItems.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('supplierItems.confirmDelete'),
              successMessage: t('supplierItems.deleted'),
              path: `/supplier-items/${item.id}`,
              queryKey: ['supplier-items'],
              onDeleted: () => navigate(`/logistics/suppliers/${supplierId}/items`),
            })
          }
        />
      </article>
    </div>
  )
}
