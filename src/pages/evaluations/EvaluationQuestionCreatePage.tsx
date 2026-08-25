import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { EvaluationQuestion } from '../../types/app'
import {
  EvaluationQuestionForm,
  type EvaluationQuestionPayload,
} from './EvaluationQuestionForm'

export function EvaluationQuestionCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  async function onSubmit(payload: EvaluationQuestionPayload) {
    const { data } = await api.post<EvaluationQuestion>('/evaluation-questions', payload)
    toast.success(t('evaluations.questions.created'))
    navigate(`/evaluations/questions/${data.id}`)
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.questions.create')}
        subtitle={t('evaluations.questions.createSubtitle')}
      />
      <EvaluationQuestionForm onSubmit={onSubmit} />
    </div>
  )
}
