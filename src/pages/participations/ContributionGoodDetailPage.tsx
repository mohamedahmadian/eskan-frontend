import { Package, ToggleRight } from 'lucide-react'
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
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { ContributionGood } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function ContributionGoodDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['contribution-good', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ContributionGood>(`/contribution-goods/${id}`)
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
        title={t('contributionGoods.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Package} />}
      />
      <FormCard icon={Package} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={Package} label={t('contributionGoods.name')} value={item.name} tone="teal" />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="mint"
            />
          </div>
          <DetailActions
            editTo={`/participations/goods/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('contributionGoods.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('contributionGoods.confirmDelete'),
                successMessage: t('contributionGoods.deleted'),
                path: `/contribution-goods/${item.id}`,
                queryKey: ['contribution-goods'],
                onDeleted: () => navigate('/participations/goods'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
