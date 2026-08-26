import { AlignLeft, Building, IdCard, MapPin, Phone, Smartphone, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormFactTile,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import type { GovernmentOrganization } from '../../types/app'

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

  const empty = '—'
  const contact = item.contactUser

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('governmentOrganizations.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Building} />}
      />
      <FormCard icon={Building} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Building}
              label={t('governmentOrganizations.name')}
              value={item.name}
              tone="teal"
            />
            <FormFactTile
              icon={Phone}
              label={t('governmentOrganizations.phone')}
              value={item.phone ? localizeDigits(item.phone, locale) : empty}
              empty={!item.phone}
              tone="mint"
            />
            <FormFactTile
              icon={MapPin}
              label={t('governmentOrganizations.address')}
              value={item.address || empty}
              empty={!item.address}
              tone="ink"
              className="sm:col-span-2"
            />
            <FormFactTile
              icon={UserRound}
              label={t('governmentOrganizations.contactPerson')}
              value={contact?.fullName || empty}
              empty={!contact}
              tone="teal"
            />
            <FormFactTile
              icon={Smartphone}
              label={t('governmentOrganizations.contactPersonPhone')}
              copyValue={contact?.phone ?? null}
              empty={!contact?.phone}
              tone="mint"
            />
            <FormFactTile
              icon={IdCard}
              label={t('users.nationalId')}
              copyValue={contact?.nationalId ?? null}
              empty={!contact?.nationalId}
              tone="ink"
            />
            <FormFactTile
              icon={Smartphone}
              label={t('governmentOrganizations.mobile')}
              copyValue={item.mobile}
              empty={!item.mobile}
              tone="teal"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('governmentOrganizations.description')}
              value={item.description || empty}
              empty={!item.description}
              tone="mint"
              className="sm:col-span-2"
            />
          </div>
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
        </div>
      </FormCard>
    </div>
  )
}
