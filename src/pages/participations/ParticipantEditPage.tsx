import { UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { CampaignParticipant, ParticipationCampaign } from '../../types/app'
import { ParticipantForm } from './ParticipantForm'

export function ParticipantEditPage() {
  const { t } = useTranslation()
  const { id: campaignId, participantId } = useParams()
  const navigate = useNavigate()
  const campaign = useQuery({
    queryKey: ['participation-campaign', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign>(`/participation-campaigns/${campaignId}`)
      return data
    },
  })
  const item = useQuery({
    queryKey: ['campaign-participant', campaignId, participantId],
    enabled: Boolean(campaignId && participantId),
    queryFn: async () => {
      const { data } = await api.get<CampaignParticipant>(
        `/participation-campaigns/${campaignId}/participants/${participantId}`,
      )
      return data
    },
  })

  if (!campaign.data || !item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('campaignParticipants.edit')}
        subtitle={<EntityNameSubtitle name={item.data.fullName} icon={UserRound} />}
      />
      <ParticipantForm
        campaign={campaign.data}
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(
            `/participation-campaigns/${campaignId}/participants/${participantId}`,
            payload,
          )
          toast.success(t('campaignParticipants.updated'))
          navigate(`/participations/campaigns/${campaignId}/participants/${participantId}`)
        }}
      />
    </div>
  )
}
