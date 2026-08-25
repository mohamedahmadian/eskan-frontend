import { AlignLeft, ArrowUpDown, FileText, ToggleLeft, Users } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  ToggleField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import {
  EVALUATION_EVALUATOR_TYPES,
  EVALUATION_PAIRS,
  EVALUATION_TARGET_TYPES,
  isPairAllowed,
} from '../../lib/evaluations'
import type {
  EvaluationEvaluatorType,
  EvaluationQuestion,
  EvaluationTargetType,
} from '../../types/app'

export type EvaluationQuestionPayload = {
  title: string
  description: string | null
  evaluatorType: EvaluationEvaluatorType
  targetType: EvaluationTargetType
  sortOrder: number
  isActive: boolean
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function EvaluationQuestionForm({
  initial,
  onSubmit,
}: {
  initial?: EvaluationQuestion
  onSubmit: (payload: EvaluationQuestionPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    evaluatorType: (initial?.evaluatorType ?? 'PILGRIM') as EvaluationEvaluatorType,
    targetType: (initial?.targetType ?? 'CARAVAN_MANAGER') as EvaluationTargetType,
    sortOrder: String(initial?.sortOrder ?? 0),
    isActive: initial?.isActive ?? true,
  })

  const targetOptions = useMemo(() => {
    const allowed = EVALUATION_PAIRS[values.evaluatorType] ?? []
    return EVALUATION_TARGET_TYPES.filter((type) => allowed.includes(type))
  }, [values.evaluatorType])

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!isPairAllowed(values.evaluatorType, values.targetType)) {
      toast.error(t('evaluations.invalidPair'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: emptyToNull(values.description),
        evaluatorType: values.evaluatorType,
        targetType: values.targetType,
        sortOrder: Number(values.sortOrder) || 0,
        isActive: values.isActive,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={FileText}
      title={initial ? initial.title : t('evaluations.questions.create')}
      subtitle={initial ? undefined : t('evaluations.questions.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={FileText} label={t('evaluations.questions.title')} htmlFor="title">
          <input
            id="title"
            className={fieldClassName}
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField
          icon={AlignLeft}
          label={t('evaluations.questions.description')}
          htmlFor="description"
        >
          <textarea
            id="description"
            className={fieldClassName}
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>
        <FormField icon={Users} label={t('evaluations.evaluatorType')} htmlFor="evaluatorType">
          <SearchSelect
            id="evaluatorType"
            value={values.evaluatorType}
            required
            onChange={(next) => {
              const evaluatorType = next as EvaluationEvaluatorType
              const allowed = EVALUATION_PAIRS[evaluatorType] ?? []
              set('evaluatorType', evaluatorType)
              if (!allowed.includes(values.targetType)) {
                set('targetType', allowed[0] ?? 'CARAVAN_MANAGER')
              }
            }}
            placeholder={t('evaluations.selectEvaluatorType')}
            options={EVALUATION_EVALUATOR_TYPES.map((type) => ({
              value: type,
              label: t(`evaluations.evaluatorTypes.${type}`),
            }))}
          />
        </FormField>
        <FormField icon={Users} label={t('evaluations.targetType')} htmlFor="targetType">
          <SearchSelect
            id="targetType"
            value={values.targetType}
            required
            onChange={(next) => set('targetType', next as EvaluationTargetType)}
            placeholder={t('evaluations.selectTargetType')}
            options={targetOptions.map((type) => ({
              value: type,
              label: t(`evaluations.targetTypes.${type}`),
            }))}
          />
        </FormField>
        <FormField icon={ArrowUpDown} label={t('evaluations.questions.sortOrder')} htmlFor="sortOrder">
          <input
            id="sortOrder"
            type="number"
            min={0}
            className={fieldClassName}
            value={values.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </FormField>
        <FormField icon={ToggleLeft} label={t('evaluations.questions.isActive')}>
          <ToggleField
            checked={values.isActive}
            onChange={(checked) => set('isActive', checked)}
            onLabel={t('geo.active')}
            offLabel={t('geo.inactive')}
          />
        </FormField>
        <FormActions
          submitLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
