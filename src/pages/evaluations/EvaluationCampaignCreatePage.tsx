import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { EvaluationCampaign } from '../../types/app'
import {
  EvaluationCampaignForm,
  type EvaluationCampaignPayload,
} from './EvaluationCampaignForm'

export function EvaluationCampaignCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  async function onSubmit(payload: EvaluationCampaignPayload) {
    const { data } = await api.post<EvaluationCampaign>('/evaluation-campaigns', payload)
    toast.success(t('evaluations.campaigns.created'))
    navigate(`/evaluations/campaigns/${data.id}`)
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.campaigns.create')}
        subtitle={t('evaluations.campaigns.createSubtitle')}
      />
      <EvaluationCampaignForm onSubmit={onSubmit} />
    </div>
  )
}
