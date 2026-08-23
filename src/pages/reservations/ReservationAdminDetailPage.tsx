import {
  Building2,
  CalendarDays,
  Check,
  ClipboardCheck,
  Footprints,
  Hash,
  HeartHandshake,
  IdCard,
  Lock,
  MapPin,
  Phone,
  RotateCcw,
  Route,
  ScrollText,
  Shield,
  StickyNote,
  Ticket,
  UserRound,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  EntityNameSubtitle,
  FormField,
  LoadingState,
  PageHeader,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { DateText } from '../../components/ui/DateText'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import {
  reservationMemberInsuranceStatuses,
  type Reservation,
  type ReservationInsuranceSummary,
  type ReservationMember,
  type ReservationMemberInsuranceStatus,
  type ReservationPerson,
  type ReservationStatus,
} from '../../types/app'
import { contactRoles, validReturnStatuses } from './reservation-steps'
import { InsuranceStatusBadge, ReservationStatusBadge } from './ReservationStatusBadge'
import { ReservationTimeline } from './ReservationTimeline'

const contactRoleIcons: Record<(typeof contactRoles)[number], LucideIcon> = {
  DEPUTY: UserRoundCog,
  CLERIC: ScrollText,
  CULTURAL: StickyNote,
  SECURITY: Shield,
  RECEPTION: HeartHandshake,
}

function personName(person?: ReservationPerson | null) {
  return person?.fullName || '—'
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className={`${cardClassName} mb-4 overflow-hidden p-5 sm:p-6`}>
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_18px_rgba(46,189,182,0.28)]">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  span,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  span?: '2' | 'full'
}) {
  const spanClass =
    span === 'full' ? 'sm:col-span-2 lg:col-span-3' : span === '2' ? 'sm:col-span-2' : ''
  return (
    <div className={`flex items-start gap-3 rounded-2xl bg-cream-50 px-3.5 py-3 ${spanClass}`}>
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-[0_4px_10px_rgba(20,40,40,0.04)]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-ink-900">{value}</dd>
      </div>
    </div>
  )
}

function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
}

