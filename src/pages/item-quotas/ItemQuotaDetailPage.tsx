import { Ticket } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  DetailActions,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type ItemQuota } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function ItemQuotaDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['item-quota', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ItemQuota>(`/item-quotas/${id}`)
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
        title={t('itemQuotas.details')}
        subtitle={t('itemQuotas.detailsSubtitle')}
        action={
          <Link to="/logistics/item-quotas" className="text-sm text-teal-700 hover:underline">
            {t('itemQuotas.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('itemQuotas.year')} value={formatNumber(item.year, locale)} />
          <DetailRow label={t('itemQuotas.name')} value={item.name} />
          <DetailRow label={t('itemQuotas.unit')} value={formatItemUnit(item.unit, t)} />
          <DetailRow
            label={t('itemQuotas.quantity')}
            value={`${formatNumber(item.quantity, locale)} ${formatItemUnit(item.unit, t)}`}
          />
          <DetailRow
            label={t('itemQuotas.remainingQuantity')}
            value={`${formatNumber(item.remainingQuantity, locale)} ${formatItemUnit(item.unit, t)}`}
          />
          <DetailRow
            label={t('itemQuotas.supplier')}
            value={item.supplier?.name ?? t('itemQuotas.unspecifiedSupplier')}
          />
          <DetailRow label={t('itemQuotas.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/logistics/item-quotas/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('itemQuotas.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('itemQuotas.confirmDelete'),
              successMessage: t('itemQuotas.deleted'),
              path: `/item-quotas/${item.id}`,
              queryKey: ['item-quotas'],
              onDeleted: () => navigate('/logistics/item-quotas'),
            })
          }
          extra={
            <Link to={`/logistics/item-quotas/${item.id}/vouchers`}>
              <Button type="button" variant="gold">
                <Ticket className="size-4" aria-hidden />
                {t('itemQuotaVouchers.manage')}
              </Button>
            </Link>
          }
        />
      </article>
    </div>
  )
}
