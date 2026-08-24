import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
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
import type { Supplier } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'
import { Package } from 'lucide-react'

export function SupplierDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['supplier', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/suppliers/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('suppliers.details')} subtitle={t('suppliers.detailsSubtitle')} />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('suppliers.name')} value={item.name} />
          <DetailRow label={t('suppliers.type')} value={t(`supplierTypes.${item.type}`)} />
          <DetailRow label={t('suppliers.address')} value={item.address || '—'} />
          <DetailRow label={t('suppliers.phone')} value={item.phone ? localizeDigits(item.phone, locale) : '—'} />
          <DetailRow label={t('suppliers.contactPerson')} value={item.contactPerson || '—'} />
          <DetailRow label={t('suppliers.description')} value={item.description || '—'} />
        </dl>
        <DetailActions
          editTo={`/logistics/suppliers/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('suppliers.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('suppliers.confirmDelete'),
              successMessage: t('suppliers.deleted'),
              path: `/suppliers/${item.id}`,
              queryKey: ['suppliers'],
              onDeleted: () => navigate('/logistics/suppliers'),
            })
          }
          extra={
            <Link to={`/logistics/suppliers/${item.id}/items`}>
              <Button type="button" variant="soft">
                <Package className="size-4" aria-hidden />
                {t('supplierItems.manage')}
              </Button>
            </Link>
          }
        />
      </article>
    </div>
  )
}
