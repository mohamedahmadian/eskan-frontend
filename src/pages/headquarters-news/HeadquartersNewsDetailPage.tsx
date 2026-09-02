import { AlignLeft, CalendarDays, Newspaper, ToggleRight, Type } from 'lucide-react'
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
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { HeadquartersNews } from '../../types/app'
import { PublishStatus } from './PublishStatus'

export function HeadquartersNewsDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['headquarters-news', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersNews>(`/headquarters-news/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersNews.details')}
        subtitle={<EntityNameSubtitle name={item.title} icon={Newspaper} />}
      />
      <FormCard icon={Newspaper} title={item.title}>
        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={Newspaper}>{t('headquartersNews.details')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Type}
                label={t('headquartersNews.titleLabel')}
                value={item.title}
                tone="teal"
                className="sm:col-span-2"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('headquartersNews.summary')}
                value={item.summary || '—'}
                empty={!item.summary}
                tone="mint"
                className="sm:col-span-2"
              />
              <FormFactTile
                icon={CalendarDays}
                label={t('headquartersNews.publishedAt')}
                value={<DateText value={item.publishedAt} />}
                tone="teal"
              />
              <FormFactTile
                icon={ToggleRight}
                label={t('headquartersNews.isPublished')}
                value={<PublishStatus published={item.isPublished} ns="headquartersNews" />}
                tone="mint"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('headquartersNews.body')}
                value={<span className="whitespace-pre-wrap">{item.body}</span>}
                tone="ink"
                className="sm:col-span-2"
              />
            </div>
          </section>
          <DetailActions
            editTo={`/headquarters/news/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('headquartersNews.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('headquartersNews.confirmDelete'),
                successMessage: t('headquartersNews.deleted'),
                path: `/headquarters-news/${item.id}`,
                queryKey: ['headquarters-news'],
                onDeleted: () => navigate('/headquarters/news'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
