import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type CaravanHeadcountLimit = {
  applies: boolean
  max: number | null
}

export function useCaravanNewHeadcountLimit(params: {
  year?: number
  caravanId?: string | null
  excludeId?: string
  enabled?: boolean
}) {
  const year = params.year
  const caravanId = params.caravanId ?? ''
  const excludeId = params.excludeId ?? ''
  const enabled = (params.enabled ?? true) && Boolean(year && caravanId)
  return useQuery({
    queryKey: ['reservations', 'caravan-headcount-limit', year, caravanId, excludeId],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<CaravanHeadcountLimit>('/reservations/caravan-headcount-limit', {
        params: {
          year,
          caravanId,
          ...(excludeId ? { excludeId } : {}),
        },
      })
      return data
    },
  })
}
