import { Building2, Hash, MapPin, Phone, Tent, UserRound, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toDataURL } from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormCard,
  FormFactTile,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { publicAccommodationUrl } from '../../lib/public-place'
import type { Caravan, Reservation, ReservationStayAccommodation } from '../../types/app'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'

function StayBarcode({ accommodationId }: { accommodationId: string }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const value = publicAccommodationUrl(accommodationId)

  useEffect(() => {
    let cancelled = false
    toDataURL(value, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f6e6a', light: '#ffffff' },
    })
      .then((next) => {
        if (!cancelled) setUrl(next)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div className="flex flex-col items-center gap-1.5 pt-1">
      {url ? (
        <img
          src={url}
          alt=""
          className="size-32 rounded-2xl bg-white p-2 ring-1 ring-teal-100"
        />
      ) : (
        <span className="size-32 rounded-2xl bg-white ring-1 ring-teal-100" aria-hidden />
      )}
      <p className="text-[11px] font-medium text-ink-500">{t('dashboard.stayBarcode')}</p>
    </div>
  )
}

function StayBlock({
  place,
  genders,
}: {
  place: ReservationStayAccommodation
  genders: string[]
}) {
  const { t } = useTranslation()
  const address = place.address?.trim() || place.neshanAddress?.trim() || ''

  return (
    <article className="rounded-2xl bg-white/80 p-3 ring-1 ring-teal-100">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-ink-900">{place.name}</p>
        {genders.map((gender) => (
          <span
            key={gender}
            className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100"
          >
            {gender}
          </span>
        ))}
      </div>
      <FormFactTile
        icon={MapPin}
        label={t('accommodations.address')}
        value={address || '—'}
        empty={!address}
        tone="teal"
        compact
      />
      <StayBarcode accommodationId={place.id} />
    </article>
  )
}

export function ManagerLatestCaravanCard({
  reservationId,
  caravanId,
  fileCode,
}: {
  reservationId: string
  caravanId: string
  fileCode: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const caravanQuery = useQuery({
    queryKey: ['caravans', caravanId],
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${caravanId}`)
      return data
    },
  })
  const reservationQuery = useQuery({
    queryKey: ['reservations', reservationId],
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${reservationId}`)
      return data
    },
  })

  const caravan = caravanQuery.data
  const reservation = reservationQuery.data
  const stays = useMemo(() => {
    const map = new Map<string, { place: ReservationStayAccommodation; genders: string[] }>()
    for (const item of reservation?.allocations ?? []) {
      const gender =
        item.gender === 'MALE'
          ? t('reservations.placementStayMale')
          : t('reservations.placementStayFemale')
      const existing = map.get(item.accommodation.id)
      if (existing) {
        if (!existing.genders.includes(gender)) existing.genders.push(gender)
      } else {
        map.set(item.accommodation.id, { place: item.accommodation, genders: [gender] })
      }
    }
    return [...map.values()]
  }, [reservation?.allocations, t])

  const city = caravan?.city ? geoName(caravan.city) : ''
  const managerName = caravan?.manager?.fullName?.trim() || reservation?.caravanManager?.fullName || ''
  const managerPhone = caravan?.manager?.phone || reservation?.caravanManager?.phone || ''
  const male = reservation?.maleCount ?? caravan?.maleCount ?? 0
  const female = reservation?.femaleCount ?? caravan?.femaleCount ?? 0
  const total = reservation?.totalCount ?? male + female

  return (
    <FormCard
      icon={Tent}
      title={caravan?.name || t('dashboard.managerLatestCaravan')}
      subtitle={t('dashboard.managerLatestCaravan')}
      chips={<ReservationCodeBadge code={fileCode} size="sm" />}
    >
      <div className={formCardBodyClassName}>
        {caravanQuery.isLoading && !caravan ? (
          <p className="text-sm text-ink-500">{t('common.loading')}</p>
        ) : caravanQuery.isError && !caravan ? (
          <p className="text-sm text-ink-700">{t('common.error')}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={MapPin}
              label={t('caravans.city')}
              value={city || '—'}
              empty={!city}
              tone="teal"
              compact
            />
            <FormFactTile
              icon={UserRound}
              label={t('caravans.manager')}
              value={managerName || '—'}
              empty={!managerName}
              tone="mint"
              compact
            />
            {managerPhone ? (
              <FormFactTile
                icon={Phone}
                label={t('users.phone')}
                copyValue={managerPhone}
                tone="teal"
                compact
              />
            ) : null}
            <FormFactTile
              icon={Users}
              label={t('caravans.sectionCounts')}
              value={t('caravans.peopleCount', { count: formatNumber(total, locale) })}
              tone="ink"
              compact
            />
            {caravan?.licenseNumber ? (
              <FormFactTile
                icon={Hash}
                label={t('caravans.licenseNumber')}
                value={caravan.licenseNumber}
                tone="mint"
                compact
              />
            ) : null}
            {caravan?.officePhone ? (
              <FormFactTile
                icon={Phone}
                label={t('caravans.officePhone')}
                copyValue={caravan.officePhone}
                tone="ink"
                compact
              />
            ) : null}
          </div>
        )}

        {stays.length ? (
          <div className="space-y-3">
            <FormSectionTitle icon={Building2} className="mb-0">
              {t('dashboard.accommodationAssigned')}
            </FormSectionTitle>
            <div className={`grid gap-3 ${stays.length > 1 ? 'lg:grid-cols-2' : ''}`}>
              {stays.map((stay) => (
                <StayBlock key={stay.place.id} place={stay.place} genders={stay.genders} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </FormCard>
  )
}
