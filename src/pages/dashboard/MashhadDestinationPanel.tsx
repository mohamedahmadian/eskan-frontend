import { Building2, Hourglass, MapPin, Mars, Phone, UserRound, Venus } from 'lucide-react'
import { type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormFactTile } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type {
  Reservation,
  ReservationAllocationSummary,
  ReservationStayAccommodation,
  UserGender,
} from '../../types/app'

function stayManager(accommodation: ReservationStayAccommodation | undefined, year: number) {
  const managers = accommodation?.managers ?? []
  if (!managers.length) return null
  const ranked = [...managers].sort((a, b) => {
    if (a.year === year && b.year !== year) return -1
    if (b.year === year && a.year !== year) return 1
    return Number(b.isPrimary) - Number(a.isPrimary)
  })
  const user = ranked[0]?.user
  const name = user?.fullName?.trim() || null
  const phone = user?.phone?.trim() || null
  if (!name && !phone) return null
  return { name, phone }
}

function AllocationCard({
  allocation,
  year,
  locale,
}: {
  allocation: ReservationAllocationSummary
  year: number
  locale: string
}) {
  const { t } = useTranslation()
  const place = allocation.accommodation
  const manager = stayManager(place, year)
  const GenderIcon = allocation.gender === 'MALE' ? Mars : Venus
  const genderLabel =
    allocation.gender === 'MALE'
      ? t('reservations.placementStayMale')
      : t('reservations.placementStayFemale')
  const lat = place.latitude
  const lng = place.longitude
  const hasPoint = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)

  return (
    <article className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 to-white p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
          <Building2 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-ink-900">{place.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-teal-800">
            <GenderIcon className="size-3.5 shrink-0" aria-hidden />
            {genderLabel}
            <span className="text-ink-500">
              · {t('accommodations.peopleCount', { count: formatNumber(allocation.headcount, locale) })}
            </span>
          </p>
        </div>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <FormFactTile
          icon={MapPin}
          label={t('accommodations.address')}
          value={place.address?.trim() || '—'}
          tone="teal"
        />
        <FormFactTile
          icon={Phone}
          label={t('accommodations.phone')}
          copyValue={place.phone}
          tone="mint"
        />
        <FormFactTile
          icon={UserRound}
          label={t('accommodations.managerName')}
          value={manager?.name || '—'}
          tone="ink"
        />
        <FormFactTile
          icon={Phone}
          label={t('dashboard.accommodationManagerPhone')}
          copyValue={manager?.phone}
          tone="mint"
        />
      </div>
      {hasPoint ? (
        <OsmMapPicker
          latitude={String(lat)}
          longitude={String(lng)}
          onChange={() => undefined}
          variant="always"
          readOnly
          showShrineDistance
          pointLabel={t('dashboard.stayMapLabel')}
          heightClass="h-64 sm:h-80 lg:h-[28rem]"
        />
      ) : null}
    </article>
  )
}

function PendingGender({ gender }: { gender: UserGender }) {
  const { t } = useTranslation()
  const label =
    gender === 'MALE' ? t('reservations.placementStayMale') : t('reservations.placementStayFemale')
  return (
    <p className="flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 px-3 py-2.5 text-sm text-ink-700">
      <Hourglass className="size-4 shrink-0 text-teal-600" aria-hidden />
      {t('dashboard.accommodationPendingGender', { gender: label })}
    </p>
  )
}

export function MashhadDestinationPanel({
  reservationId,
  arrivalAction,
}: {
  reservationId: string
  arrivalAction?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const query = useQuery({
    queryKey: ['reservations', reservationId],
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${reservationId}`)
      return data
    },
  })

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {arrivalAction}
        <p className="text-sm text-ink-500">{t('common.loading')}</p>
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="space-y-3">
        {arrivalAction}
        <p className="text-sm text-ink-700">{t('common.error')}</p>
      </div>
    )
  }

  const reservation = query.data
  if (!reservation.requestsAccommodation) {
    return (
      <div className="space-y-3">
        {arrivalAction}
        <p className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm leading-7 text-ink-700">
          {t('dashboard.accommodationNotRequested')}
        </p>
      </div>
    )
  }

  const allocations = reservation.allocations ?? []
  const maleNeeded = reservation.maleCount || reservation.requestedMaleCount
  const femaleNeeded = reservation.femaleCount || reservation.requestedFemaleCount
  const male = allocations.filter((item) => item.gender === 'MALE')
  const female = allocations.filter((item) => item.gender === 'FEMALE')

  if (!allocations.length) {
    return (
      <div className="space-y-3">
        {arrivalAction}
        <div className="rounded-[22px] border border-teal-200 bg-gradient-to-b from-teal-50 via-white to-mint-50 px-5 py-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
            <Hourglass className="size-5" aria-hidden />
          </span>
          <p className="mx-auto mt-3 max-w-xl text-base font-bold leading-8 text-ink-900">
            {t('dashboard.accommodationPending')}
          </p>
        </div>
      </div>
    )
  }

  const showMale = maleNeeded > 0 || male.length > 0
  const showFemale = femaleNeeded > 0 || female.length > 0

  return (
    <div className="space-y-3">
      {arrivalAction}
      <p className="text-sm font-semibold text-ink-800">{t('dashboard.accommodationAssigned')}</p>
      <div className={`grid min-w-0 gap-3 ${showMale && showFemale ? 'xl:grid-cols-2' : ''}`}>
        {showMale ? (
          <div className="min-w-0 space-y-3">
            {male.map((allocation) => (
              <AllocationCard
                key={allocation.id}
                allocation={allocation}
                year={reservation.year}
                locale={locale}
              />
            ))}
            {maleNeeded > 0 && male.length === 0 ? <PendingGender gender="MALE" /> : null}
          </div>
        ) : null}
        {showFemale ? (
          <div className="min-w-0 space-y-3">
            {female.map((allocation) => (
              <AllocationCard
                key={allocation.id}
                allocation={allocation}
                year={reservation.year}
                locale={locale}
              />
            ))}
            {femaleNeeded > 0 && female.length === 0 ? <PendingGender gender="FEMALE" /> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
