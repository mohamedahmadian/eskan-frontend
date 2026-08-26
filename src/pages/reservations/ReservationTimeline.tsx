import {
  Ban,
  Check,
  ChevronDown,
  ClipboardCheck,
  History,
  MapPin,
  Shield,
  Undo2,
  UserRound,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateText } from '../../components/ui/DateText'
import { cardClassName } from '../../components/ui/Form'
import type { Reservation, ReservationPerson, ReservationStatus } from '../../types/app'
import {
  currentStepFromStatus,
  isStepDone,
  stepCompletedAt,
  stepCompletedBy,
  stepLabelKey,
  stepsForType,
  type ReservationStepCode,
} from './reservation-steps'

const stepIcons: Record<ReservationStepCode, LucideIcon> = {
  travel: MapPin,
  review: ClipboardCheck,
  companions: Users,
  contacts: UserRoundCog,
  insurance: Shield,
  complete: Check,
}

type TimelineState = 'done' | 'current' | 'pending' | 'rejected' | 'cancelled' | 'returned'

type TimelineItem = {
  key: string
  label: string
  at: string | null
  detail?: string
  actorName?: string | null
  state: TimelineState
  Icon: LucideIcon
}

function personName(person?: ReservationPerson | null) {
  return person?.fullName?.trim() || null
}

