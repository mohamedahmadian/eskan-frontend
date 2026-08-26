import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api, getImageUrl } from '../lib/api'
import type { HeadquartersServiceSummary } from '../types/app'

export const headquartersSummaryQueryKey = ['headquarters-info', 'summary'] as const

export async function invalidateHeadquartersBranding(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['headquarters-info'] }),
    queryClient.invalidateQueries({ queryKey: ['headquarters-phones'] }),
  ])
}

export function useHeadquartersSummary() {
  return useQuery({
    queryKey: headquartersSummaryQueryKey,
    queryFn: async () => {
      const { data } = await api.get<HeadquartersServiceSummary>('/headquarters-info/summary')
      return data
    },
  })
}

export function useInvalidateHeadquartersBranding() {
  const queryClient = useQueryClient()
  return () => invalidateHeadquartersBranding(queryClient)
}

/** Title, name and logo from headquarters info, with app name as fallback. */
export function useBrandDisplay() {
  const { t } = useTranslation()
  const query = useHeadquartersSummary()
  const name = query.data?.name?.trim() || ''
  const title = query.data?.title?.trim() || name || t('app.name')
  const logoSrc = query.data?.logoId ? getImageUrl(query.data.logoId) : undefined
  return { title, name, logoSrc, branding: query.data }
}
