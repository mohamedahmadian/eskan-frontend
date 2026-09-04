import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { GoodsUnitForm } from './GoodsUnitForm'

export function GoodsUnitCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('goodsUnits.create')} subtitle={t('goodsUnits.createSubtitle')} />
      <GoodsUnitForm
        onSubmit={async (payload) => {
          await api.post('/goods-units', payload)
          toast.success(t('goodsUnits.created'))
          navigate('/participations/goods-units')
        }}
      />
    </div>
  )
}
