import { ClipboardList, Landmark, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import {
  EVALUATION_EVALUATOR_TYPES,
  EVALUATION_PAIRS,
  isPairAllowed,
} from '../../lib/evaluations'
import type {
  Evaluation,
  EvaluationCampaign,
  EvaluationEvaluatorType,
  EvaluationPerson,
  EvaluationTargetType,
} from '../../types/app'

export function EvaluationSubmitPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [campaignId, setCampaignId] = useState('')
  const [evaluatorType, setEvaluatorType] = useState<EvaluationEvaluatorType>('UNIT_MANAGER')
  const [evaluatorId, setEvaluatorId] = useState('')
  const [targetType, setTargetType] = useState<EvaluationTargetType>('CARAVAN_MANAGER')
  const [targetId, setTargetId] = useState('')

  const campaigns = useQuery({
    queryKey: ['evaluation-campaigns', 'active'],
    queryFn: async () => {
      const { data } = await api.get<EvaluationCampaign[]>('/evaluation-campaigns/active')
      return data
    },
  })

  const targetOptions = useMemo(
    () => EVALUATION_PAIRS[evaluatorType] ?? [],
    [evaluatorType],
  )

  const evaluators = useQuery({
    queryKey: ['evaluations', 'people', evaluatorType],
    queryFn: async () => {
      const { data } = await api.get<EvaluationPerson[]>('/evaluations/people', {
        params: { roleCode: evaluatorType },
      })
      return data
    },
  })

  const targets = useQuery({
    queryKey: ['evaluations', 'targets', targetType],
    enabled: targetType !== 'HEADQUARTERS',
    queryFn: async () => {
      const { data } = await api.get<EvaluationPerson[]>('/evaluations/targets', {
        params: { targetType },
      })
      return data
    },
  })

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!campaignId) {
      toast.error(t('evaluations.selectCampaign'))
      return
    }
    if (!evaluatorId) {
      toast.error(t('evaluations.selectEvaluator'))
      return
    }
    if (!isPairAllowed(evaluatorType, targetType)) {
      toast.error(t('evaluations.invalidPair'))
      return
    }
    if (targetType !== 'HEADQUARTERS' && !targetId) {
      toast.error(t('evaluations.selectTarget'))
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post<Evaluation>('/evaluations/start', {
        campaignId,
        evaluatorType,
        evaluatorId,
        targetType,
        targetId: targetType === 'HEADQUARTERS' ? null : targetId,
      })
      toast.success(t('evaluations.started'))
      navigate(`/evaluations/${data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('menus.evaluationSubmit')}
        subtitle={t('evaluations.submit.subtitle')}
      />
      <FormCard
        icon={ClipboardList}
        title={t('evaluations.submit.formTitle')}
        subtitle={t('evaluations.submit.formSubtitle')}
      >
        <AppForm onSubmit={onSubmit} className={formCardBodyClassName}>
          <FormField icon={ClipboardList} label={t('evaluations.campaign')} htmlFor="campaignId">
            <SearchSelect
              id="campaignId"
              value={campaignId}
              required
              onChange={setCampaignId}
              placeholder={t('evaluations.selectCampaign')}
              options={[
                { value: '', label: t('evaluations.selectCampaign') },
                ...(campaigns.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.title,
                })),
              ]}
            />
          </FormField>
          <FormField icon={Users} label={t('evaluations.evaluatorType')} htmlFor="evaluatorType">
            <SearchSelect
              id="evaluatorType"
              value={evaluatorType}
              required
              onChange={(next) => {
                const type = next as EvaluationEvaluatorType
                const allowed = EVALUATION_PAIRS[type] ?? []
                setEvaluatorType(type)
                setEvaluatorId('')
                if (!allowed.includes(targetType)) {
                  setTargetType(allowed[0] ?? 'CARAVAN_MANAGER')
                  setTargetId('')
                }
              }}
              placeholder={t('evaluations.selectEvaluatorType')}
              options={EVALUATION_EVALUATOR_TYPES.map((type) => ({
                value: type,
                label: t(`evaluations.evaluatorTypes.${type}`),
              }))}
            />
          </FormField>
          <FormField icon={Users} label={t('evaluations.evaluator')} htmlFor="evaluatorId">
            <SearchSelect
              id="evaluatorId"
              value={evaluatorId}
              required
              onChange={setEvaluatorId}
              placeholder={t('evaluations.selectEvaluator')}
              options={[
                { value: '', label: t('evaluations.selectEvaluator') },
                ...(evaluators.data ?? []).map((person) => ({
                  value: person.id,
                  label: person.fullName,
                })),
              ]}
            />
          </FormField>
          <FormField icon={Landmark} label={t('evaluations.targetType')} htmlFor="targetType">
            <SearchSelect
              id="targetType"
              value={targetType}
              required
              onChange={(next) => {
                setTargetType(next as EvaluationTargetType)
                setTargetId('')
              }}
              placeholder={t('evaluations.selectTargetType')}
              options={targetOptions.map((type) => ({
                value: type,
                label: t(`evaluations.targetTypes.${type}`),
              }))}
            />
          </FormField>
          {targetType !== 'HEADQUARTERS' ? (
            <FormField icon={Users} label={t('evaluations.target')} htmlFor="targetId">
              <SearchSelect
                id="targetId"
                value={targetId}
                required
                onChange={setTargetId}
                placeholder={t('evaluations.selectTarget')}
                options={[
                  { value: '', label: t('evaluations.selectTarget') },
                  ...(targets.data ?? []).map((person) => ({
                    value: person.id,
                    label: person.fullName,
                  })),
                ]}
              />
            </FormField>
          ) : (
            <p className="rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-2 text-xs text-teal-900">
              {t('evaluations.headquartersHint')}
            </p>
          )}
          <FormActions
            submitLabel={t('evaluations.startSurvey')}
            cancelLabel={t('common.cancel')}
            submitting={saving}
            onCancel={() => history.back()}
          />
        </AppForm>
      </FormCard>
    </div>
  )
}