export function ReservationAdminDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [decisionNote, setDecisionNote] = useState('')
  const [returnStatus, setReturnStatus] = useState('')

  const query = useQuery({
    queryKey: ['reservations', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${id}`)
      return data
    },
  })
  const insurance = useQuery({
    queryKey: ['reservations', id, 'insurance'],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ReservationInsuranceSummary>(`/reservations/${id}/insurance`)
      return data
    },
  })

  const reservation = query.data

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['reservations', id] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', 'admin'] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', 'dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['reservations', id, 'insurance'] })
  }

  const approve = useMutation({
    mutationFn: async (notes?: string) => {
      const { data } = await api.post<Reservation>(
        `/reservations/${id}/approve`,
        notes ? { notes } : {},
      )
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.reviewContinued'))
      setDecisionNote('')
      refresh()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const reject = useMutation({
    mutationFn: async (reason: string) => {
      const { data } = await api.post<Reservation>(`/reservations/${id}/reject`, { reason })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.rejected'))
      setDecisionNote('')
      refresh()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const returnTo = useMutation({
    mutationFn: async (status: ReservationStatus) => {
      const { data } = await api.post<Reservation>(`/reservations/${id}/return`, { status })
      return data
    },
    onSuccess: () => {
      toast.success(t('reservations.returned'))
      setReturnStatus('')
      refresh()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  if (!id || query.isLoading) return <LoadingState />
  if (query.isError || !reservation) {
    return <p className="text-sm text-red-700">{t('common.error')}</p>
  }

  const pendingReview = reservation.status === 'PENDING_MANAGEMENT_REVIEW'
  const rejected = reservation.status === 'REJECTED'
  const returnOptions = validReturnStatuses(reservation.type)
  const members = reservation.members ?? []
  const contacts = reservation.caravanContacts ?? []
  const busy = approve.isPending || reject.isPending

  function trimmedNote() {
    return decisionNote.trim()
  }

  function submitApprove() {
    const notes = trimmedNote()
    confirmToast({
      title: t('reservations.reviewContinueConfirm'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => approve.mutate(notes.length >= 2 ? notes : undefined),
    })
  }

  function submitReject() {
    const reason = trimmedNote()
    if (reason.length < 2) {
      toast.error(t('reservations.rejectReasonRequired'))
      return
    }
    confirmToast({
      title: t('reservations.rejectConfirm'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: () => reject.mutate(reason),
    })
  }

  function submitReturn(event: FormEvent) {
    event.preventDefault()
    if (!returnStatus) return
    confirmToast({
      title: t('reservations.returnConfirm'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => returnTo.mutate(returnStatus as ReservationStatus),
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={t('reservations.adminDetails')}
        subtitle={
          <EntityNameSubtitle
            name={`${personName(reservation.createdBy)} · ${n(reservation.year)}`}
            icon={ScrollText}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ReservationStatusBadge status={reservation.status} />
        <span className="text-sm text-ink-600">{t(`reservations.types.${reservation.type}`)}</span>
      </div>

      {reservation.basicInfoLockedAt ? (
        <div className={`${cardClassName} mb-4 flex items-start gap-3 p-4`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
            <Lock className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-ink-900">{t('reservations.lockedTitle')}</p>
            <p className="mt-1 text-sm text-ink-600">{t('reservations.lockedAdminHint')}</p>
          </div>
        </div>
      ) : null}

      {rejected && reservation.rejectionReason ? (
        <div className={`${cardClassName} mb-4 flex items-start gap-3 border-red-100 p-4`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <X className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-red-700">{t('reservations.rejectedTitle')}</p>
            <p className="mt-1 text-sm text-ink-800">{reservation.rejectionReason}</p>
          </div>
        </div>
      ) : null}

      <SectionCard icon={UserRound} title={t('reservations.applicantSection')}>
        <InfoGrid>
          <InfoTile
            icon={UserRound}
            label={t('users.fullName')}
            value={personName(reservation.createdBy)}
            span="2"
          />
          <InfoTile
            icon={IdCard}
            label={t('users.nationalId')}
            value={reservation.createdBy.nationalId ?? '—'}
          />
          <InfoTile
            icon={Phone}
            label={t('users.phone')}
            value={reservation.createdBy.phone ?? '—'}
          />
          <InfoTile
            icon={UserRound}
            label={t('users.gender')}
            value={
              reservation.createdBy.gender
                ? t(`userGenders.${reservation.createdBy.gender}`)
                : '—'
            }
          />
        </InfoGrid>
      </SectionCard>

      <SectionCard icon={MapPin} title={t('reservations.travelSection')}>
        <InfoGrid>
          <InfoTile icon={Hash} label={t('reservations.year')} value={n(reservation.year)} />
          <InfoTile
            icon={Ticket}
            label={t('reservations.type')}
            value={t(`reservations.types.${reservation.type}`)}
          />
          <InfoTile
            icon={Users}
            label={t('reservations.totalCount')}
            value={n(reservation.totalCount)}
          />
          <InfoTile
            icon={CalendarDays}
            label={t('reservations.walkingStartDate')}
            value={
              reservation.walkingStartDate ? <DateText value={reservation.walkingStartDate} /> : '—'
            }
          />
          <InfoTile
            icon={CalendarDays}
            label={t('reservations.stayStartDate')}
            value={reservation.stayStartDate ? <DateText value={reservation.stayStartDate} /> : '—'}
          />
          <InfoTile
            icon={CalendarDays}
            label={t('reservations.stayEndDate')}
            value={reservation.stayEndDate ? <DateText value={reservation.stayEndDate} /> : '—'}
          />
          <InfoTile
            icon={MapPin}
            label={t('reservations.originCity')}
            value={nameOf(reservation.originCity)}
          />
          <InfoTile
            icon={Route}
            label={t('reservations.walkingRoute')}
            value={reservation.walkingRoute?.name ?? t('reservations.walkingRouteNone')}
            span="2"
          />
          <InfoTile icon={Footprints} label={t('reservations.maleCount')} value={n(reservation.maleCount)} />
          <InfoTile icon={Users} label={t('reservations.femaleCount')} value={n(reservation.femaleCount)} />
          {reservation.caravan ? (
            <InfoTile
              icon={Building2}
              label={t('reservations.caravan')}
              value={reservation.caravan.name}
            />
          ) : null}
          {reservation.caravanManager ? (
            <InfoTile
              icon={UserRoundCog}
              label={t('reservations.caravanManager')}
              value={personName(reservation.caravanManager)}
              span={reservation.caravan ? undefined : '2'}
            />
          ) : null}
        </InfoGrid>
      </SectionCard>

      {pendingReview ? (
        <SectionCard
          icon={ClipboardCheck}
          title={t('reservations.reviewDecision')}
          subtitle={t('reservations.reviewDecisionHint')}
        >
          <div className="space-y-4 rounded-2xl bg-cream-50 p-4">
            <FormField
              icon={StickyNote}
              label={t('reservations.reviewNotes')}
              htmlFor="decision-note"
            >
              <textarea
                id="decision-note"
                className={`${fieldClassName} bg-white`}
                rows={4}
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder={t('reservations.reviewNotesPlaceholder')}
              />
            </FormField>
            <p className="text-xs text-ink-500">{t('reservations.reviewNotesHint')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button type="button" className="w-full" disabled={busy} onClick={submitApprove}>
                <Check className="size-4" aria-hidden />
                {t('reservations.approveFile')}
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full"
                disabled={busy}
                onClick={submitReject}
              >
                <X className="size-4" aria-hidden />
                {t('reservations.rejectFile')}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {rejected ? (
        <SectionCard
          icon={RotateCcw}
          title={t('reservations.returnForCorrection')}
          subtitle={t('reservations.returnHint')}
        >
          <AppForm onSubmit={submitReturn} className="space-y-3" autoFocusFirst={false}>
            <FormField icon={RotateCcw} label={t('reservations.returnTarget')}>
              <SearchSelect
                value={returnStatus}
                onChange={setReturnStatus}
                options={returnOptions.map((status) => ({
                  value: status,
                  label: t(`reservations.statuses.${status}`),
                }))}
                placeholder={t('reservations.returnTarget')}
              />
            </FormField>
            <Button type="submit" disabled={!returnStatus || returnTo.isPending}>
              <RotateCcw className="size-4" aria-hidden />
              {t('reservations.returnForCorrection')}
            </Button>
          </AppForm>
        </SectionCard>
      ) : null}

      {insurance.data && insurance.data.total > 0 ? (
        <SectionCard icon={Shield} title={t('reservations.insuranceSection')}>
          <InfoGrid>
            <InfoTile icon={Users} label={t('reservations.totalCount')} value={n(insurance.data.total)} />
            <InfoTile
              icon={Check}
              label={t('reservations.insuranceApproved')}
              value={n(insurance.data.approved)}
            />
            <InfoTile
              icon={Shield}
              label={t('reservations.insurancePaid')}
              value={n(insurance.data.paid)}
            />
            <InfoTile
              icon={ClipboardCheck}
              label={t('reservations.insurancePending')}
              value={n(insurance.data.pending)}
            />
            <InfoTile
              icon={X}
              label={t('reservations.insuranceRejected')}
              value={n(insurance.data.rejected)}
            />
          </InfoGrid>
        </SectionCard>
      ) : null}

      {reservation.type !== 'INDIVIDUAL' && members.length ? (
        <SectionCard icon={Users} title={t('reservations.membersSection')}>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <th className="px-3 py-2.5 text-start font-medium">{t('users.fullName')}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t('users.nationalId')}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t('users.gender')}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t('reservations.insuranceSection')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-line">
                    <td className="px-3 py-2.5">{member.user.fullName}</td>
                    <td className="px-3 py-2.5">{member.user.nationalId ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      {member.user.gender ? t(`userGenders.${member.user.gender}`) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <InsuranceStatusBadge status={member.insuranceStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reservation.status === 'INSURANCE' ? (
            <AdminInsuranceEditor
              reservationId={reservation.id}
              members={members}
              onSaved={refresh}
            />
          ) : null}
        </SectionCard>
      ) : members.length ? (
        <SectionCard icon={Shield} title={t('reservations.insuranceSection')}>
          <div className="flex items-center gap-3">
            <InsuranceStatusBadge status={members[0].insuranceStatus} />
          </div>
          {reservation.status === 'INSURANCE' ? (
            <AdminInsuranceEditor
              reservationId={reservation.id}
              members={members}
              onSaved={refresh}
            />
          ) : null}
        </SectionCard>
      ) : null}

      {reservation.type === 'CARAVAN' && contacts.length ? (
        <SectionCard icon={UserRoundCog} title={t('reservations.contactsSection')}>
          <InfoGrid>
            {contactRoles.map((role) => {
              const current = contacts.find((item) => item.role === role)
              const RoleIcon = contactRoleIcons[role]
              return (
                <InfoTile
                  key={role}
                  icon={RoleIcon}
                  label={t(`caravans.contactRoles.${role}`)}
                  value={current ? personName(current.user) : t('caravans.contactEmpty')}
                />
              )
            })}
          </InfoGrid>
        </SectionCard>
      ) : null}

      {reservation.managementNotes || reservation.caravanManagerNotes ? (
        <SectionCard icon={StickyNote} title={t('reservations.notesSection')}>
          <InfoGrid>
            {reservation.managementNotes ? (
              <InfoTile
                icon={ClipboardCheck}
                label={t('reservations.managementNotes')}
                value={reservation.managementNotes}
                span="full"
              />
            ) : null}
            {reservation.caravanManagerNotes ? (
              <InfoTile
                icon={UserRoundCog}
                label={t('reservations.caravanManagerNotes')}
                value={reservation.caravanManagerNotes}
                span="full"
              />
            ) : null}
          </InfoGrid>
        </SectionCard>
      ) : null}

      <ReservationTimeline reservation={reservation} />
    </div>
  )
}

function AdminInsuranceEditor({
  reservationId,
  members,
  onSaved,
}: {
  reservationId: string
  members: ReservationMember[]
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [drafts, setDrafts] = useState<Record<string, { status: ReservationMemberInsuranceStatus; note: string }>>({})

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        members.map((item) => [
          item.id,
          { status: item.insuranceStatus, note: item.insuranceManualNote ?? '' },
        ]),
      ),
    )
  }, [members])

  const save = useMutation({
    mutationFn: async (memberId: string) => {
      const draft = drafts[memberId]
      await api.patch(`/reservations/${reservationId}/members/${memberId}/insurance`, {
        status: draft.status,
        note: draft.note.trim() || null,
      })
    },
    onSuccess: () => {
      toast.success(t('reservations.insuranceStatusSaved'))
      onSaved()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      {members.map((member) => {
        const draft = drafts[member.id] ?? {
          status: member.insuranceStatus,
          note: member.insuranceManualNote ?? '',
        }
        return (
          <div key={member.id} className="space-y-2 rounded-2xl bg-cream-50 p-3">
            <p className="text-sm font-medium text-ink-900">{member.user.fullName}</p>
            <FormField icon={RotateCcw} label={t('reservations.steps.insurance')}>
              <SearchSelect
                value={draft.status}
                onChange={(next) =>
                  setDrafts((current) => ({
                    ...current,
                    [member.id]: {
                      ...draft,
                      status: next as ReservationMemberInsuranceStatus,
                    },
                  }))
                }
                options={Object.values(reservationMemberInsuranceStatuses).map((status) => ({
                  value: status,
                  label:
                    status === 'PENDING'
                      ? t('reservations.insurancePending')
                      : status === 'PAID'
                        ? t('reservations.insurancePaid')
                        : status === 'APPROVED'
                          ? t('reservations.insuranceApproved')
                          : t('reservations.insuranceRejected'),
                }))}
                placeholder={t('reservations.steps.insurance')}
              />
            </FormField>
            {draft.status === 'REJECTED' ? (
              <FormField icon={X} label={t('reservations.rejectReason')} htmlFor={`ins-note-${member.id}`}>
                <textarea
                  id={`ins-note-${member.id}`}
                  className={fieldClassName}
                  rows={2}
                  value={draft.note}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [member.id]: { ...draft, note: event.target.value },
                    }))
                  }
                  required
                  minLength={2}
                />
              </FormField>
            ) : null}
            <Button
              type="button"
              variant="soft"
              disabled={save.isPending}
              onClick={() => {
                if (draft.status === 'REJECTED' && draft.note.trim().length < 2) {
                  toast.error(t('reservations.rejectReasonRequired'))
                  return
                }
                save.mutate(member.id)
              }}
            >
              {t('reservations.insuranceSetStatus')}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
