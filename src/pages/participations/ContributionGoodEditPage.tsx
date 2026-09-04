import { Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ContributionGood } from '../../types/app'
import { ContributionGoodForm } from './ContributionGoodForm'

export function ContributionGoodEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['contribution-good', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ContributionGood>(`/contribution-goods/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('contributionGoods.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Package} />}
      />
      <ContributionGoodForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/contribution-goods/${id}`, payload)
          toast.success(t('contributionGoods.updated'))
          navigate(`/participations/goods/${id}`)
        }}
      />
    </div>
  )
}
