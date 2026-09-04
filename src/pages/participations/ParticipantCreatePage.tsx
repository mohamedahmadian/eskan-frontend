import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ParticipationCampaign } from '../../types/app'
import { ContributionForm } from './ContributionForm'

export function ParticipantCreatePage() {
  const { t } = useTranslation()
  const { id: campaignId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const campaign = useQuery({
    queryKey: ['participation-campaign', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign>(`/participation-campaigns/${campaignId}`)
      return data
    },
  })

  if (!campaign.data || !campaignId) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('campaignParticipants.create')}
        subtitle={t('campaignParticipants.createSubtitle')}
      />
      <ContributionForm
        lockedCampaignId={campaignId}
        lockedCampaignName={campaign.data.name}
        lockedCampaignSharePrice={campaign.data.sharePrice}
        onSubmit={async (payload) => {
          await api.post('/contributions', { ...payload, campaignId })
          toast.success(t('campaignParticipants.created'))
          await queryClient.invalidateQueries({ queryKey: ['contributions'] })
          await queryClient.invalidateQueries({ queryKey: ['participation-campaigns'] })
          await queryClient.invalidateQueries({ queryKey: ['participation-campaign', campaignId] })
          navigate(`/participations/campaigns/${campaignId}/participants`)
        }}
      />
    </div>
  )
}
