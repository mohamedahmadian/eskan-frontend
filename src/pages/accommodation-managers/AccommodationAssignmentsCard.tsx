import { Building2, CalendarDays, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function AccommodationAssignmentsCard({
  user,
  queryKey,
  apiBase,
}: {
  user: ManagedUser
  queryKey: string
  apiBase: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [accommodationId, setAccommodationId] = useState('')
  const [year, setYear] = useState(String(currentPersianYear()))

  const accommodations = useQuery({
    queryKey: ['accommodations', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Accommodation[]>('/accommodations')
      return data
    },
  })

  const rows = [...(user.accommodations ?? [])].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    return a.accommodation.name.localeCompare(b.accommodation.name, 'fa')
  })

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: [queryKey] })
  }

  const assign = useMutation({
    mutationFn: async () =>
      api.post(`${apiBase}/${user.id}/accommodations`, {
        accommodationId,
        year: Number(toLatinDigits(year)),
      }),
    onSuccess: async () => {
      setAccommodationId('')
      toast.success(t('accommodationManagers.assigned'))
      await refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function confirmUnassign(assignmentId: string) {
    confirmToast({
      title: t('accommodationManagers.confirmUnassign'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`${apiBase}/${user.id}/accommodations/${assignmentId}`)
          toast.success(t('accommodationManagers.unassigned'))
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
          <FormField
            icon={Building2}
            label={t('accommodationManagers.selectAccommodation')}
            htmlFor="assign-accommodation"
          >
            <SearchSelect
              id="assign-accommodation"
              value={accommodationId}
              required
              placeholder={t('accommodationManagers.selectAccommodation')}
              onChange={setAccommodationId}
              options={(accommodations.data ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </FormField>
          <FormField icon={CalendarDays} label={t('accommodationManagers.year')} htmlFor="assign-year">
            <input
              id="assign-year"
              className={fieldClassName}
              inputMode="numeric"
              min={1300}
              max={1600}
              required
              value={year}
              onChange={(event) => setYear(toLatinDigits(event.target.value))}
            />
          </FormField>
          <FormActions
            submitLabel={t('accommodationManagers.assign')}
            submitting={assign.isPending}
          />
        </AppForm>
      </article>

      <TableCard
        empty={t('accommodationManagers.noAccommodations')}
        hasRows={rows.length > 0}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodationManagers.year')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
                <td className="px-4 py-3">{item.accommodation.name}</td>
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
