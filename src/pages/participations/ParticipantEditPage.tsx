import { HandCoins } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Contribution } from '../../types/app'
import { ContributionForm } from './ContributionForm'

export function ParticipantEditPage() {
  const { t } = useTranslation()
  const { id: campaignId, participantId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const item = useQuery({
    queryKey: ['contribution', participantId],
    enabled: Boolean(participantId),
    queryFn: async () => {
      const { data } = await api.get<Contribution>(`/contributions/${participantId}`)
      return data
    },
  })

  if (!item.data || !campaignId) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('campaignParticipants.edit')}
        subtitle={<EntityNameSubtitle name={item.data.benefactor.name} icon={HandCoins} />}
      />
      <ContributionForm
        initial={item.data}
        lockedCampaignId={campaignId}
        lockedCampaignName={item.data.campaign?.name ?? undefined}
        lockedCampaignSharePrice={item.data.campaign?.sharePrice}
        onSubmit={async (payload) => {
          await api.patch(`/contributions/${participantId}`, { ...payload, campaignId })
          toast.success(t('campaignParticipants.updated'))
          await queryClient.invalidateQueries({ queryKey: ['contributions'] })
          await queryClient.invalidateQueries({ queryKey: ['contribution', participantId] })
          await queryClient.invalidateQueries({ queryKey: ['participation-campaigns'] })
          await queryClient.invalidateQueries({ queryKey: ['participation-campaign', campaignId] })
          navigate(`/participations/campaigns/${campaignId}/participants/${participantId}`)
        }}
      />
    </div>
  )
}
