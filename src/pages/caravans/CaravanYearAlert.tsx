import { AlertTriangle, Check, UserRound } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber } from '../../lib/datetime'
import type { Caravan } from '../../types/app'

function previousYearManager(caravan: Caravan, currentYear: number) {
  const previousYear = currentYear - 1
  return caravan.years?.find((item) => item.year === previousYear && item.managerUserId)
}

export function CaravanYearAlert({ caravan }: { caravan: Caravan }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const currentYear = currentPersianYear()
  const specified = caravan.years?.some((item) => item.year === currentYear)
  const previousManager = previousYearManager(caravan, currentYear)

  const activate = useMutation({
    mutationFn: async (copyPreviousManager: boolean) =>
      api.post(`/caravans/${caravan.id}/activate-year`, {
        year: currentYear,
        copyPreviousManager,
      }),
    onSuccess: async (_data, copyPreviousManager) => {
      toast.success(
        copyPreviousManager
          ? t('caravans.activatedThisYearWithPreviousManager')
          : t('caravans.activatedThisYear'),
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['caravan', caravan.id] }),
        queryClient.invalidateQueries({ queryKey: ['caravans'] }),
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  if (specified) return null

  return (
    <aside
      className="rounded-[22px] border-2 border-gold-100 bg-gradient-to-b from-gold-50 via-gold-50/80 to-white p-5 shadow-[0_14px_36px_rgba(232,184,58,0.18)]"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
          <AlertTriangle className="size-5" aria-hidden />
        </div>
        <p className="pt-2 text-sm font-medium leading-7 text-ink-900">
          {t('caravans.yearUnspecified', { year: formatNumber(currentYear, locale) })}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 ps-14">
        <Button
          type="button"
          disabled={activate.isPending}
          onClick={() => activate.mutate(false)}
        >
          <Check className="size-4" aria-hidden />
          {t('caravans.activateThisYear')}
        </Button>
        {previousManager ? (
          <Button
            type="button"
            variant="soft"
            disabled={activate.isPending}
            onClick={() => activate.mutate(true)}
          >
            <UserRound className="size-4" aria-hidden />
            {t('caravans.activateThisYearWithPreviousManager')}
          </Button>
        ) : null}
      </div>
    </aside>
  )
}

export function yearManagerLabel(
  caravan: Caravan,
  year: number,
  unassigned: string,
) {
  const row = caravan.years?.find((item) => item.year === year)
  if (!row) return unassigned
  return row.manager?.fullName ?? unassigned
}
