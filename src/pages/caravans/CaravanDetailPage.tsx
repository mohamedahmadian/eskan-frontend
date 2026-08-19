import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { Caravan } from '../../types/app'

export function CaravanDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })

  const caravan = query.data
  if (!caravan) {
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('caravans.details')}
        subtitle={t('caravans.detailsSubtitle')}
        action={
          <Link to="/caravans" className="text-sm text-teal-700 hover:underline">
            {t('caravans.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.name')}</dt>
            <dd>{caravan.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.originCity')}</dt>
            <dd>{caravan.originCity}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.plannedArrival')}</dt>
            <dd>
              {caravan.plannedArrival ? (
                <DateText value={caravan.plannedArrival} />
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
        <DetailActions
          editTo={`/caravans/${caravan.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('caravans.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('caravans.confirmDelete'),
              successMessage: t('caravans.deleted'),
              path: `/caravans/${caravan.id}`,
              queryKey: ['caravans'],
              onDeleted: () => navigate('/caravans'),
            })
          }
        />
      </article>
    </div>
  )
}
