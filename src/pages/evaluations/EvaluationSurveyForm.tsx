import { Check, Landmark, MessageSquareText, Save, UserRound } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, Button, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import {
  EVALUATION_SCORES,
  isQuestionAnswered,
  scoreTone,
  type EvaluationAnswerDraft,
} from '../../lib/evaluations'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import type { Evaluation, EvaluationAnswerType, EvaluationQuestion } from '../../types/app'

export type EvaluationSurveyAnswerPayload = {
  questionId: string
  score?: number | null
  yesNo?: boolean | null
  textValue?: string | null
  description?: string | null
}

const scoreButtonClass: Record<string, string> = {
  excellent:
    'border-teal-300 bg-teal-50 text-teal-800 data-[selected=true]:border-teal-500 data-[selected=true]:bg-teal-500 data-[selected=true]:text-white data-[selected=true]:shadow-[0_10px_22px_rgba(46,189,182,0.35)]',
  good: 'border-mint-300 bg-mint-50 text-mint-600 data-[selected=true]:border-mint-500 data-[selected=true]:bg-mint-500 data-[selected=true]:text-white data-[selected=true]:shadow-[0_10px_22px_rgba(63,214,190),0.32)]',
  average:
    'border-line bg-cream-50 text-ink-700 data-[selected=true]:border-ink-700 data-[selected=true]:bg-ink-700 data-[selected=true]:text-white',
  weak: 'border-gold-400/60 bg-gold-50 text-gold-600 data-[selected=true]:border-gold-500 data-[selected=true]:bg-gold-500 data-[selected=true]:text-ink-900',
  poor: 'border-red-200 bg-red-50 text-red-700 data-[selected=true]:border-red-600 data-[selected=true]:bg-red-600 data-[selected=true]:text-white',
}

const yesNoButtonClass = {
  yes: scoreButtonClass.excellent,
  no: scoreButtonClass.average,
}

function answerTypeOf(question: EvaluationQuestion): EvaluationAnswerType {
  return question.answerType ?? 'FIVE_SCALE'
}

function buildInitialAnswers(
  questions: EvaluationQuestion[],
  evaluation?: Evaluation,
): Record<string, EvaluationAnswerDraft> {
  const map: Record<string, EvaluationAnswerDraft> = {}
  for (const question of questions) {
    const existing = evaluation?.answers?.find((item) => item.questionId === question.id)
    map[question.id] = {
      score: existing?.score ?? null,
      yesNo: existing?.yesNo ?? null,
      textValue: existing?.textValue ?? '',
      description: existing?.description ?? '',
    }
  }
  return map
}

function toPayload(
  question: EvaluationQuestion,
  draft: EvaluationAnswerDraft,
): EvaluationSurveyAnswerPayload | null {
  const type = answerTypeOf(question)
  if (!isQuestionAnswered(type, draft)) return null
  if (type === 'FIVE_SCALE') {
    return {
      questionId: question.id,
      score: draft.score,
      description: draft.description.trim() || null,
    }
  }
  if (type === 'YES_NO') {
    return { questionId: question.id, yesNo: draft.yesNo }
  }
  return { questionId: question.id, textValue: draft.textValue.trim() }
}

