import { Footprints, Tent } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { geoName } from '../../lib/geo'
import type { Caravan, Paginated } from '../../types/app'
import { DashboardFeedCard } from './DashboardFeedCard'

const LATEST_COUNT = 4

export function NewCaravansCard({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  const query = useQuery({
    queryKey: ['caravans', 'list', 'dashboard-latest'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans', {
        params: { page: 1, pageSize: LATEST_COUNT },
      })
      return data
    },
  })

  return (
    <DashboardFeedCard
      className={className}
      to="/caravans"
      icon={Tent}
      itemIcon={Footprints}
      title={t('dashboard.newCaravansTitle')}
      hint={t('dashboard.newCaravansHint')}
      countLabel={t('dashboard.newCaravansCount')}
      emptyText={t('dashboard.newCaravansEmpty')}
      viewLabel={t('dashboard.newCaravansView')}
      total={query.data?.total}
      loading={query.isLoading}
      items={(query.data?.items ?? []).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: [item.city ? geoName(item.city, locale) : '', item.manager?.fullName ?? '']
          .filter(Boolean)
          .join(' · '),
        date: item.createdAt,
      }))}
    />
  )
}
