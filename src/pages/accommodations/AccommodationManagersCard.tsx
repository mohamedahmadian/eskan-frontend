import { CalendarDays, Mars, Pencil, Trash2, UserPlus, UserRound, Users, UsersRound, Venus } from 'lucide-react'
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
  fieldClassName,
} from '../../components/ui/Form'
import { formCardBodyClassName } from '../../components/ui/FormLayout'
import { TableCard, actionsColClassName, ActionsTh } from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, toLatinDigits } from '../../lib/datetime'
import {
  genderTypes,
  type Accommodation,
  type AccommodationManagerLink,
  type GenderType,
  type ManagedUser,
} from '../../types/app'
import { managerDisplayName } from './AccommodationYearAlert'
import { AccommodationYearContactsModal } from './AccommodationYearContactsCard'
import { AccommodationYearModal } from './AccommodationYearModal'
import { AccommodationYearReservationsModal } from './AccommodationYearReservationsModal'

const capacityFieldClassName = `${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`

export function AccommodationActivityYearFields({
  year,
  onYearChange,
  userId,
  onUserIdChange,
  users,
  maleCapacity,
  onMaleCapacityChange,
  femaleCapacity,
  onFemaleCapacityChange,
  genderType,
  yearDisabled = false,
  yearInputId = 'assign-manager-year',
  managerInputId = 'assign-manager',
  maleInputId = 'assign-year-male',
  femaleInputId = 'assign-year-female',
}: {
  year: string
  onYearChange: (value: string) => void
  userId: string
  onUserIdChange: (value: string) => void
  users: ManagedUser[]
  maleCapacity: string
  onMaleCapacityChange: (value: string) => void
  femaleCapacity: string
  onFemaleCapacityChange: (value: string) => void
  genderType: GenderType
  yearDisabled?: boolean
  yearInputId?: string
  managerInputId?: string
  maleInputId?: string
  femaleInputId?: string
}) {
  const { t } = useTranslation()
  const maleDisabled = genderType === genderTypes.FEMALE
  const femaleDisabled = genderType === genderTypes.MALE
  return (
    <>
      <FormField icon={CalendarDays} label={t('accommodations.year')} htmlFor={yearInputId}>
        <input
          id={yearInputId}
          className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
          inputMode="numeric"
          min={1300}
          max={1600}
          required
          disabled={yearDisabled}
          value={year}
          onChange={(event) => onYearChange(toLatinDigits(event.target.value))}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField icon={Mars} label={t('accommodations.yearMaleCount')} htmlFor={maleInputId}>
          <input
            id={maleInputId}
            type="number"
            min={0}
            required
            disabled={maleDisabled}
            className={capacityFieldClassName}
            value={maleCapacity}
            onChange={(event) => onMaleCapacityChange(toLatinDigits(event.target.value))}
          />
        </FormField>
        <FormField icon={Venus} label={t('accommodations.yearFemaleCount')} htmlFor={femaleInputId}>
          <input
            id={femaleInputId}
            type="number"
            min={0}
            required
            disabled={femaleDisabled}
            className={capacityFieldClassName}
            value={femaleCapacity}
            onChange={(event) => onFemaleCapacityChange(toLatinDigits(event.target.value))}
          />
        </FormField>
      </div>
      <FormField icon={UserRound} label={t('accommodations.selectManager')} htmlFor={managerInputId}>
        <SearchSelect
          id={managerInputId}
          value={userId}
          placeholder={t('accommodations.withoutManager')}
          onChange={onUserIdChange}
          options={[
            { value: '', label: t('accommodations.withoutManager') },
            ...users.map((user) => ({
              value: user.id,
              label: `${user.fullName} — ${user.username}`,
            })),
          ]}
        />
      </FormField>
    </>
  )
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
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [assignOpen, setAssignOpen] = useState(false)
  const [editing, setEditing] = useState<AccommodationManagerLink | null>(null)
  const [contactsYear, setContactsYear] = useState<number | null>(null)
  const [caravansYear, setCaravansYear] = useState<number | null>(null)
  const [userId, setUserId] = useState('')
  const [year, setYear] = useState(String(currentPersianYear()))
  const [maleCapacity, setMaleCapacity] = useState(() =>
    capacityForYear(accommodation, currentPersianYear()).male,
  )
  const [femaleCapacity, setFemaleCapacity] = useState(() =>
    capacityForYear(accommodation, currentPersianYear()).female,
  )

  const rows = [...accommodation.managers].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    const nameA = a.user?.fullName ?? ''
    const nameB = b.user?.fullName ?? ''
    return nameA.localeCompare(nameB, 'fa')
  })

  function applyYear(next: string) {
    setYear(next)
    const parsed = Number(toLatinDigits(next))
    if (!Number.isFinite(parsed)) return
    const caps = capacityForYear(accommodation, parsed)
    setMaleCapacity(caps.male)
    setFemaleCapacity(caps.female)
  }

  function openAssign(row?: AccommodationManagerLink) {
    if (row) {
      setEditing(row)
      setYear(String(row.year))
      setUserId(row.userId ?? '')
      setMaleCapacity(String(row.maleCapacity))
      setFemaleCapacity(String(row.femaleCapacity))
    } else {
      setEditing(null)
      setUserId('')
      applyYear(String(currentPersianYear()))
    }
    setAssignOpen(true)
  }

  function closeAssign() {
    setAssignOpen(false)
    setEditing(null)
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
      const maleDisabled = accommodation.genderType === genderTypes.FEMALE
      const femaleDisabled = accommodation.genderType === genderTypes.MALE
      const payload = {
        userId: userId || null,
        year: Number(toLatinDigits(year)),
        maleCapacity: maleDisabled ? 0 : Number(toLatinDigits(maleCapacity)) || 0,
        femaleCapacity: femaleDisabled ? 0 : Number(toLatinDigits(femaleCapacity)) || 0,
      }
      await api.post(`/accommodations/${accommodation.id}/managers`, payload)
      return payload
    },
    onSuccess: async (payload) => {
      setUserId('')
      closeAssign()
      toast.success(
        payload.userId
          ? t('accommodations.managerAssigned')
          : t('accommodations.activityYearAssigned'),
      )
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
      <p className="text-sm leading-6 text-ink-600">{t('accommodations.activityYearsHint')}</p>
      {canAssign ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => openAssign()}>
            <UserPlus className="size-4" aria-hidden />
            {t('accommodations.assign')}
          </Button>
        </div>
      ) : null}

      <TableCard empty={t('accommodations.noManagers')} hasRows={rows.length > 0} rowClick={false}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.year')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.managerName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.yearMaleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.yearFemaleCount')}</th>
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
                <td className="px-4 py-3">
                  {managerDisplayName(item, t('accommodations.unassignedManager'))}
                </td>
                <td className="px-4 py-3">{formatNumber(item.maleCapacity, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.femaleCapacity, locale)}</td>
                <td className={actionsColClassName}>
                  <div data-row-actions className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                    <Button type="button" variant="soft" onClick={() => setContactsYear(item.year)}>
                      <Users className="size-4" aria-hidden />
                      {t('accommodations.liaisons')}
                    </Button>
                    <Button type="button" variant="soft" onClick={() => setCaravansYear(item.year)}>
                      <UsersRound className="size-4" aria-hidden />
                      {t('accommodations.yearPilgrims')}
                    </Button>
                    {canAssign ? (
                      <Button
                        type="button"
                        variant="ghost"
                        icon
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        onClick={() => openAssign(item)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    ) : null}
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
            <AccommodationActivityYearFields
              year={year}
              onYearChange={applyYear}
              userId={userId}
              onUserIdChange={setUserId}
              users={users}
              maleCapacity={maleCapacity}
              onMaleCapacityChange={setMaleCapacity}
              femaleCapacity={femaleCapacity}
              onFemaleCapacityChange={setFemaleCapacity}
              genderType={accommodation.genderType}
              yearDisabled={Boolean(editing)}
            />
            <FormActions
              submitLabel={t('accommodations.assign')}
              cancelLabel={t('common.cancel')}
              submitting={assign.isPending}
              onCancel={closeAssign}
            />
          </AppForm>
        </AccommodationYearModal>
      ) : null}

      {contactsYear != null ? (
        <AccommodationYearContactsModal
          accommodation={accommodation}
          year={contactsYear}
          onClose={() => setContactsYear(null)}
        />
      ) : null}

      {caravansYear != null ? (
        <AccommodationYearReservationsModal
          accommodation={accommodation}
          year={caravansYear}
          onClose={() => setCaravansYear(null)}
        />
      ) : null}
    </div>
  )
}

function capacityForYear(accommodation: Accommodation, year: number) {
  const row = accommodation.managers.find((item) => item.year === year)
  return {
    male: String(row?.maleCapacity ?? accommodation.maleCapacity),
    female: String(row?.femaleCapacity ?? accommodation.femaleCapacity),
  }
}
