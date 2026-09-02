import { Coins, Phone, UserRound } from 'lucide-react'
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
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import type { CampaignParticipant } from '../../types/app'

export function ParticipantDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id: campaignId, participantId } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['campaign-participant', campaignId, participantId],
    enabled: Boolean(campaignId && participantId),
    queryFn: async () => {
      const { data } = await api.get<CampaignParticipant>(
        `/participation-campaigns/${campaignId}/participants/${participantId}`,
      )
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const n = (value: number) => formatGroupedNumber(value, locale)

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('campaignParticipants.details')}
        subtitle={<EntityNameSubtitle name={item.fullName} icon={UserRound} />}
      />
      <FormCard icon={UserRound} title={item.fullName}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={UserRound} label={t('campaignParticipants.fullName')} value={item.fullName} tone="teal" />
            <FormFactTile
              icon={Phone}
              label={t('campaignParticipants.phone')}
              copyValue={item.phone}
              value={item.phone || '—'}
              tone="mint"
            />
            <FormFactTile
              icon={Coins}
              label={t('campaignParticipants.shareCount')}
              value={n(item.shareCount)}
              tone="ink"
            />
            <FormFactTile
              icon={Coins}
              label={t('campaignParticipants.paidAmount')}
              value={`${n(item.paidAmount)} ${t('participations.toman')}`}
              tone="teal"
            />
          </div>
          <DetailActions
            editTo={`/participations/campaigns/${campaignId}/participants/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('campaignParticipants.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('campaignParticipants.confirmDelete'),
                successMessage: t('campaignParticipants.deleted'),
                path: `/participation-campaigns/${campaignId}/participants/${item.id}`,
                queryKey: ['campaign-participants'],
                onDeleted: () => navigate(`/participations/campaigns/${campaignId}/participants`),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
