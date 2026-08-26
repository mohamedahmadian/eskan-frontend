import { CalendarDays, Trash2, UserPlus, UserRound } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { TableCard } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, toLatinDigits } from '../../lib/datetime'
import type { Caravan } from '../../types/app'
import {
  CaravanManagerPicker,
  type CaravanManagerChoice,
} from './CaravanManagerPicker'
import { yearManagerLabel } from './CaravanYearAlert'

export function CaravanActivityYearField({
  year,
  onYearChange,
  inputId = 'caravan-activity-year',
}: {
  year: string
  onYearChange: (value: string) => void
  inputId?: string
}) {
  const { t } = useTranslation()
  return (
    <FormField icon={CalendarDays} label={t('caravans.year')} htmlFor={inputId}>
      <input
        id={inputId}
        className={fieldClassName}
        inputMode="numeric"
        min={1300}
        max={1600}
        required
        value={year}
        onChange={(event) => onYearChange(toLatinDigits(event.target.value))}
      />
    </FormField>
  )
}

export function CaravanYearsCard({
  caravan,
  canAssign = true,
}: {
  caravan: Caravan
  canAssign?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [year, setYear] = useState(String(currentPersianYear()))
  const [manager, setManager] = useState<CaravanManagerChoice | null>(null)
  const [maleCount, setMaleCount] = useState(String(caravan.maleCount ?? 0))
  const [femaleCount, setFemaleCount] = useState(String(caravan.femaleCount ?? 0))

  const rows = [...(caravan.years ?? [])].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    return (a.manager?.fullName ?? '').localeCompare(b.manager?.fullName ?? '', 'fa')
  })

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['caravan', caravan.id] }),
      queryClient.invalidateQueries({ queryKey: ['caravans'] }),
      queryClient.invalidateQueries({ queryKey: ['caravans', 'mine'] }),
    ])
  }

  const assign = useMutation({
    mutationFn: async () => {
      const payload = {
        year: Number(toLatinDigits(year)),
        managerUserId: manager?.id ?? null,
        maleCount: Number(toLatinDigits(maleCount)) || 0,
        femaleCount: Number(toLatinDigits(femaleCount)) || 0,
      }
      await api.post(`/caravans/${caravan.id}/years`, payload)
      return payload
    },
    onSuccess: async (payload) => {
      setManager(null)
      toast.success(
        payload.managerUserId
          ? t('caravans.managerAssigned')
          : t('caravans.activityYearAssigned'),
      )
      await refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function confirmRemove(yearId: string) {
    confirmToast({
      title: t('caravans.confirmUnassignYear'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/caravans/${caravan.id}/years/${yearId}`)
          toast.success(t('caravans.yearUnassigned'))
          await refresh()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return (
    <div className="space-y-4">
      {canAssign ? (
      <article className={`p-6 ${cardClassName}`}>
        <p className="mb-4 text-sm leading-6 text-ink-600">{t('caravans.activityYearsHint')}</p>
        <AppForm
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            assign.mutate()
          }}
          className="space-y-4"
        >
          <CaravanActivityYearField year={year} onYearChange={setYear} />
          <CaravanManagerPicker
            value={manager}
            onChange={setManager}
            emptyLabel={t('caravans.withoutManager')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField icon={UserRound} label={t('caravans.maleCount')} htmlFor="year-maleCount">
              <input
                id="year-maleCount"
                type="number"
                min={0}
                className={fieldClassName}
                value={maleCount}
                onChange={(event) => setMaleCount(toLatinDigits(event.target.value))}
              />
            </FormField>
            <FormField icon={UserPlus} label={t('caravans.femaleCount')} htmlFor="year-femaleCount">
              <input
                id="year-femaleCount"
                type="number"
                min={0}
                className={fieldClassName}
                value={femaleCount}
                onChange={(event) => setFemaleCount(toLatinDigits(event.target.value))}
              />
            </FormField>
          </div>
          <FormActions submitLabel={t('caravans.assign')} submitting={assign.isPending} />
        </AppForm>
      </article>
      ) : null}

      <TableCard empty={t('caravans.noActivityYears')} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.year')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.managerName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.maleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.femaleCount')}</th>
              {canAssign ? (
                <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
                <td className="px-4 py-3">
                  {yearManagerLabel(caravan, item.year, t('caravans.unassignedManager'))}
                </td>
                <td className="px-4 py-3">{formatNumber(item.maleCount ?? 0, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.femaleCount ?? 0, locale)}</td>
                {canAssign ? (
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    icon
                    aria-label={t('common.delete')}
                    title={t('common.delete')}
                    onClick={() => confirmRemove(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  )
}