export function EvaluationSurveyForm({
  evaluation,
  questions,
  readOnly = false,
  onSubmit,
}: {
  evaluation: Evaluation
  questions: EvaluationQuestion[]
  readOnly?: boolean
  onSubmit: (payload: {
    answers: EvaluationSurveyAnswerPayload[]
    complete: boolean
  }) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState(() => buildInitialAnswers(questions, evaluation))

  const answeredCount = useMemo(
    () => questions.filter((q) => isQuestionAnswered(answerTypeOf(q), answers[q.id])).length,
    [answers, questions],
  )
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0
  const hasScaleQuestions = questions.some((q) => answerTypeOf(q) === 'FIVE_SCALE')
  const targetLabel =
    evaluation.targetType === 'HEADQUARTERS'
      ? t('evaluations.headquarters')
      : evaluation.target?.fullName || '—'
  const isProxy = evaluation.submittedById !== evaluation.evaluatorId

  function patchAnswer(questionId: string, patch: Partial<EvaluationAnswerDraft>) {
    if (readOnly) return
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...patch },
    }))
  }

  async function submit(complete: boolean) {
    if (readOnly) return
    const payload = questions
      .map((q) => toPayload(q, answers[q.id]))
      .filter((item): item is EvaluationSurveyAnswerPayload => item != null)

    if (complete && payload.length < questions.length) {
      toast.error(t('evaluations.answerAllRequired'))
      return
    }
    if (!payload.length) {
      toast.error(t('evaluations.answerAtLeastOne'))
      return
    }

    setSaving(true)
    try {
      await onSubmit({ answers: payload, complete })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  async function onFormSubmit(event: FormEvent) {
    event.preventDefault()
    await submit(true)
  }

  return (
    <div className="space-y-4">
      <FormCard
        icon={evaluation.targetType === 'HEADQUARTERS' ? Landmark : UserRound}
        title={targetLabel}
        subtitle={evaluation.campaign?.title}
        chips={
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-ink-700 ring-1 ring-teal-100">
              {t(`evaluations.evaluatorTypes.${evaluation.evaluatorType}`)}
            </span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-ink-700 ring-1 ring-mint-100">
              {t(`evaluations.targetTypes.${evaluation.targetType}`)}
            </span>
            {isProxy ? (
              <span className="rounded-full bg-gold-50 px-2.5 py-1 text-gold-600 ring-1 ring-gold-100">
                {t('evaluations.submittedByProxy', {
                  name: evaluation.submittedBy?.fullName ?? '—',
                })}
              </span>
            ) : null}
          </div>
        }
      >
        <div className="space-y-3 border-b border-line/70 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 text-xs text-ink-600">
            <span>
              {t('evaluations.progressLabel', {
                answered: localizeDigits(String(answeredCount), locale),
                total: localizeDigits(String(questions.length), locale),
              })}
            </span>
            <span className="font-semibold text-teal-700">
              {localizeDigits(String(progress), locale)}٪
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cream-100">
            <div
              className="h-full rounded-full bg-gradient-to-e from-mint-400 to-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {hasScaleQuestions ? (
            <p className="text-[11px] leading-5 text-ink-500">{t('evaluations.scoreHint')}</p>
          ) : null}
        </div>

        <AppForm onSubmit={onFormSubmit} className={`${formCardBodyClassName} space-y-5`}>
          {questions.map((question, index) => {
            const draft = answers[question.id]
            const type = answerTypeOf(question)
            return (
              <article
                key={question.id}
                className="rounded-2xl border border-line/80 bg-gradient-to-b from-white to-cream-50/40 p-4 shadow-[0_8px_24px_rgba(63,58,52,0.04)] sm:p-5"
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-sm font-bold text-white">
                    {localizeDigits(String(index + 1), locale)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-7 text-ink-900">
                      {question.title}
                    </h3>
                    {question.description ? (
                      <p className="mt-1 text-xs leading-6 text-ink-500">{question.description}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-ink-500">
                      {t(`evaluations.answerTypes.${type}`)}
                      {' · '}
                      {t(`evaluations.answerTypeHints.${type}`)}
                    </p>
                  </div>
                </div>

                {type === 'FIVE_SCALE' ? (
                  <>
                    <div
                      className="grid grid-cols-1 gap-2 sm:grid-cols-5"
                      role="radiogroup"
                      aria-label={question.title}
                    >
                      {EVALUATION_SCORES.map((score) => {
                        const selected = draft?.score === score
                        return (
                          <button
                            key={score}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={readOnly}
                            data-selected={selected}
                            onClick={() => patchAnswer(question.id, { score })}
                            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:cursor-default ${scoreButtonClass[scoreTone(score)]}`}
                          >
                            <span className="text-lg font-bold leading-none">
                              {localizeDigits(String(score), locale)}
                            </span>
                            <span className="text-[11px] font-medium leading-4">
                              {t(`evaluations.scores.${score}`)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <label className="mt-4 block">
                      <span className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-600">
                        <MessageSquareText className="size-3.5" aria-hidden />
                        {t('evaluations.answerDescription')}
                      </span>
                      <textarea
                        className={fieldClassName}
                        rows={2}
                        disabled={readOnly}
                        value={draft?.description ?? ''}
                        onChange={(e) => patchAnswer(question.id, { description: e.target.value })}
                        placeholder={t('evaluations.answerDescriptionPlaceholder')}
                      />
                    </label>
                  </>
                ) : null}

                {type === 'YES_NO' ? (
                  <div
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label={question.title}
                  >
                    {(
                      [
                        { value: true, key: 'yes' as const },
                        { value: false, key: 'no' as const },
                      ]
                    ).map((option) => {
                      const selected = draft?.yesNo === option.value
                      return (
                        <button
                          key={option.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={readOnly}
                          data-selected={selected}
                          onClick={() => patchAnswer(question.id, { yesNo: option.value })}
                          className={`flex min-h-16 items-center justify-center rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:cursor-default ${yesNoButtonClass[option.key]}`}
                        >
                          {t(`evaluations.yesNo.${option.key}`)}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {type === 'TEXT' ? (
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-600">
                      <MessageSquareText className="size-3.5" aria-hidden />
                      {t('evaluations.textAnswer')}
                    </span>
                    <textarea
                      className={fieldClassName}
                      rows={4}
                      disabled={readOnly}
                      value={draft?.textValue ?? ''}
                      onChange={(e) => patchAnswer(question.id, { textValue: e.target.value })}
                      placeholder={t('evaluations.textAnswerPlaceholder')}
                    />
                  </label>
                ) : null}
              </article>
            )
          })}

          {!readOnly ? (
            <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-[0_12px_40px_rgba(63,58,52,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="px-1 text-xs text-ink-500">
                {t('evaluations.progressLabel', {
                  answered: formatNumber(answeredCount, locale),
                  total: formatNumber(questions.length, locale),
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => void submit(false)}
                >
                  <Save className="size-4" aria-hidden />
                  {t('evaluations.saveDraft')}
                </Button>
                <Button type="submit" disabled={saving}>
                  <Check className="size-4" aria-hidden />
                  {saving ? t('common.loading') : t('evaluations.submitComplete')}
                </Button>
              </div>
            </div>
          ) : null}
        </AppForm>
      </FormCard>
    </div>
  )
}
