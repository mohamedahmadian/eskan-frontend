import {
  AlignLeft,
  Building,
  CalendarDays,
  ClipboardList,
  HandHeart,
  Hash,
  Landmark,
  Package,
  UserRound,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { DateText } from '../../components/ui/DateText'
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
  FormMetaChip,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import type { SupportRequest } from '../../types/app'
import { SupportRequestStatusBadge } from './SupportRequestStatusBadge'

export function SupportRequestDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const admin = isAdmin(user)
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['support-request', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SupportRequest>(`/support-requests/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const empty = '—'
  const canMutate = admin || item.status === 'PENDING'
  const quantityLabel = t(`supportRequests.quantityByType.${item.type}`)
  const subjectLabel = t(`supportRequests.subjectByType.${item.type}`)

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('supportRequests.details')}
        subtitle={<EntityNameSubtitle name={item.subject} icon={HandHeart} />}
      />
      <FormCard
        icon={HandHeart}
        title={item.subject}
        chips={
          <>
            <FormMetaChip icon={Package} label={t(`supportRequests.types.${item.type}`)} />
            <FormMetaChip icon={Building} label={item.organization.name} />
            <span className="inline-flex items-center">
              <SupportRequestStatusBadge status={item.status} />
            </span>
          </>
        }
      >
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={ClipboardList}>{t('supportRequests.requestSection')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Building}
              label={t('supportRequests.organization')}
              value={item.organization.name}
              tone="teal"
            />
            <FormFactTile
              icon={Package}
              label={t('supportRequests.type')}
              value={t(`supportRequests.types.${item.type}`)}
              tone="mint"
            />
            <FormFactTile
              icon={HandHeart}
              label={subjectLabel}
              value={item.subject}
              tone="ink"
            />
            <FormFactTile
              icon={Hash}
              label={quantityLabel}
              value={item.quantity != null ? formatNumber(item.quantity, locale) : empty}
              empty={item.quantity == null}
              tone="teal"
            />
            <FormFactTile
              icon={CalendarDays}
              label={t('supportRequests.requestedAt')}
              value={<DateText value={item.requestedAt} />}
              tone="mint"
            />
            <FormFactTile
              icon={CalendarDays}
              label={t('supportRequests.neededBy')}
              value={item.neededBy ? <DateText value={item.neededBy} /> : empty}
              empty={!item.neededBy}
              tone="ink"
            />
            <FormFactTile
              icon={UserRound}
              label={t('supportRequests.requestedBy')}
              value={item.requestedBy?.fullName || empty}
              empty={!item.requestedBy}
              tone="teal"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('supportRequests.description')}
              value={item.description || empty}
              empty={!item.description}
              tone="mint"
              className="sm:col-span-2"
            />
          </div>

          <FormSectionTitle icon={Landmark}>{t('supportRequests.handlingSection')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={ClipboardList}
              label={t('supportRequests.status')}
              value={<SupportRequestStatusBadge status={item.status} />}
              tone="teal"
            />
            <FormFactTile
              icon={Building}
              label={t('supportRequests.handlingOrganization')}
              value={item.handlingOrganization?.name || empty}
              empty={!item.handlingOrganization}
              tone="mint"
            />
            <FormFactTile
              icon={CalendarDays}
              label={t('supportRequests.handledAt')}
              value={item.handledAt ? <DateText value={item.handledAt} /> : empty}
              empty={!item.handledAt}
              tone="ink"
            />
            <FormFactTile
              icon={UserRound}
              label={t('supportRequests.handledBy')}
              value={item.handledBy?.fullName || empty}
              empty={!item.handledBy}
              tone="teal"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('supportRequests.handlingNotes')}
              value={item.handlingNotes || empty}
              empty={!item.handlingNotes}
              tone="mint"
              className="sm:col-span-2"
            />
          </div>

          {canMutate ? (
            <DetailActions
              editTo={`/support-requests/${item.id}/edit`}
              editLabel={t('common.edit')}
              deleteLabel={t('supportRequests.delete')}
              onDelete={() =>
                confirmDelete({
                  message: t('supportRequests.confirmDelete'),
                  successMessage: t('supportRequests.deleted'),
                  path: `/support-requests/${item.id}`,
                  queryKey: ['support-requests'],
                  onDeleted: () => navigate('/support-requests'),
                })
              }
            />
          ) : null}
        </div>
      </FormCard>
    </div>
  )
}
