import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type CaravanCreateQuota = {
  max: number
  used: number
  allowed: boolean
}

export function useCaravanCreateQuota(options?: {
  enabled?: boolean
  managerUserId?: string
}) {
  const managerUserId = options?.managerUserId || undefined
  return useQuery({
    queryKey: ['caravans', 'create-quota', managerUserId ?? 'self'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<CaravanCreateQuota>('/caravans/create-quota', {
        params: { managerUserId },
      })
      return data
    },
  })
}
