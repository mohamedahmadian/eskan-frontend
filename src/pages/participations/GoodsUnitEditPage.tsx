import { Scale } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { GoodsUnit } from '../../types/app'
import { GoodsUnitForm } from './GoodsUnitForm'

export function GoodsUnitEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['goods-unit', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<GoodsUnit>(`/goods-units/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('goodsUnits.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Scale} />}
      />
      <GoodsUnitForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/goods-units/${id}`, payload)
          toast.success(t('goodsUnits.updated'))
          navigate(`/participations/goods-units/${id}`)
        }}
      />
    </div>
  )
}
