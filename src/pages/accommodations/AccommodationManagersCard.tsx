import { CalendarDays, Trash2, UserRound } from 'lucide-react'
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
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, toLatinDigits } from '../../lib/datetime'
import type { Accommodation, ManagedUser } from '../../types/app'
import { managerDisplayName } from './AccommodationYearAlert'

export function AccommodationManagersCard({
  accommodation,
  users,
}: {
  accommodation: Accommodation
  users: ManagedUser[]
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState('')
  const [year, setYear] = useState(String(currentPersianYear()))

  const rows = [...accommodation.managers].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    const nameA = a.user?.fullName ?? ''
    const nameB = b.user?.fullName ?? ''
    return nameA.localeCompare(nameB, 'fa')
  })

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accommodation', accommodation.id] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodation-managers'] }),
    ])
  }

  const assign = useMutation({
    mutationFn: async () =>
      api.post(`/accommodations/${accommodation.id}/managers`, {
        userId,
        year: Number(toLatinDigits(year)),
      }),
    onSuccess: async () => {
      setUserId('')
      toast.success(t('accommodations.managerAssigned'))
      await refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function confirmUnassign(assignmentId: string) {
    confirmToast({
      title: t('accommodations.confirmUnassignManager'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/accommodations/${accommodation.id}/managers/${assignmentId}`)
          toast.success(t('accommodations.managerUnassigned'))
          await refresh()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return (
    <div className="space-y-4">
      <article className={`p-6 ${cardClassName}`}>
        <AppForm
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            assign.mutate()
          }}
          className="grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
        >
          <FormField icon={UserRound} label={t('accommodations.selectManager')} htmlFor="assign-manager">
            <SearchSelect
              id="assign-manager"
              value={userId}
              required
              placeholder={t('accommodations.selectManager')}
              onChange={setUserId}
              options={users.map((user) => ({
                value: user.id,
                label: `${user.fullName} — ${user.username}`,
              }))}
            />
          </FormField>
          <FormField icon={CalendarDays} label={t('accommodations.year')} htmlFor="assign-manager-year">
            <input
              id="assign-manager-year"
              className={fieldClassName}
              inputMode="numeric"
              min={1300}
              max={1600}
              required
              value={year}
              onChange={(event) => setYear(toLatinDigits(event.target.value))}
            />
          </FormField>
          <FormActions submitLabel={t('accommodations.assign')} submitting={assign.isPending} />
        </AppForm>
      </article>

      <TableCard empty={t('accommodations.noManagers')} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.year')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.managerName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
                <td className="px-4 py-3">{managerDisplayName(item, t('accommodations.unassignedManager'))}</td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    icon
                    aria-label={t('common.delete')}
                    title={t('common.delete')}
                    onClick={() => confirmUnassign(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  )
}
