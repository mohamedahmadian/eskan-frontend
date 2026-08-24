import { Building } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { localizeDigits } from '../../lib/datetime'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { GovernmentOrganization } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function GovernmentOrganizationDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['government-organization', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<GovernmentOrganization>(
        `/government-organizations/${id}`,
      )
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
        title={t('governmentOrganizations.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Building} />}
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('governmentOrganizations.name')} value={item.name} />
          <DetailRow label={t('governmentOrganizations.phone')} value={item.phone ? localizeDigits(item.phone, locale) : '—'} />
          <DetailRow label={t('governmentOrganizations.address')} value={item.address || '—'} />
          <DetailRow
            label={t('governmentOrganizations.contactPerson')}
            value={item.contactPerson || '—'}
          />
          <DetailRow label={t('governmentOrganizations.mobile')} value={item.mobile || '—'} />
          <DetailRow
            label={t('governmentOrganizations.description')}
            value={item.description || '—'}
          />
        </dl>
        <DetailActions
          editTo={`/base-info/government-organizations/${item.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('governmentOrganizations.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('governmentOrganizations.confirmDelete'),
              successMessage: t('governmentOrganizations.deleted'),
              path: `/government-organizations/${item.id}`,
              queryKey: ['government-organizations'],
              onDeleted: () => navigate('/base-info/government-organizations'),
            })
          }
        />
      </article>
    </div>
  )
}
