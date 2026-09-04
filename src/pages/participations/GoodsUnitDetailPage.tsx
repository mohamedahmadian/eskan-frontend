import { Scale, ToggleRight } from 'lucide-react'
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
import type { GoodsUnit } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function GoodsUnitDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['goods-unit', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<GoodsUnit>(`/goods-units/${id}`)
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
        title={t('goodsUnits.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Scale} />}
      />
      <FormCard icon={Scale} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={Scale} label={t('goodsUnits.name')} value={item.name} tone="teal" />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="mint"
            />
          </div>
          <DetailActions
            editTo={`/participations/goods-units/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('goodsUnits.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('goodsUnits.confirmDelete'),
                successMessage: t('goodsUnits.deleted'),
                path: `/goods-units/${item.id}`,
                queryKey: ['goods-units'],
                onDeleted: () => navigate('/participations/goods-units'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
