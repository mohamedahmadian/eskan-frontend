import { FileText, ListChecks, ToggleLeft, Users } from 'lucide-react'
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
import {
  FormCard,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { EvaluationQuestion } from '../../types/app'

export function EvaluationQuestionDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['evaluation-question', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<EvaluationQuestion>(`/evaluation-questions/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) return <LoadingState />

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.questions.details')}
        subtitle={<EntityNameSubtitle name={item.title} icon={FileText} />}
      />
      <FormCard
        icon={FileText}
        title={item.title}
        subtitle={item.description || undefined}
      >
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={Users}>{t('evaluations.questions.info')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Users}
              label={t('evaluations.evaluatorType')}
              value={t(`evaluations.evaluatorTypes.${item.evaluatorType}`)}
              tone="teal"
            />
            <FormFactTile
              icon={Users}
              label={t('evaluations.targetType')}
              value={t(`evaluations.targetTypes.${item.targetType}`)}
              tone="mint"
            />
            <FormFactTile
              icon={ListChecks}
              label={t('evaluations.answerType')}
              value={t(`evaluations.answerTypes.${item.answerType}`)}
              tone="teal"
            />
            <FormFactTile
              icon={FileText}
              label={t('evaluations.questions.sortOrder')}
              value={formatNumber(item.sortOrder, locale)}
              tone="ink"
            />
            <FormFactTile
              icon={ToggleLeft}
              label={t('evaluations.questions.isActive')}
              value={item.isActive ? t('geo.active') : t('geo.inactive')}
              tone="teal"
            />
          </div>
          <DetailActions
            editTo={`/evaluations/questions/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('evaluations.questions.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('evaluations.questions.confirmDelete'),
                successMessage: t('evaluations.questions.deleted'),
                path: `/evaluation-questions/${item.id}`,
                queryKey: ['evaluation-questions'],
                onDeleted: () => navigate('/evaluations/questions'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
