import axios from 'axios'
import { api } from '../../lib/api'
import type {
  Paginated,
  PilgrimPilgrimageHistoryItem,
  ReservationListItem,
  ReservationStatus,
} from '../../types/app'

/** Keep the overlap logic, but do not enforce it until this is set back to true. */
export const RESERVATION_DATE_OVERLAP_CHECK_ENABLED = false

export type ReservationDateSpan = {
  id: string
  code: string
  status: ReservationStatus
  walkingStartDate: string | null
  stayStartDate: string | null
  stayEndDate: string | null
}

type DateFields = {
  walkingStartDate?: string | null
  stayStartDate?: string | null
  stayEndDate?: string | null
}

function toSpan(row: ReservationDateSpan): ReservationDateSpan {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    walkingStartDate: row.walkingStartDate,
    stayStartDate: row.stayStartDate,
    stayEndDate: row.stayEndDate,
  }
}

export function reservationTripRange(row: DateFields) {
  const start = row.walkingStartDate || row.stayStartDate || ''
  const end = row.stayEndDate || ''
  if (!start || !end) return null
  return { start, end }
}

export function reservationRangesOverlap(
  left: { start: string; end: string },
  right: { start: string; end: string },
) {
  return left.start <= right.end && right.start <= left.end
}

export function isActiveForDateOverlap(row: Pick<ReservationDateSpan, 'status'>) {
  return row.status !== 'CANCELLED'
}

export function findOverlappingReservation(
  candidate: DateFields,
  others: ReservationDateSpan[],
  excludeId?: string,
) {
  if (!RESERVATION_DATE_OVERLAP_CHECK_ENABLED) return null
  const range = reservationTripRange(candidate)
  if (!range) return null
  for (const row of others) {
    if (excludeId && row.id === excludeId) continue
    if (!isActiveForDateOverlap(row)) continue
    const other = reservationTripRange(row)
    if (other && reservationRangesOverlap(range, other)) return row
  }
  return null
}

async function safeList(load: () => Promise<ReservationDateSpan[]>) {
  try {
    return await load()
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return []
    throw error
  }
}

export async function fetchSubjectReservationSpans(options: {
  forSelf: boolean
  subjectId?: string
  subjectNationalId?: string | null
}): Promise<ReservationDateSpan[]> {
  const byId = new Map<string, ReservationDateSpan>()
  const add = (rows: ReservationDateSpan[]) => {
    for (const row of rows) byId.set(row.id, row)
  }

  if (options.forSelf) {
    const { data } = await api.get<Paginated<ReservationListItem>>('/reservations/mine', {
      params: { page: 1, pageSize: 100 },
    })
    add(data.items.map(toSpan))
    return [...byId.values()]
  }

  const requests: Promise<ReservationDateSpan[]>[] = []

  if (options.subjectNationalId) {
    requests.push(
      api
        .get<Paginated<ReservationListItem>>('/reservations', {
          params: { q: options.subjectNationalId, page: 1, pageSize: 100 },
        })
        .then(({ data }) => data.items.map(toSpan)),
    )
  }

  if (options.subjectId) {
    requests.push(
      api
        .get<Paginated<ReservationListItem>>('/reservations', {
          params: { caravanManagerId: options.subjectId, page: 1, pageSize: 100 },
        })
        .then(({ data }) => data.items.map(toSpan)),
    )
    requests.push(
      safeList(async () => {
        const { data } = await api.get<Paginated<PilgrimPilgrimageHistoryItem>>(
          `/pilgrims/${options.subjectId}/pilgrimage-history`,
          { params: { page: 1, pageSize: 100 } },
        )
        return data.items.map(toSpan)
      }),
    )
  }

  const batches = await Promise.all(requests)
  for (const batch of batches) add(batch)
  return [...byId.values()]
}
