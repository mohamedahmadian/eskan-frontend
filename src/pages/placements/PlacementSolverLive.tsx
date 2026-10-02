import { Clock3, Sparkles, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { Button } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'

type SolverStatus = {
  phase: 'idle' | 'running' | 'done' | 'infeasible' | 'failed' | 'stopped'
  year: number | null
  startedAt: string | null
  timeLimitSeconds: number | null
}

type SolverBoard = {
  caravanCount: number
  accommodations: unknown[]
}

function clock(totalSeconds: number, locale: string) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  const text =
    hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`
  return localizeDigits(text, locale)
}

export function PlacementSolverLive() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const admin = isAdmin(user)
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const [stopping, setStopping] = useState(false)

  const status = useQuery({
    queryKey: ['placements', 'system', 'status'],
    enabled: admin,
    queryFn: async () => {
      const { data } = await api.get<SolverStatus>('/placements/system/status')
      return data
    },
    refetchInterval: (query) => (query.state.data?.phase === 'running' ? 30_000 : false),
  })

  const running = status.data?.phase === 'running'
  const year = status.data?.year

  const board = useQuery({
    queryKey: ['placements', 'system', 'board', year],
    enabled: admin && running && year != null,
    queryFn: async () => {
      const { data } = await api.get<SolverBoard>('/placements/system/board', { params: { year } })
      return data
    },
  })

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running])

  if (!admin || !running || year == null) return null

  const elapsed =
    status.data?.startedAt != null
      ? Math.max(0, Math.floor((now - Date.parse(status.data.startedAt)) / 1000))
      : 0
  const caravans = board.data?.caravanCount ?? 0
  const places = board.data?.accommodations.length ?? 0

  async function stop() {
    setStopping(true)
    try {
      await api.post('/placements/system/stop')
      toast.success(t('placements.systemStopped'))
      await queryClient.invalidateQueries({ queryKey: ['placements', 'system', 'status'] })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setStopping(false)
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-4">
      <div className="eskan-solver-live pointer-events-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-center">
        <Link
          to={`/placements/system?year=${encodeURIComponent(String(year))}`}
          className="inline-flex min-w-0 items-center justify-center gap-2 text-center text-sm font-semibold text-teal-800"
        >
          <span className="eskan-solver-live-dot size-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
          <span className="truncate text-center">
            {t('placements.systemPlacing', {
              caravans: formatNumber(caravans, locale),
              places: formatNumber(places, locale),
            })}
          </span>
        </Link>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-800">
          <Clock3 className="size-4 text-teal-600" aria-hidden />
          <span dir="ltr">{clock(elapsed, locale)}</span>
        </span>
        <Button type="button" variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => void stop()} disabled={stopping}>
          <Square className="size-3.5" aria-hidden />
          {t('placements.systemStop')}
        </Button>
        <Button type="button" className="!px-3 !py-1.5 text-xs" disabled>
          <Sparkles className="size-3.5" aria-hidden />
          {t('placements.systemStart')}
        </Button>
      </div>
    </div>
  )
}
