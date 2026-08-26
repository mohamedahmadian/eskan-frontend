import { CalendarDays, Mars, Trash2, UserRound, Venus } from 'lucide-react'
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
import { genderTypes, type Accommodation, type GenderType, type ManagedUser } from '../../types/app'
import { managerDisplayName } from './AccommodationYearAlert'

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
          className={fieldClassName}
          inputMode="numeric"
          min={1300}
          max={1600}
          required
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
}: {
  accommodation: Accommodation
  users: ManagedUser[]
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
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

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accommodation', accommodation.id] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodation-managers'] }),
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
      <article className={`p-6 ${cardClassName}`}>
        <p className="mb-4 text-sm leading-6 text-ink-600">
          {t('accommodations.activityYearsHint')}
        </p>
        <AppForm
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            assign.mutate()
          }}
          className="space-y-4"
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
          />
          <FormActions submitLabel={t('accommodations.assign')} submitting={assign.isPending} />
        </AppForm>
      </article>

      <TableCard empty={t('accommodations.noManagers')} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.year')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.managerName')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.yearMaleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.yearFemaleCount')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
                <td className="px-4 py-3">{managerDisplayName(item, t('accommodations.unassignedManager'))}</td>
                <td className="px-4 py-3">{formatNumber(item.maleCapacity, locale)}</td>
                <td className="px-4 py-3">{formatNumber(item.femaleCapacity, locale)}</td>
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

function capacityForYear(accommodation: Accommodation, year: number) {
  const row = accommodation.managers.find((item) => item.year === year)
  return {
    male: String(row?.maleCapacity ?? accommodation.maleCapacity),
    female: String(row?.femaleCapacity ?? accommodation.femaleCapacity),
  }
}
