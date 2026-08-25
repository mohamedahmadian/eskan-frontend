import { FileText } from 'lucide-react'
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
import type { EvaluationQuestion } from '../../types/app'
import {
  EvaluationQuestionForm,
  type EvaluationQuestionPayload,
} from './EvaluationQuestionForm'

export function EvaluationQuestionEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['evaluation-question', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<EvaluationQuestion>(`/evaluation-questions/${id}`)
      return data
    },
  })

  if (!query.data) return <LoadingState />

  async function onSubmit(payload: EvaluationQuestionPayload) {
    const { data } = await api.patch<EvaluationQuestion>(
      `/evaluation-questions/${id}`,
      payload,
    )
    toast.success(t('evaluations.questions.updated'))
    navigate(`/evaluations/questions/${data.id}`)
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.questions.edit')}
        subtitle={<EntityNameSubtitle name={query.data.title} icon={FileText} />}
      />
      <EvaluationQuestionForm initial={query.data} onSubmit={onSubmit} />
    </div>
  )
}
