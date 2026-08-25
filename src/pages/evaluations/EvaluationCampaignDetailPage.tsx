import { CalendarRange, ClipboardList, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
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
import type { EvaluationCampaign } from '../../types/app'

export function EvaluationCampaignDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['evaluation-campaign', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<EvaluationCampaign>(`/evaluation-campaigns/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) return <LoadingState />

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('evaluations.campaigns.details')}
        subtitle={<EntityNameSubtitle name={item.title} />}
      />
      <FormCard icon={CalendarRange} title={item.title} subtitle={item.description || undefined}>
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={FileText}>{t('evaluations.campaigns.info')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={CalendarRange}
              label={t('evaluations.campaigns.startAt')}
              value={<DateText value={item.startAt} />}
              tone="teal"
            />
            <FormFactTile
              icon={CalendarRange}
              label={t('evaluations.campaigns.endAt')}
              value={<DateText value={item.endAt} />}
              tone="mint"
            />
            <FormFactTile
              icon={FileText}
              label={t('evaluations.campaigns.status')}
              value={t(`evaluations.campaignStatuses.${item.status}`)}
              tone="ink"
            />
            <FormFactTile
              icon={ClipboardList}
              label={t('evaluations.count')}
              value={formatNumber(item._count?.evaluations ?? 0, locale)}
              tone="teal"
            />
          </div>
          <DetailActions
            editTo={`/evaluations/campaigns/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('evaluations.campaigns.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('evaluations.campaigns.confirmDelete'),
                successMessage: t('evaluations.campaigns.deleted'),
                path: `/evaluation-campaigns/${item.id}`,
                queryKey: ['evaluation-campaigns'],
                onDeleted: () => navigate('/evaluations/campaigns'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
