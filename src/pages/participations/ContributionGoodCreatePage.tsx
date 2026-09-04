import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { ContributionGoodForm } from './ContributionGoodForm'

export function ContributionGoodCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('contributionGoods.create')} subtitle={t('contributionGoods.createSubtitle')} />
      <ContributionGoodForm
        onSubmit={async (payload) => {
          await api.post('/contribution-goods', payload)
          toast.success(t('contributionGoods.created'))
          navigate('/participations/goods')
        }}
      />
    </div>
  )
}
