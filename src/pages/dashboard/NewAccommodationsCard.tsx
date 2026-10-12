import { Building2, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { geoName } from '../../lib/geo'
import type { Accommodation, Paginated } from '../../types/app'
import { DashboardFeedCard } from './DashboardFeedCard'

const LATEST_COUNT = 4

export function NewAccommodationsCard({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'

  const query = useQuery({
    queryKey: ['accommodations', 'pending-introductions', 'latest'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Accommodation>>('/accommodations', {
        params: {
          status: 'INACTIVE',
          introduced: true,
          page: 1,
          pageSize: LATEST_COUNT,
        },
      })
      return data
    },
  })

  return (
    <DashboardFeedCard
      className={className}
      to="/accommodations?status=INACTIVE"
      icon={Building2}
      itemIcon={MapPin}
      title={t('dashboard.newAccommodationsTitle')}
      hint={t('dashboard.newAccommodationsHint')}
      countLabel={t('dashboard.newAccommodationsCount')}
      emptyText={t('dashboard.newAccommodationsEmpty')}
      viewLabel={t('dashboard.newAccommodationsView')}
      total={query.data?.total}
      loading={query.isLoading}
      items={(query.data?.items ?? []).map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.city ? geoName(item.city, locale) : '',
        date: item.createdAt,
      }))}
    />
  )
}