export function ReservationTimeline({
  reservation,
  expanded,
  onClose,
}: {
  reservation: Reservation
  expanded?: boolean
  onClose?: () => void
}) {
  const { t } = useTranslation()
  const items = buildTimelineItems(reservation, t)
  const [open, setOpen] = useState(Boolean(expanded))
  const panelId = useId()
  const alwaysOpen = Boolean(expanded)
  const showContent = alwaysOpen || open

  const heading = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_18px_rgba(46,189,182,0.28)]">
        <History className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-ink-900">{t('reservations.timeline')}</span>
        <span className="block text-xs text-ink-500">{t(`reservations.types.${reservation.type}`)}</span>
      </span>
    </>
  )

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      {alwaysOpen ? (
        <div className="flex w-full items-center gap-3 p-5 sm:p-6">
          {heading}
          {onClose ? (
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={onClose}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl text-ink-500 transition hover:bg-cream-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-3 p-5 text-start transition hover:bg-cream-50 sm:p-6"
        >
          {heading}
          <ChevronDown
            className={`size-5 shrink-0 text-ink-400 transition ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      )}
      <div
        id={panelId}
        hidden={!showContent}
        className="border-t border-line px-5 pb-5 pt-4 sm:px-6 sm:pb-6"
      >
        {items.length ? (
          <ol className="ps-1">
            {items.map((item, index) => (
              <TimelineRow key={item.key} item={item} last={index === items.length - 1} />
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-500">{t('reservations.timelineEmpty')}</p>
        )}
      </div>
    </section>
  )
}

function TimelineRow({ item, last }: { item: TimelineItem; last: boolean }) {
  const { t } = useTranslation()
  const tone = nodeTone(item.state)
  const statusLabel = statusText(item.state, t)

  return (
    <li className="relative flex gap-3 sm:gap-4">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span
          className={`relative z-10 flex size-10 items-center justify-center rounded-full border-2 ${tone.node}`}
        >
          {item.state === 'done' ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <item.Icon className="size-4" aria-hidden />
          )}
        </span>
        {last ? null : <span className={`mt-1 w-0.5 flex-1 rounded-full ${tone.line}`} aria-hidden />}
      </div>
      <article className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 ${last ? '' : 'mb-4'} ${tone.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-medium text-ink-900">{item.label}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.badge}`}>
            {statusLabel}
          </span>
        </div>
        {item.detail ? <p className="mt-1 text-sm text-ink-700">{item.detail}</p> : null}
        {item.actorName ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-700">
            <UserRound className="size-3.5 shrink-0 text-ink-400" aria-hidden />
            <span>{t('reservations.timelineActor', { name: item.actorName })}</span>
          </p>
        ) : null}
        <p className="mt-2 text-xs text-ink-500">
          {item.at ? <DateText value={item.at} withTime /> : <span>—</span>}
        </p>
      </article>
    </li>
  )
}

function nodeTone(state: TimelineState) {
  if (state === 'done') {
    return {
      node: 'border-teal-500 bg-teal-500 text-white shadow-[0_0_0_4px_rgba(46,189,182,0.16)]',
      line: 'bg-teal-200',
      card: 'border-teal-100 bg-gradient-to-e from-white to-teal-50/70',
      badge: 'bg-teal-50 text-teal-800',
    }
  }
  if (state === 'current') {
    return {
      node: 'border-teal-500 bg-white text-teal-600 shadow-[0_0_0_4px_rgba(46,189,182,0.2)]',
      line: 'bg-line',
      card: 'border-teal-300 bg-white shadow-[0_10px_24px_rgba(46,189,182,0.12)]',
      badge: 'bg-teal-500 text-white',
    }
  }
  if (state === 'rejected') {
    return {
      node: 'border-red-500 bg-red-500 text-white shadow-[0_0_0_4px_rgba(220,38,38,0.12)]',
      line: 'bg-red-100',
      card: 'border-red-100 bg-red-50/70',
      badge: 'bg-red-100 text-red-800',
    }
  }
  if (state === 'cancelled') {
    return {
      node: 'border-ink-400 bg-ink-400 text-white',
      line: 'bg-line',
      card: 'border-line bg-cream-50',
      badge: 'bg-cream-100 text-ink-700',
    }
  }
  if (state === 'returned') {
    return {
      node: 'border-amber-400 bg-amber-400 text-white shadow-[0_0_0_4px_rgba(245,158,11,0.16)]',
      line: 'bg-amber-100',
      card: 'border-amber-100 bg-amber-50/80',
      badge: 'bg-amber-100 text-amber-900',
    }
  }
  return {
    node: 'border-line bg-white text-ink-300',
    line: 'bg-line',
    card: 'border-line bg-cream-50/80',
    badge: 'bg-white text-ink-400',
  }
}

function statusText(state: TimelineState, t: (key: string) => string) {
  if (state === 'done') return t('reservations.stepDone')
  if (state === 'current') return t('reservations.timelineInProgress')
  if (state === 'rejected') return t('reservations.timelineRejected')
  if (state === 'cancelled') return t('reservations.timelineCancelled')
  if (state === 'returned') return t('reservations.returnForCorrection')
  return t('reservations.timelinePending')
}

function buildTimelineItems(
  reservation: Reservation,
  t: (key: string, opts?: Record<string, string>) => string,
): TimelineItem[] {
  const steps = stepsForType(reservation.type)
  const current = currentStepFromStatus(reservation.status, reservation.type)
  const items: TimelineItem[] = steps.map((step) => {
    const at = stepCompletedAt(step, reservation)
    const done = Boolean(at) || isStepDone(step, reservation.status, reservation.type)
    const state: TimelineState = done ? 'done' : step === current ? 'current' : 'pending'
    const actor = stepCompletedBy(step, reservation)
    return {
      key: step,
      label: t(stepLabelKey(step, reservation.type)),
      at: at ?? (step === 'travel' ? reservation.createdAt : null),
      actorName: state === 'pending' && step !== 'travel' ? null : personName(actor),
      state,
      Icon: stepIcons[step],
    }
  })

  if (reservation.status !== 'REJECTED' && reservation.returnedToStatus) {
    items.push({
      key: 'returned',
      label: t('reservations.timelineReturned', {
        status: t(`reservations.statuses.${reservation.returnedToStatus as ReservationStatus}`),
      }),
      at: null,
      state: 'returned',
      Icon: Undo2,
    })
  }

  if (reservation.rejectedAt) {
    items.push({
      key: 'rejected',
      label: t('reservations.timelineRejected'),
      at: reservation.rejectedAt,
      detail: reservation.rejectionReason
        ? `${t('reservations.rejectionReason')}: ${reservation.rejectionReason}`
        : undefined,
      actorName: personName(reservation.rejectedBy),
      state: 'rejected',
      Icon: X,
    })
  }

  if (reservation.cancelledAt) {
    items.push({
      key: 'cancelled',
      label: t('reservations.timelineCancelled'),
      at: reservation.cancelledAt,
      actorName: personName(reservation.cancelledBy),
      state: 'cancelled',
      Icon: Ban,
    })
  }

  return items
}
