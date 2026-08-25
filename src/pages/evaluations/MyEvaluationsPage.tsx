import { ClipboardList, Landmark, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  LoadingState,
  PageHeader,
  formShellClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { TableCard } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import { EVALUATION_PAIRS, isPairAllowed } from '../../lib/evaluations'
import type {
  Evaluation,
  EvaluationEvaluatorType,
  EvaluationPerson,
  EvaluationTargetType,
  MyEvaluationsPayload,
} from '../../types/app'

export function MyEvaluationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [campaignId, setCampaignId] = useState('')
  const [evaluatorType, setEvaluatorType] = useState<EvaluationEvaluatorType | ''>('')
  const [targetType, setTargetType] = useState<EvaluationTargetType | ''>('')
  const [targetId, setTargetId] = useState('')

  const mine = useQuery({
    queryKey: ['evaluations', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<MyEvaluationsPayload>('/evaluations/mine')
      return data
    },
  })

  const data = mine.data
  const evaluatorTypes = data?.evaluatorTypes ?? []
  const activeCampaigns = data?.activeCampaigns ?? []

  const resolvedEvaluatorType = (evaluatorType || evaluatorTypes[0] || '') as
    | EvaluationEvaluatorType
    | ''

  const targetOptions = useMemo(() => {
    if (!resolvedEvaluatorType) return []
    return EVALUATION_PAIRS[resolvedEvaluatorType] ?? []
  }, [resolvedEvaluatorType])

  const resolvedTargetType = (targetType || targetOptions[0] || '') as
    | EvaluationTargetType
    | ''

  const targets = useQuery({
    queryKey: ['evaluations', 'targets', resolvedTargetType],
    enabled: Boolean(resolvedTargetType) && resolvedTargetType !== 'HEADQUARTERS',
    queryFn: async () => {
      const { data: people } = await api.get<EvaluationPerson[]>('/evaluations/targets', {
        params: { targetType: resolvedTargetType },
      })
      return people
    },
  })

  if (!data) return <LoadingState />

  if (!evaluatorTypes.length) {
    return (
      <div className={formShellClassName}>
        <PageHeader title={t('menus.myEvaluations')} subtitle={t('evaluations.mine.subtitle')} />
        <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-600">
          {t('evaluations.mine.noRole')}
        </p>
      </div>
    )
  }

  async function startEvaluation(event: React.FormEvent) {
    event.preventDefault()
    const campaign = campaignId || activeCampaigns[0]?.id
    if (!campaign) {
      toast.error(t('evaluations.noActiveCampaign'))
      return
    }
    if (!resolvedEvaluatorType || !resolvedTargetType) {
      toast.error(t('evaluations.invalidPair'))
      return
    }
    if (!isPairAllowed(resolvedEvaluatorType, resolvedTargetType)) {
      toast.error(t('evaluations.invalidPair'))
      return
    }
    if (resolvedTargetType !== 'HEADQUARTERS' && !targetId) {
      toast.error(t('evaluations.selectTarget'))
      return
    }

    setSaving(true)
    try {
      const { data: evaluation } = await api.post<Evaluation>('/evaluations/start', {
        campaignId: campaign,
        evaluatorType: resolvedEvaluatorType,
        targetType: resolvedTargetType,
        targetId: resolvedTargetType === 'HEADQUARTERS' ? null : targetId,
      })
      toast.success(t('evaluations.started'))
      navigate(`/my-evaluations/${evaluation.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader title={t('menus.myEvaluations')} subtitle={t('evaluations.mine.subtitle')} />

      <FormCard
        icon={Plus}
        title={t('evaluations.mine.startTitle')}
        subtitle={t('evaluations.mine.startSubtitle')}
      >
        {!activeCampaigns.length ? (
          <p className="p-5 text-sm text-ink-600 sm:p-6">{t('evaluations.noActiveCampaign')}</p>
        ) : (
          <AppForm onSubmit={startEvaluation} className={formCardBodyClassName}>
            <FormField icon={ClipboardList} label={t('evaluations.campaign')} htmlFor="my-campaign">
              <SearchSelect
                id="my-campaign"
                value={campaignId || activeCampaigns[0]?.id || ''}
                required
                onChange={setCampaignId}
                placeholder={t('evaluations.selectCampaign')}
                options={activeCampaigns.map((item) => ({
                  value: item.id,
                  label: item.title,
                }))}
              />
            </FormField>
            {evaluatorTypes.length > 1 ? (
              <FormField
                icon={Users}
                label={t('evaluations.evaluatorType')}
                htmlFor="my-evaluator-type"
              >
                <SearchSelect
                  id="my-evaluator-type"
                  value={resolvedEvaluatorType}
                  required
                  onChange={(next) => {
                    setEvaluatorType(next as EvaluationEvaluatorType)
                    setTargetType('')
                    setTargetId('')
                  }}
                  options={evaluatorTypes.map((type) => ({
                    value: type,
                    label: t(`evaluations.evaluatorTypes.${type}`),
                  }))}
                />
              </FormField>
            ) : null}
            <FormField icon={Landmark} label={t('evaluations.targetType')} htmlFor="my-target-type">
              <SearchSelect
                id="my-target-type"
                value={resolvedTargetType}
                required
                onChange={(next) => {
                  setTargetType(next as EvaluationTargetType)
                  setTargetId('')
                }}
                options={targetOptions.map((type) => ({
                  value: type,
                  label: t(`evaluations.targetTypes.${type}`),
                }))}
              />
            </FormField>
            {resolvedTargetType !== 'HEADQUARTERS' ? (
              <FormField icon={Users} label={t('evaluations.target')} htmlFor="my-target">
                <SearchSelect
                  id="my-target"
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
              submitting={saving}
            />
          </AppForm>
        )}
      </FormCard>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-800">{t('evaluations.mine.history')}</h2>
        <TableCard>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line text-start text-ink-600">
                <th className="px-3 py-2 text-start font-medium">{t('evaluations.campaign')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('evaluations.target')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('evaluations.status')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('evaluations.startedAt')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(data.evaluations ?? []).map((item) => (
                <tr key={item.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-2.5">{item.campaign?.title ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    {item.targetType === 'HEADQUARTERS'
                      ? t('evaluations.headquarters')
                      : item.target?.fullName ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">{t(`evaluations.statuses.${item.status}`)}</td>
                  <td className="px-3 py-2.5">
                    <DateText value={item.startedAt} withTime />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link to={`/my-evaluations/${item.id}`}>
                      <Button type="button" variant="ghost">
                        {item.status === 'COMPLETED'
                          ? t('common.view')
                          : t('evaluations.continue')}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.evaluations?.length ? (
            <p className="p-6 text-center text-sm text-ink-500">{t('evaluations.mine.empty')}</p>
          ) : null}
        </TableCard>
      </section>
    </div>
  )
}
