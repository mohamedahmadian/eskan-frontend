import {
  Copy,
  UserCheck,
  Users,
  CalendarDays,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, FormField, cardClassName, fieldClassName } from '../../components/ui/Form'
import { FormSectionTitle } from '../../components/ui/FormLayout'
import { TableCard } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import { currentPersianYear, formatNumber, toLatinDigits } from '../../lib/datetime'
import type { Accommodation } from '../../types/app'
import { PilgrimNameLink } from './PilgrimNameLink'
import {
  AccommodationContactsPanel,
  firstIncompleteContactRole,
} from './AccommodationContactsPanel'
import {
  accommodationContactDraftsFromInitial,
  toAccommodationContactPayloads,
  type AccommodationContactDraft,
  type AccommodationContactRole,
} from './accommodationContacts'

export function AccommodationYearContactsCard({
  accommodation,
}: {
  accommodation: Accommodation
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [year, setYear] = useState(String(currentPersianYear()))
  const selectedYear = Number(toLatinDigits(year)) || currentPersianYear()
  const [manualOpen, setManualOpen] = useState(false)
  const [drafts, setDrafts] = useState<
    Record<AccommodationContactRole, AccommodationContactDraft>
  >(() =>
    accommodationContactDraftsFromInitial(
      accommodation.yearContacts?.filter((item) => item.year === selectedYear),
    ),
  )
  const [activeRole, setActiveRole] = useState<AccommodationContactRole>(
    firstIncompleteContactRole(drafts),
  )

  const yearRows = (accommodation.yearContacts ?? [])
    .filter((item) => item.year === selectedYear)
    .sort((a, b) => a.role.localeCompare(b.role))

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accommodation', accommodation.id] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations'] }),
      queryClient.invalidateQueries({ queryKey: ['accommodations', 'mine'] }),
    ])
  }

  const setYearContacts = useMutation({
    mutationFn: async (payload: {
      mode: 'manager' | 'fromAccommodation' | 'manual'
      contacts?: ReturnType<typeof toAccommodationContactPayloads>
    }) =>
      api.put(`/accommodations/${accommodation.id}/year-contacts`, {
        year: selectedYear,
        ...payload,
      }),
    onSuccess: async () => {
      toast.success(t('accommodations.yearContactsSaved'))
      setManualOpen(false)
      await refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function onYearChange(next: string) {
    const latin = toLatinDigits(next)
    setYear(latin)
    const y = Number(latin) || currentPersianYear()
    const nextDrafts = accommodationContactDraftsFromInitial(
      accommodation.yearContacts?.filter((item) => item.year === y),
    )
    setDrafts(nextDrafts)
    setActiveRole(firstIncompleteContactRole(nextDrafts))
    setManualOpen(false)
  }

  return (
    <div className="space-y-4">
      <article className={`space-y-4 p-6 ${cardClassName}`}>
        <FormSectionTitle icon={Users}>{t('accommodations.sectionYearContacts')}</FormSectionTitle>
        <FormField icon={CalendarDays} label={t('accommodations.year')} htmlFor="year-contacts-year">
          <input
            id="year-contacts-year"
            className={fieldClassName}
            inputMode="numeric"
            min={1300}
            max={1600}
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="soft"
            disabled={setYearContacts.isPending}
            onClick={() => setYearContacts.mutate({ mode: 'manager' })}
          >
            <UserCheck className="size-4" aria-hidden />
            {t('accommodations.yearContactsFromManager')}
          </Button>
          <Button
            type="button"
            variant="soft"
            disabled={setYearContacts.isPending}
            onClick={() => setYearContacts.mutate({ mode: 'fromAccommodation' })}
          >
            <Copy className="size-4" aria-hidden />
            {t('accommodations.yearContactsFromAccommodation')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDrafts(
                accommodationContactDraftsFromInitial(
                  accommodation.yearContacts?.filter((item) => item.year === selectedYear),
                ),
              )
              setManualOpen(true)
            }}
          >
            <Users className="size-4" aria-hidden />
            {t('accommodations.yearContactsManual')}
          </Button>
        </div>
        <p className="text-sm text-ink-500">{t('accommodations.yearContactsHint')}</p>
      </article>

      <TableCard empty={t('accommodations.noYearContacts')} hasRows={yearRows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactRole')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactPilgrim')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('accommodations.year')}</th>
            </tr>
          </thead>
          <tbody>
            {yearRows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{t(`accommodations.contactRoles.${item.role}`)}</td>
                <td className="px-4 py-3">
                  <PilgrimNameLink
                    id={item.user?.id || item.userId}
                    name={item.user.fullName}
                  />
                </td>
                <td className="px-4 py-3">{formatNumber(item.year, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {manualOpen ? (
        <article className={`space-y-4 p-6 ${cardClassName}`}>
          <AccommodationContactsPanel
            drafts={drafts}
            activeRole={activeRole}
            onActiveRoleChange={setActiveRole}
            onDraftChange={(role, draft) =>
              setDrafts((current) => ({ ...current, [role]: draft }))
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={setYearContacts.isPending}
              onClick={() =>
                setYearContacts.mutate({
                  mode: 'manual',
                  contacts: toAccommodationContactPayloads(drafts),
                })
              }
            >
              {t('accommodations.saveYearContacts')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setManualOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </article>
      ) : null}
    </div>
  )
}
