import { HandHeart, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { HonoraryServant, Paginated } from '../../types/app'
import { honoraryServiceLabel } from '../honorary-servants/HonoraryServantForm'
import { DashboardFeedCard } from './DashboardFeedCard'

const LATEST_COUNT = 4

export function HonoraryReadinessCard({ className = '' }: { className?: string }) {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['honorary-servants', 'list', 'dashboard-latest'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HonoraryServant>>('/honorary-servants', {
        params: { page: 1, pageSize: LATEST_COUNT, sortBy: 'createdAt', sortDir: 'desc' },
      })
      return data
    },
  })

  return (
    <DashboardFeedCard
      className={className}
      to="/honorary-servants"
      icon={HandHeart}
      itemIcon={UserRound}
      title={t('dashboard.honoraryReadinessTitle')}
      hint={t('dashboard.honoraryReadinessHint')}
      countLabel={t('dashboard.honoraryReadinessCount')}
      emptyText={t('dashboard.honoraryReadinessEmpty')}
      viewLabel={t('dashboard.honoraryReadinessView')}
      total={query.data?.total}
      loading={query.isLoading}
      items={(query.data?.items ?? []).map((item) => ({
        id: item.id,
        title: item.user.fullName,
        subtitle: honoraryServiceLabel(item, t),
        date: item.createdAt,
      }))}
    />
  )
}
