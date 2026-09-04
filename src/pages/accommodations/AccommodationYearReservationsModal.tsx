import { ClipboardCheck, Eye, UserCheck, UsersRound } from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Form'
import { FormFactTile, formCardBodyClassName } from '../../components/ui/FormLayout'
import { TableCard, actionsColClassName, ActionsTh } from '../../components/ui/ListControls'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Accommodation, AccommodationYearReservation } from '../../types/app'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { ReservationTypeBadge } from '../reservations/ReservationStatusBadge'
import { AccommodationYearModal } from './AccommodationYearModal'

export function AccommodationYearReservationsModal({
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
  const nameOf = useGeoName()
  const n = (value: number) => formatNumber(value, locale)

  const query = useQuery({
    queryKey: ['accommodation', accommodation.id, 'year-reservations', year],
    queryFn: async () => {
      const { data } = await api.get<{ items: AccommodationYearReservation[]; year: number }>(
        `/accommodations/${accommodation.id}/year-reservations`,
        { params: { year } },
      )
      return data
    },
  })

  const rows = query.data?.items ?? []
  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, item) => ({
          approved: sum.approved + item.maleCount + item.femaleCount,
          placed: sum.placed + item.placedMaleCount + item.placedFemaleCount,
        }),
        { approved: 0, placed: 0 },
      ),
    [rows],
  )

  return (
    <AccommodationYearModal
      icon={UsersRound}
      title={t('accommodations.yearPilgrims')}
      subtitle={`${t('accommodations.year')} ${formatNumber(year, locale)}`}
      onClose={onClose}
      className="max-w-6xl"
    >
      <div className={formCardBodyClassName}>
        {query.isSuccess ? (
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={ClipboardCheck}
              label={t('accommodations.yearPilgrimsApprovedTotal')}
              value={n(totals.approved)}
              tone="ink"
            />
            <FormFactTile
              icon={UserCheck}
              label={t('accommodations.yearPilgrimsPlacedTotal')}
              value={n(totals.placed)}
              tone="teal"
            />
          </div>
        ) : null}
        <TableCard
          loading={query.isLoading}
          empty={
            query.isError
              ? getApiErrorMessage(query.error, t('common.error'))
              : t('accommodations.noYearReservations')
          }
          hasRows={rows.length > 0}
        >
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium">
                  {t('accommodations.yearReservationCode')}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t('accommodations.yearReservationFullName')}
                </th>
                <th className="px-4 py-3 text-start font-medium">{t('accommodations.city')}</th>
                <th className="px-4 py-3 text-start font-medium">
                  {t('reservations.walkingRoute')}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t('accommodations.yearReservationAdmission')}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t('accommodations.yearMaleCount')}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t('accommodations.yearFemaleCount')}
                </th>
                <ActionsTh />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <ReservationCodeBadge code={item.code} size="md" />
                  </td>
                  <td className="px-4 py-3">
                    <PersonName person={item.caravanManager ?? item.createdBy} />
                  </td>
                  <td className="px-4 py-3">{nameOf(item.originCity)}</td>
                  <td className="px-4 py-3">{item.walkingRoute?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <ReservationTypeBadge type={item.type} />
                  </td>
                  <td className="px-4 py-3">
                    <HeadcountPair
                      approved={item.maleCount}
                      placed={item.placedMaleCount}
                      approvedLabel={t('accommodations.yearReservationApproved')}
                      placedLabel={t('accommodations.yearReservationPlaced')}
                      format={n}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <HeadcountPair
                      approved={item.femaleCount}
                      placed={item.placedFemaleCount}
                      approvedLabel={t('accommodations.yearReservationApproved')}
                      placedLabel={t('accommodations.yearReservationPlaced')}
                      format={n}
                    />
                  </td>
                  <td className={actionsColClassName}>
                    <Link to={`/reservations/${item.id}`} data-row-view>
                      <Button type="button" variant="ghost">
                        <Eye className="size-4" aria-hidden />
                        {t('accommodations.yearReservationDetails')}
                      </Button>
                    </Link>
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

function PersonName({
  person,
}: {
  person: NonNullable<AccommodationYearReservation['caravanManager']> | AccommodationYearReservation['createdBy'] | null
}) {
  if (!person) return <span className="text-ink-400">—</span>
  const first = person.firstName.trim()
  const last = person.lastName.trim()
  if (!first && !last) {
    return <span>{person.fullName || '—'}</span>
  }
  return (
    <div className="leading-snug">
      <p className="font-medium text-ink-900">{first || '—'}</p>
      {last ? <p className="text-xs text-ink-600">{last}</p> : null}
    </div>
  )
}

function HeadcountPair({
  approved,
  placed,
  approvedLabel,
  placedLabel,
  format,
}: {
  approved: number
  placed: number
  approvedLabel: string
  placedLabel: string
  format: (value: number) => string
}) {
  return (
    <div className="min-w-[8.5rem] space-y-1">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-cream-50 px-2.5 py-1.5 ring-1 ring-line">
        <span className="text-[11px] font-medium text-ink-500">{approvedLabel}</span>
        <span className="text-sm font-semibold tabular-nums text-ink-900">{format(approved)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-teal-50 px-2.5 py-1.5 ring-1 ring-teal-100">
        <span className="text-[11px] font-medium text-teal-700">{placedLabel}</span>
        <span className="text-sm font-semibold tabular-nums text-teal-900">{format(placed)}</span>
      </div>
    </div>
  )
}
