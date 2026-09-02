import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ParticipationCampaign } from '../../types/app'
import { ParticipantForm } from './ParticipantForm'

export function ParticipantCreatePage() {
  const { t } = useTranslation()
  const { id: campaignId } = useParams()
  const navigate = useNavigate()
  const campaign = useQuery({
    queryKey: ['participation-campaign', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign>(`/participation-campaigns/${campaignId}`)
      return data
    },
  })

  if (!campaign.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('campaignParticipants.create')}
        subtitle={t('campaignParticipants.createSubtitle')}
      />
      <ParticipantForm
        campaign={campaign.data}
        onSubmit={async (payload) => {
          await api.post(`/participation-campaigns/${campaignId}/participants`, payload)
          toast.success(t('campaignParticipants.created'))
          navigate(`/participations/campaigns/${campaignId}/participants`)
        }}
      />
    </div>
  )
}
