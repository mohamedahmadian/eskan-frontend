import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import {
  Button,
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
import { api, getApiErrorMessage } from '../../lib/api'
import { useAuth } from '../../auth/AuthProvider'
import { isAdmin } from '../../lib/roles'
import type { Evaluation, EvaluationQuestion } from '../../types/app'
import { EvaluationSurveyForm } from './EvaluationSurveyForm'
import { ClipboardList, Trash2, UserRound } from 'lucide-react'

export function EvaluationDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const admin = isAdmin(user)
  const queryClient = useQueryClient()
  const { confirmDelete } = useConfirmDelete()
  const listPath = location.pathname.startsWith('/my-evaluations')
    ? '/my-evaluations'
    : '/evaluations'

  const query = useQuery({
    queryKey: ['evaluation', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Evaluation>(`/evaluations/${id}`)
      return data
    },
  })

  const questions = useQuery({
    queryKey: [
      'evaluation-questions',
      'for-pair',
      query.data?.evaluatorType,
      query.data?.targetType,
    ],
    enabled: Boolean(query.data),
    queryFn: async () => {
      const { data } = await api.get<EvaluationQuestion[]>('/evaluation-questions/for-pair', {
        params: {
          evaluatorType: query.data!.evaluatorType,
          targetType: query.data!.targetType,
        },
      })
      return data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (payload: {
      answers: { questionId: string; score: number; description?: string | null }[]
      complete: boolean
    }) => {
      const { data } = await api.post<Evaluation>(`/evaluations/${id}/submit`, payload)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['evaluation', id], data)
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      void queryClient.invalidateQueries({ queryKey: ['evaluations', 'mine'] })
      toast.success(
        data.status === 'COMPLETED'
          ? t('evaluations.submitted')
          : t('evaluations.draftSaved'),
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const item = query.data
  if (!item || !questions.data) return <LoadingState />

  const title =
    item.targetType === 'HEADQUARTERS'
      ? t('evaluations.headquarters')
      : item.target?.fullName || t('evaluations.details')
  const canEdit =
    item.status === 'IN_PROGRESS' || admin
  const readOnly = !canEdit
  const isProxy = item.submittedById !== item.evaluatorId

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.details')}
        subtitle={<EntityNameSubtitle name={title} icon={ClipboardList} />}
      />

      <div className="mb-4 space-y-4">
        <FormCard icon={ClipboardList} title={item.campaign?.title ?? t('evaluations.campaign')}>
          <div className="space-y-4 p-5 sm:p-6">
            <FormSectionTitle icon={UserRound}>{t('evaluations.meta')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={UserRound}
                label={t('evaluations.evaluator')}
                value={`${item.evaluator?.fullName ?? '—'} · ${t(`evaluations.evaluatorTypes.${item.evaluatorType}`)}`}
                tone="teal"
              />
              <FormFactTile
                icon={UserRound}
                label={t('evaluations.target')}
                value={
                  item.targetType === 'HEADQUARTERS'
                    ? t('evaluations.headquarters')
                    : `${item.target?.fullName ?? '—'} · ${t(`evaluations.targetTypes.${item.targetType}`)}`
                }
                tone="mint"
              />
              <FormFactTile
                icon={UserRound}
                label={t('evaluations.submittedBy')}
                value={
                  isProxy
                    ? t('evaluations.submittedByProxy', {
                        name: item.submittedBy?.fullName ?? '—',
                      })
                    : item.submittedBy?.fullName ?? '—'
                }
                tone="ink"
              />
              <FormFactTile
                icon={ClipboardList}
                label={t('evaluations.status')}
                value={t(`evaluations.statuses.${item.status}`)}
                tone="teal"
              />
              <FormFactTile
                icon={ClipboardList}
                label={t('evaluations.startedAt')}
                value={<DateText value={item.startedAt} withTime />}
                tone="mint"
              />
              <FormFactTile
                icon={ClipboardList}
                label={t('evaluations.completedAt')}
                value={
                  item.completedAt ? <DateText value={item.completedAt} withTime /> : '—'
                }
                tone="ink"
              />
            </div>
            {admin ? (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() =>
                    confirmDelete({
                      message: t('evaluations.confirmDelete'),
                      successMessage: t('evaluations.deleted'),
                      path: `/evaluations/${item.id}`,
                      queryKey: ['evaluations'],
                      onDeleted: () => navigate(listPath),
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  {t('evaluations.delete')}
                </Button>
              </div>
            ) : null}
          </div>
        </FormCard>
      </div>

      <EvaluationSurveyForm
        evaluation={item}
        questions={questions.data}
        readOnly={readOnly}
        onSubmit={async (payload) => {
          await submitMutation.mutateAsync(payload)
        }}
      />
    </div>
  )
}
