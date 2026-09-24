import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SmsPreviewModal } from '../../components/sms/SmsPreviewModal'
import { Button } from '../../components/ui/Form'
import { useSendSms } from '../../hooks/useSendSms'
import { getApiErrorMessage } from '../../lib/api'
import { formatDate } from '../../lib/datetime'
import type {
  Reservation,
  ReservationRoutePlacementStage,
  ReservationStayAccommodation,
  UserGender,
} from '../../types/app'

type Translate = (key: string, opts?: Record<string, string>) => string

const emptyValue = '—'

function coordPair(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null
  return { lat: match[1], lng: match[2] }
}

export function toNeshanMapLink(raw: string | null | undefined) {
  const value = raw?.trim() ?? ''
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value

  const query = value.match(/^neshan:\/\/\?(.+)$/i)?.[1]
  if (query) {
    const params = new URLSearchParams(query)
    const origin = params.get('origin')?.trim() ?? ''
    const destination = params.get('destination')?.trim() ?? ''
    const vehicle = params.get('vehicle')?.trim() ?? ''
    if (coordPair(origin) && coordPair(destination)) {
      const link = `https://nshn.ir/?origin=${origin}&destination=${destination}`
      return vehicle ? `${link}&vehicle=${vehicle}` : link
    }
    const point =
      coordPair(destination) ||
      coordPair(params.get('ll')?.trim() ?? '') ||
      coordPair(`${params.get('lat') ?? ''},${params.get('lng') ?? ''}`)
    if (point) return `https://nshn.ir/?lat=${point.lat}&lng=${point.lng}`
  }

  const pair = coordPair(value)
  if (pair) return `https://nshn.ir/?lat=${pair.lat}&lng=${pair.lng}`
  return value
}

function stayManagerName(accommodation: ReservationStayAccommodation | undefined, year: number) {
  const managers = accommodation?.managers ?? []
  if (!managers.length) return ''
  const ranked = [...managers].sort((a, b) => {
    if (a.year === year && b.year !== year) return -1
    if (b.year === year && a.year !== year) return 1
    return Number(b.isPrimary) - Number(a.isPrimary)
  })
  return ranked[0]?.user?.fullName?.trim() || ''
}

function formatStayDates(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: string,
  t: Translate,
) {
  const from = start ? formatDate(start, locale) : ''
  const to = end ? formatDate(end, locale) : ''
  if (from && to) return t('reservations.smsStayDatesRange', { start: from, end: to })
  return from || to
}

export function reservationSmsPhone(reservation: Reservation) {
  return reservation.caravanManager?.phone?.trim() || reservation.createdBy.phone?.trim() || ''
}

export function buildMashhadPlacementSmsBody(
  reservation: Reservation,
  locale: string,
  t: Translate,
) {
  const dates = formatStayDates(reservation.stayStartDate, reservation.stayEndDate, locale, t)
  const seen = new Set<string>()
  const places: ReservationStayAccommodation[] = []
  for (const item of reservation.allocations ?? []) {
    const place = item.accommodation
    if (!place?.id || seen.has(place.id)) continue
    seen.add(place.id)
    places.push(place)
  }

  const blocks = (places.length ? places : [undefined]).map((place) =>
    t('reservations.smsMashhadBlock', {
      name: place?.name?.trim() || emptyValue,
      manager: stayManagerName(place, reservation.year) || emptyValue,
      address: place?.address?.trim() || emptyValue,
      neshan: place?.neshanAddress?.trim() || emptyValue,
      dates: dates || emptyValue,
    }),
  )
  return blocks.join('\n\n')
}

export function buildRoutePlacementSmsBody(stages: ReservationRoutePlacementStage[], t: Translate) {
  return stages
    .map((stage) =>
      t('reservations.smsStationBlock', {
        name: stage.name?.trim() || emptyValue,
        address: stage.address?.trim() || emptyValue,
      }),
    )
    .join('\n\n')
}

function placementSmsGenderTitle(gender: UserGender, t: Translate) {
  return gender === 'FEMALE' ? t('placements.smsStayFemale') : t('placements.smsStayMale')
}

function placementPlaceBlock(place: ReservationStayAccommodation, t: Translate) {
  const lines = [
    t('placements.smsPlaceName', { name: place.name?.trim() || emptyValue }),
    t('placements.smsPlaceAddress', { address: place.address?.trim() || emptyValue }),
    t('placements.smsPlacePhone', { phone: place.phone?.trim() || emptyValue }),
  ]
  const neshan = toNeshanMapLink(place.neshanAddress)
  if (neshan) lines.push(t('placements.smsPlaceNeshan', { neshan }))
  return lines.join('\n')
}

export function buildPlacementStaySmsBody(
  allocations: { gender?: UserGender; accommodation: ReservationStayAccommodation }[],
  t: Translate,
) {
  const sections: string[] = []
  for (const gender of ['MALE', 'FEMALE'] as const) {
    const seen = new Set<string>()
    const blocks: string[] = []
    for (const item of allocations) {
      if (item.gender !== gender) continue
      const place = item.accommodation
      if (!place?.id || seen.has(place.id)) continue
      seen.add(place.id)
      blocks.push(placementPlaceBlock(place, t))
    }
    if (!blocks.length) continue
    sections.push(`${placementSmsGenderTitle(gender, t)}\n${blocks.join('\n\n')}`)
  }
  if (sections.length) return sections.join('\n\n')

  const seen = new Set<string>()
  const blocks: string[] = []
  for (const item of allocations) {
    const place = item.accommodation
    if (!place?.id || seen.has(place.id)) continue
    seen.add(place.id)
    blocks.push(placementPlaceBlock(place, t))
  }
  return blocks.join('\n\n')
}

export function ReservationPlacementSmsButton({
  title,
  phone,
  body,
  label,
}: {
  title: string
  phone: string
  body: string
  label?: string
}) {
  const { t } = useTranslation()
  const sms = useSendSms()
  const [open, setOpen] = useState(false)
  const [smsPhone, setSmsPhone] = useState('')
  const [smsBody, setSmsBody] = useState('')
  const [sending, setSending] = useState(false)

  function openSms() {
    setSmsPhone(phone)
    setSmsBody(body)
    setOpen(true)
  }

  async function sendSms() {
    const nextPhone = smsPhone.trim()
    const nextBody = smsBody.trim()
    if (!nextPhone) {
      toast.error(t('reservations.smsPhoneRequired'))
      return
    }
    if (!nextBody) {
      toast.error(t('reservations.smsBodyRequired'))
      return
    }
    setSending(true)
    try {
      await sms.mutateAsync({ phone: nextPhone, body: nextBody })
      toast.success(t('sms.queued'))
      setOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="soft" onClick={openSms}>
        <MessageSquare className="size-4" aria-hidden />
        {label ?? t('reservations.sendSms')}
      </Button>
      {open ? (
        <SmsPreviewModal
          title={title}
          phone={smsPhone}
          body={smsBody}
          sending={sending}
          rows={14}
          onPhoneChange={setSmsPhone}
          onBodyChange={setSmsBody}
          onClose={() => setOpen(false)}
          onSend={sendSms}
        />
      ) : null}
    </div>
  )
}
