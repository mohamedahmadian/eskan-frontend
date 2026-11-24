import { Trash2, UserPlus, UserRound, UsersRound } from 'lucide-react'
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
} from '../../components/ui/Form'
import { formCardBodyClassName } from '../../components/ui/FormLayout'
import { TableCard, actionsColClassName, ActionsTh } from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear } from '../../lib/datetime'
import {
  type Accommodation,
  type ManagedUser,
} from '../../types/app'
import { AccommodationYearModal } from './AccommodationYearModal'
import { AccommodationYearReservationsModal } from './AccommodationYearReservationsModal'

export function managerDisplayName(
  manager: Accommodation['managers'][number],
  unassignedLabel: string,
) {
  return manager.user?.fullName || unassignedLabel
}

export function AccommodationManagersCard({
  accommodation,
  users,
  canAssign = true,
}: {
  accommodation: Accommodation
  users: ManagedUser[]
  canAssign?: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [assignOpen, setAssignOpen] = useState(false)
  const [reservationsOpen, setReservationsOpen] = useState(false)
  const [userId, setUserId] = useState('')

  const rows = [...accommodation.managers].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return Number(b.isPrimary) - Number(a.isPrimary)
    const nameA = a.user?.fullName ?? ''
    const nameB = b.user?.fullName ?? ''
    return nameA.localeCompare(nameB, 'fa')
  })

  function openAssign() {
    setUserId('')
    setAssignOpen(true)
  }

  function closeAssign() {
    setAssignOpen(false)
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accommodation', accommodation.id] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodation-managers'] }),
      queryClient.invalidateQueries({
        queryKey: ['accommodation', accommodation.id, 'year-reservations'],
      }),
    ])
  }

  const assign = useMutation({
    mutationFn: async () => {
      await api.post(`/accommodations/${accommodation.id}/managers`, { userId })
      return userId
    },
    onSuccess: async () => {
      setUserId('')
      closeAssign()
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
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="soft" onClick={() => setReservationsOpen(true)}>
          <UsersRound className="size-4" aria-hidden />
          {t('accommodations.yearPilgrims')}
        </Button>
        {canAssign ? (
          <Button type="button" onClick={openAssign}>
            <UserPlus className="size-4" aria-hidden />
            {t('accommodations.assign')}
          </Button>
        ) : null}
      </div>

      <TableCard empty={t('accommodations.noManagers')} hasRows={rows.length > 0} rowClick={false}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.managerName')}</th>
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {managerDisplayName(item, t('accommodations.unassignedManager'))}
                    {item.isPrimary ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
                        {t('accommodations.primaryManager')}
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className={actionsColClassName}>
                  <div data-row-actions className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                    {canAssign ? (
                      <Button
                        type="button"
                        variant="ghost"
                        icon
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        onClick={() => confirmUnassign(item.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {assignOpen ? (
        <AccommodationYearModal
          icon={UserRound}
          title={t('accommodations.assign')}
          onClose={closeAssign}
        >
          <AppForm
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              assign.mutate()
            }}
            className={formCardBodyClassName}
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
            <FormActions
              submitLabel={t('accommodations.assign')}
              cancelLabel={t('common.cancel')}
              submitting={assign.isPending}
              onCancel={closeAssign}
            />
          </AppForm>
        </AccommodationYearModal>
      ) : null}

      {reservationsOpen ? (
        <AccommodationYearReservationsModal
          accommodation={accommodation}
          year={currentPersianYear()}
          onClose={() => setReservationsOpen(false)}
        />
      ) : null}
    </div>
  )
}
