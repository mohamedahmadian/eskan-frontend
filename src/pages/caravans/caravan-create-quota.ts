import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { currentPersianYear } from '../../lib/datetime'

export type CaravanCreateQuota = {
  year: number
  max: number
  used: number
  allowed: boolean
}

export function useCaravanCreateQuota(options?: {
  enabled?: boolean
  year?: number
  managerUserId?: string
}) {
  const year = options?.year ?? currentPersianYear()
  const managerUserId = options?.managerUserId || undefined
  return useQuery({
    queryKey: ['caravans', 'create-quota', year, managerUserId ?? 'self'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<CaravanCreateQuota>('/caravans/create-quota', {
        params: { year, managerUserId },
      })
      return data
    },
  })
}
