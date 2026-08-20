import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { AccommodationLoan } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function MyLoanDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const query = useQuery({
    queryKey: ['accommodation-loans', 'mine', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<AccommodationLoan>(`/accommodation-loans/mine/${id}`)
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
        title={t('accommodationLoans.details')}
        subtitle={t('myLoans.detailsSubtitle')}
        action={
          <Link to="/logistics/my-loans" className="text-sm text-teal-700 hover:underline">
            {t('myLoans.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('suppliers.name')} value={item.supplierItem.supplier.name} />
          <DetailRow label={t('accommodationLoans.item')} value={item.supplierItem.name} />
          <DetailRow
            label={t('supplierItems.year')}
            value={formatNumber(item.supplierItem.year, locale)}
          />
          <DetailRow
            label={t('accommodationLoans.quantity')}
            value={`${formatNumber(item.quantity, locale)} ${item.supplierItem.unit}`}
          />
          <DetailRow
            label={t('accommodationLoans.returnedQuantity')}
            value={
              item.returnedQuantity == null
                ? '—'
                : `${formatNumber(item.returnedQuantity, locale)} ${item.supplierItem.unit}`
            }
          />
          <DetailRow
            label={t('accommodationLoans.shortage')}
            value={
              item.shortage == null
                ? '—'
                : `${formatNumber(item.shortage, locale)} ${item.supplierItem.unit}`
            }
          />
          <DetailRow
            label={t('accommodationLoans.deliveryDate')}
            value={<DateText value={item.deliveryDate} />}
          />
          <DetailRow
            label={t('accommodationLoans.plannedReturnDate')}
            value={<DateText value={item.plannedReturnDate} />}
          />
          <DetailRow
            label={t('accommodationLoans.actualReturnDate')}
            value={<DateText value={item.actualReturnDate} />}
          />
          <DetailRow label={t('accommodationLoans.description')} value={item.description || '—'} />
        </dl>
      </article>
    </div>
  )
}
