import { Check, Copy, Trash2, UserCheck, Users, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import { Button } from '../../components/ui/Form'
import { formCardBodyClassName } from '../../components/ui/FormLayout'
import { ActionsTh, TableCard, actionsColClassName } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
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
import { AccommodationYearModal } from './AccommodationYearModal'

export function AccommodationYearContactsModal({
  accommodation,
  year,
  onClose,
}: {
  accommodation: Accommodation
  year: number
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const manualRef = useRef<HTMLDivElement>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [drafts, setDrafts] = useState<
    Record<AccommodationContactRole, AccommodationContactDraft>
  >(() =>
    accommodationContactDraftsFromInitial(
      accommodation.yearContacts?.filter((item) => item.year === year),
    ),
  )
  const [activeRole, setActiveRole] = useState<AccommodationContactRole>(
    firstIncompleteContactRole(drafts),
  )

  const yearRows = (accommodation.yearContacts ?? [])
    .filter((item) => item.year === year)
    .sort((a, b) => a.role.localeCompare(b.role))
  const yearContactSignature = yearRows.map((item) => `${item.id}:${item.userId}`).join('|')

  useEffect(() => {
    const nextDrafts = accommodationContactDraftsFromInitial(
      accommodation.yearContacts?.filter((item) => item.year === year),
    )
    setDrafts(nextDrafts)
    setActiveRole((current) =>
      nextDrafts[current] ? current : firstIncompleteContactRole(nextDrafts),
    )
  }, [year, yearContactSignature])

  useEffect(() => {
    if (manualOpen) {
      manualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [manualOpen])

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
        year,
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

  function openManual() {
    const nextDrafts = accommodationContactDraftsFromInitial(
      accommodation.yearContacts?.filter((item) => item.year === year),
    )
    setDrafts(nextDrafts)
    setActiveRole(firstIncompleteContactRole(nextDrafts))
    setManualOpen(true)
  }

  function confirmDeleteContact(contactId: string) {
    confirmToast({
      title: t('accommodations.confirmDeleteYearContact'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/accommodations/${accommodation.id}/year-contacts/${contactId}`)
          toast.success(t('accommodations.yearContactDeleted'))
          await refresh()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return (
    <AccommodationYearModal
      icon={Users}
      title={t('accommodations.liaisons')}
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className={formCardBodyClassName}>
        <p className="text-sm leading-6 text-ink-600">
          {t('accommodations.yearContactsChooseHint')}
        </p>
        <p className="text-sm font-medium text-ink-700">
          {t('accommodations.year')}: {formatNumber(year, locale)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="soft"
            className="max-w-full whitespace-normal"
            disabled={setYearContacts.isPending}
            onClick={() => setYearContacts.mutate({ mode: 'manager' })}
          >
            <UserCheck className="size-4 shrink-0" aria-hidden />
            {t('accommodations.yearContactsFromManager')}
          </Button>
          <Button
            type="button"
            variant="soft"
            className="max-w-full whitespace-normal"
            disabled={setYearContacts.isPending}
            onClick={() => setYearContacts.mutate({ mode: 'fromAccommodation' })}
          >
            <Copy className="size-4 shrink-0" aria-hidden />
            {t('accommodations.yearContactsFromAccommodation')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="max-w-full whitespace-normal"
            onClick={openManual}
          >
            <Users className="size-4 shrink-0" aria-hidden />
            {t('accommodations.yearContactsManual')}
          </Button>
        </div>

        {manualOpen ? (
          <div ref={manualRef} className="space-y-4">
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
                <Check className="size-4" aria-hidden />
                {t('accommodations.saveYearContacts')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setManualOpen(false)}>
                <X className="size-4" aria-hidden />
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : null}

        <TableCard empty={t('accommodations.noYearContacts')} hasRows={yearRows.length > 0} rowClick={false}>
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactRole')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactPilgrim')}</th>
                <ActionsTh />
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
                  <td className={actionsColClassName}>
                    <div data-row-actions className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        icon
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        onClick={() => confirmDeleteContact(item.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </AccommodationYearModal>
  )
}
