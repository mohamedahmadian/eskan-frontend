import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { confirmToast } from '../../components/ui/confirmToast'
import { Button, LoadingState, cardClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { PreviousReservationMembers } from '../../types/app'

export function PreviousMembersPanel({
  reservationId,
  remainingMale,
  remainingFemale,
  onImported,
}: {
  reservationId: string
  remainingMale: number
  remainingFemale: number
  onImported: () => void
}) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [transferring, setTransferring] = useState(false)

  const query = useQuery({
    queryKey: ['reservations', reservationId, 'previous-members'],
    queryFn: async () => {
      const { data } = await api.get<PreviousReservationMembers>(
        `/reservations/${reservationId}/members/previous`,
      )
      return data
    },
  })

  const members = query.data?.members ?? []

  useEffect(() => {
    if (!query.data) return
    setSelected(query.data.members.filter((item) => !item.alreadyMember).map((item) => item.userId))
  }, [query.data])

  const selectedMembers = members.filter((item) => selected.includes(item.userId) && !item.alreadyMember)
  const selectedMale = selectedMembers.filter((item) => item.user.gender === 'MALE').length
  const selectedFemale = selectedMembers.filter((item) => item.user.gender === 'FEMALE').length
  const overflow = selectedMale > remainingMale || selectedFemale > remainingFemale

  function transfer() {
    if (!selectedMembers.length) {
      toast.error(t('reservations.previousNoneSelected'))
      return
    }
    if (overflow) {
      toast.error(t('reservations.excelOverflow'))
      return
    }
    confirmToast({
      title: t('reservations.previousTransfer', { count: n(selectedMembers.length) }),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => void runTransfer(),
    })
  }

  async function runTransfer() {
    setTransferring(true)
    try {
      await api.post(`/reservations/${reservationId}/members/copy-previous`, {
        userIds: selectedMembers.map((item) => item.userId),
      })
      toast.success(t('reservations.copiedPrevious'))
      await queryClient.invalidateQueries({
        queryKey: ['reservations', reservationId, 'previous-members'],
      })
      onImported()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className={`${cardClassName} p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink-900">{t('reservations.previousMembers')}</p>
          <p className="mt-1 text-xs text-ink-500">
            {query.data?.reservation
              ? `${t('reservations.previousMembersYear', { year: n(query.data.reservation.year) })} · ${t('reservations.previousMembersCount', { count: n(members.length) })}`
              : t('reservations.previousMembersEmpty')}
          </p>
        </div>
        <Button type="button" variant="soft" disabled={!members.length} onClick={() => setOpen((value) => !value)}>
          {open ? t('reservations.previousHide') : t('reservations.previousShow')}
        </Button>
      </div>
      {open ? (
        <div className="mt-4 space-y-3">
          {query.isLoading ? <LoadingState /> : null}
          {members.map((item) => (
            <CheckboxField
              key={item.userId}
              checked={item.alreadyMember ? false : selected.includes(item.userId)}
              disabled={item.alreadyMember}
              onChange={(checked) =>
                setSelected((current) =>
                  checked
                    ? [...current, item.userId]
                    : current.filter((id) => id !== item.userId),
                )
              }
              label={
                <span>
                  {item.user.fullName}
                  {item.alreadyMember ? (
                    <span className="mt-1 block text-xs text-ink-500">
                      {t('reservations.previousAlready')}
                    </span>
                  ) : null}
                </span>
              }
            />
          ))}
          {overflow ? <p className="text-sm text-red-700">{t('reservations.excelOverflow')}</p> : null}
          <Button
            type="button"
            disabled={transferring || !selectedMembers.length || overflow}
            onClick={transfer}
          >
            {t('reservations.previousTransfer', { count: n(selectedMembers.length) })}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
