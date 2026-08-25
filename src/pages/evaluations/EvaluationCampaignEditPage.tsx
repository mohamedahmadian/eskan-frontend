import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { EvaluationCampaign } from '../../types/app'
import {
  EvaluationCampaignForm,
  type EvaluationCampaignPayload,
} from './EvaluationCampaignForm'

export function EvaluationCampaignEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['evaluation-campaign', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<EvaluationCampaign>(`/evaluation-campaigns/${id}`)
      return data
    },
  })

  if (!query.data) return <LoadingState />

  async function onSubmit(payload: EvaluationCampaignPayload) {
    const { data } = await api.patch<EvaluationCampaign>(
      `/evaluation-campaigns/${id}`,
      payload,
    )
    toast.success(t('evaluations.campaigns.updated'))
    navigate(`/evaluations/campaigns/${data.id}`)
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.campaigns.edit')}
        subtitle={<EntityNameSubtitle name={query.data.title} />}
      />
      <EvaluationCampaignForm initial={query.data} onSubmit={onSubmit} />
    </div>
  )
}
