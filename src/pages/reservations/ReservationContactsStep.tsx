import {
  BookOpen,
  Check,
  ClipboardCheck,
  Copy,
  IdCard,
  Landmark,
  Pencil,
  Phone,
  Search,
  SearchX,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  UserRound,
  UserRoundCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  Button,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { isValidIranianNationalId, normalizeNationalId } from '../../lib/national-id'
import type {
  Reservation,
  ReservationCaravanContact,
  ReservationPerson,
} from '../../types/app'
import {
  ReservationIdentityChips,
  ReservationMetaChip,
  ReservationSectionHeader,
} from './ReservationSectionHeader'
import {
  contactRoles,
  neighborFlowStep,
  selfAssignableContactRoles,
  type ReservationStepCode,
} from './reservation-steps'
import { ReservationStepNav } from './ReservationStepNav'

type LookupResponse = { found: false } | { found: true; user: ReservationPerson }
type ContactRole = (typeof contactRoles)[number]
type Tone = 'teal' | 'mint' | 'ink'

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
    icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
  },
  mint: {
    wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
    icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190),0.24)]',
  },
  ink: {
    wrap: 'border-line bg-gradient-to-b from-cream-50 to-white',
    icon: 'bg-ink-700 text-white',
  },
}

const roleIcons: Record<ContactRole, LucideIcon> = {
  DEPUTY: UserCog,
  CLERIC: BookOpen,
  CULTURAL: Landmark,
  SECURITY: Shield,
  RECEPTION: ClipboardCheck,
}

export function ReservationContactsStep({
  reservation,
  onChanged,
  onGoToStep,
  mode = 'owner',
}: {
  reservation: Reservation
  onChanged: () => void
  onGoToStep?: (step: ReservationStepCode) => void
  mode?: 'owner' | 'admin'
}) {
  const { t } = useTranslation()
  const canSeeContacts = reservation.caravanContacts !== undefined
  const contacts = reservation.caravanContacts ?? []
  const filled = new Set(contacts.map((item) => item.role))
  const emptySelfRoles = selfAssignableContactRoles.filter((role) => !filled.has(role))
  const me = reservation.caravanManager ?? reservation.createdBy
  const showNav =
    reservation.status !== 'COMPLETED' &&
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED'
  const prevStep = neighborFlowStep(reservation.type, 'contacts', -1, reservation)
  const nextStep = neighborFlowStep(reservation.type, 'contacts', 1, reservation)

  const assignSelf = useMutation({
    mutationFn: async () => {
      if (!me.id) throw new Error(t('reservations.assignMyselfNeedId'))
      for (const role of emptySelfRoles) {
        await api.put(`/reservations/${reservation.id}/contacts`, {
          role,
          userId: me.id,
          firstName: me.firstName,
          lastName: me.lastName,
          phone: me.phone,
        })
      }
    },
    onSuccess: () => {
      toast.success(t('reservations.assignedMyself'))
      onChanged()
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : getApiErrorMessage(error, t('common.error')),
      ),
  })

  const copyFromCaravan = useMutation({
    mutationFn: async () => {
      await api.post(`/reservations/${reservation.id}/contacts/from-caravan`)
    },
    onSuccess: () => {
      toast.success(t('reservations.caravanContactsLoaded'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const removeAll = useMutation({
    mutationFn: async () => {
      await api.delete(`/reservations/${reservation.id}/contacts`)
    },
    onSuccess: () => {
      toast.success(t('reservations.allContactsRemoved'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const complete = useMutation({
    mutationFn: async () => {
      if (contactRoles.some((role) => !filled.has(role))) {
        throw new Error(t('reservations.contactsIncomplete'))
      }
      const { data } = await api.post<Reservation>(`/reservations/${reservation.id}/contacts/complete`)
      return data
    },
    onSuccess: (data) => {
      toast.success(t('reservations.contactsCompleted'))
      onChanged()
      if (nextStep && data.status !== 'CARAVAN_CONTACTS') onGoToStep?.(nextStep)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === t('reservations.contactsIncomplete')
          ? error.message
          : getApiErrorMessage(error, t('common.error')),
      ),
  })

  if (!canSeeContacts) {
    return <p className={`${cardClassName} p-4 text-sm text-ink-600`}>{t('reservations.membersHidden')}</p>
  }

  return (
    <ContactsFrame
      reservation={reservation}
      contacts={contacts}
      hint={t(mode === 'admin' ? 'reservations.adminEditHint' : 'reservations.contactsStepHint')}
      footer={
        showNav && (prevStep || nextStep) ? (
          <ReservationStepNav
            nextPending={complete.isPending}
            onPrev={prevStep && onGoToStep ? () => onGoToStep(prevStep) : undefined}
            onNext={() => complete.mutate()}
          />
        ) : null
      }
    >
      <div className="flex flex-wrap gap-2">
        {emptySelfRoles.length ? (
          <Button
            type="button"
            variant="soft"
            disabled={!me.id || assignSelf.isPending}
            onClick={() =>
              confirmToast({
                title: t('reservations.confirmAssignMyself'),
                confirmLabel: t('common.yes'),
                cancelLabel: t('common.cancel'),
                onConfirm: () => assignSelf.mutate(),
              })
            }
          >
            <UserPlus className="size-4" aria-hidden />
            {t('reservations.assignMyself')}
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={!reservation.caravanId || copyFromCaravan.isPending}
          onClick={() =>
            confirmToast({
              title: t('reservations.confirmUseCaravanContacts'),
              confirmLabel: t('common.yes'),
              cancelLabel: t('common.cancel'),
              onConfirm: () => copyFromCaravan.mutate(),
            })
          }
        >
          <Copy className="size-4" aria-hidden />
          {t('reservations.useCaravanContacts')}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!contacts.length || removeAll.isPending}
          onClick={() =>
            confirmToast({
              title: t('reservations.confirmRemoveAllContacts'),
              confirmLabel: t('common.yesDelete'),
              cancelLabel: t('common.cancel'),
              confirmVariant: 'danger',
              onConfirm: () => removeAll.mutate(),
            })
          }
        >
          <Trash2 className="size-4" aria-hidden />
          {t('reservations.removeAllContacts')}
        </Button>
      </div>
      <ContactsRoles
        reservationId={reservation.id}
        contacts={contacts}
        onChanged={onChanged}
      />
    </ContactsFrame>
  )
}

export function ReservationContactsSummary({
  reservation,
  hint,
  readonly,
  footer,
}: {
  reservation: Reservation
  hint?: string
  readonly?: boolean
  footer?: ReactNode
}) {
  const contacts = reservation.caravanContacts ?? []

  return (
    <ContactsFrame
      reservation={reservation}
      contacts={contacts}
      hint={hint}
      readonly={readonly}
      footer={
        footer ? <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div> : null
      }
    >
      <ContactsRoles contacts={contacts} />
    </ContactsFrame>
  )
}

function ContactsFrame({
  reservation,
  contacts,
  hint,
  readonly,
  footer,
  children,
}: {
  reservation: Reservation
  contacts: ReservationCaravanContact[]
  hint?: string
  readonly?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const assigned = contacts.length
  const remaining = Math.max(0, contactRoles.length - assigned)

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <ReservationSectionHeader
        icon={UserRoundCog}
        title={t('reservations.steps.contacts')}
        hint={hint}
        readonly={readonly}
        chips={
          <ReservationIdentityChips
            reservation={reservation}
            extra={
              <ReservationMetaChip
                icon={UserPlus}
                label={t('reservations.remainingCount', { count: n(remaining) })}
              />
            }
          />
        }
      />
      <div className="space-y-5 p-5 sm:p-6">
        <section>
          <SectionTitle icon={UserRoundCog}>{t('reservations.contactsRolesTitle')}</SectionTitle>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MetricTile
              icon={Check}
              label={t('reservations.contactsAssigned')}
              value={t('reservations.countProgress', {
                have: n(assigned),
                need: n(contactRoles.length),
              })}
              unit={t('reservations.people')}
              tone="teal"
            />
            <MetricTile
              icon={UserPlus}
              label={t('reservations.contactsRemaining')}
              value={n(remaining)}
              unit={t('reservations.people')}
              tone="mint"
            />
            <MetricTile
              icon={Users}
              label={t('reservations.contactsTotal')}
              value={n(contactRoles.length)}
              unit={t('reservations.people')}
              tone="ink"
            />
          </div>
        </section>
        {children}
      </div>
      {footer}
    </section>
  )
}

function ContactsRoles({
  reservationId,
  contacts,
  onChanged,
}: {
  reservationId?: string
  contacts: ReservationCaravanContact[]
  onChanged?: () => void
}) {
  const { t } = useTranslation()
  const editable = Boolean(reservationId && onChanged)
  const [openRole, setOpenRole] = useState<ContactRole | null>(null)

  return (
    <section>
      <SectionTitle icon={Users}>{t('reservations.contactsListTitle')}</SectionTitle>
      <div className="space-y-3">
        {contactRoles.map((role) => {
          const current = contacts.find((item) => item.role === role)
          const open = openRole === role || (!current && openRole === null)
          return (
            <ContactRoleCard
              key={role}
              role={role}
              current={current}
              reservationId={reservationId}
              open={open}
              onOpen={() => setOpenRole(role)}
              onChanged={
                editable
                  ? () => {
                      setOpenRole(null)
                      onChanged?.()
                    }
                  : undefined
              }
            />
          )
        })}
      </div>
    </section>
  )
}

function ContactRoleCard({
  reservationId,
  role,
  current,
  open,
  onOpen,
  onChanged,
}: {
  reservationId?: string
  role: ContactRole
  current?: ReservationCaravanContact
  open: boolean
  onOpen: () => void
  onChanged?: () => void
}) {
  const { t } = useTranslation()
  const RoleIcon = roleIcons[role]
  const [nationalId, setNationalId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'found' | 'new'>('idle')
  const [looking, setLooking] = useState(false)
  const [missingNationalId, setMissingNationalId] = useState<string | null>(null)
  const editable = Boolean(reservationId && onChanged)
  const showLookup = editable && open
  const showDetails = status === 'found' || status === 'new'

  useEffect(() => {
    if (showLookup) return
    setNationalId('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setStatus('idle')
    setMissingNationalId(null)
  }, [showLookup])

  async function lookup(event?: FormEvent) {
    event?.preventDefault()
    const id = normalizeNationalId(nationalId)
    if (!isValidIranianNationalId(id)) {
      toast.error(t('users.nationalIdInvalid'))
      return
    }
    setLooking(true)
    try {
      const { data } = await api.post<LookupResponse>('/pilgrims/identity-lookup', {
        nationalId: id,
      })
      if (data.found) {
        setMissingNationalId(null)
        setFirstName(data.user.firstName)
        setLastName(data.user.lastName)
        setPhone(data.user.phone ?? '')
        setStatus('found')
        return
      }
      setFirstName('')
      setLastName('')
      setPhone('')
      setMissingNationalId(id)
      setStatus('new')
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setLooking(false)
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!reservationId) return
      await api.put(`/reservations/${reservationId}/contacts`, {
        role,
        nationalId: normalizeNationalId(nationalId),
        firstName,
        lastName,
        phone: phone || null,
      })
    },
    onSuccess: () => {
      toast.success(t('caravans.contactSave'))
      setNationalId('')
      setFirstName('')
      setLastName('')
      setPhone('')
      setStatus('idle')
      setMissingNationalId(null)
      onChanged?.()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  return (
    <article
      className={
        current && !showLookup
          ? 'flex flex-col gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between'
          : `rounded-2xl border border-line bg-gradient-to-b from-cream-50 to-white p-4${
              !showLookup && !current && editable ? ' cursor-pointer' : ''
            }`
      }
      onClick={
        !showLookup && !current && editable
          ? () => onOpen()
          : undefined
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
            current && !showLookup
              ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
              : 'bg-white text-teal-700 ring-1 ring-teal-100'
          }`}
        >
          <RoleIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-ink-900">{t(`caravans.contactRoles.${role}`)}</p>
            {role === 'DEPUTY' ? (
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
                {t('reservations.contactRequired')}
              </span>
            ) : null}
          </div>
          {current && !showLookup ? (
            <>
              <p className="mt-0.5 text-sm font-medium text-ink-800">{current.user.fullName}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-500">
                {current.user.nationalId ? (
                  <CopyableDigits value={current.user.nationalId} />
                ) : null}
                {current.user.phone ? (
                  <CopyableDigits value={current.user.phone} />
                ) : null}
              </div>
            </>
          ) : showLookup ? null : (
            <p className="mt-0.5 text-xs text-ink-500">{t('caravans.contactEmpty')}</p>
          )}
        </div>
      </div>

      {!showLookup && current && editable ? (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Button type="button" className="!h-8 !px-2.5 !py-1 !text-xs" onClick={() => onOpen()}>
            <Pencil className="size-3.5" aria-hidden />
            {t('reservations.changeContact')}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="!h-8 !px-2.5 !py-1 !text-xs"
            onClick={() => {
              if (!reservationId || !onChanged || !current) return
              confirmToast({
                title: t('reservations.confirmRemoveContact', {
                  role: t(`caravans.contactRoles.${role}`),
                }),
                confirmLabel: t('common.yesDelete'),
                cancelLabel: t('common.cancel'),
                confirmVariant: 'danger',
                onConfirm: async () => {
                  try {
                    await api.delete(`/reservations/${reservationId}/contacts/${role}`)
                    toast.success(t('reservations.contactRemoved'))
                    onChanged()
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, t('common.error')))
                  }
                },
              })
            }}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {t('common.delete')}
          </Button>
        </div>
      ) : null}

      {showLookup ? (
        <AppForm
          autoFocusFirst={false}
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (showDetails) {
              save.mutate()
              return
            }
            void lookup()
          }}
        >
          <FormField
            icon={IdCard}
            label={t('reservations.contactLookupByNationalId', {
              role: t(`caravans.contactRoles.${role}`),
            })}
            htmlFor={`contact-${role}-nid`}
          >
            <div className="flex w-1/2 min-w-0 items-stretch gap-2">
              <input
                id={`contact-${role}-nid`}
                className={`min-w-0 flex-1 ${fieldClassName}`}
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
                inputMode="numeric"
                data-enter-ignore={showDetails ? '' : undefined}
              />
              <Button
                type={showDetails ? 'button' : 'submit'}
                className="shrink-0"
                disabled={looking}
                onClick={showDetails ? () => void lookup() : undefined}
              >
                <Search className="size-4" aria-hidden />
                {looking ? t('reservations.looking') : t('reservations.lookup')}
              </Button>
            </div>
          </FormField>
          {status === 'new' && missingNationalId ? (
            <NationalIdNotFoundNotice nationalId={missingNationalId} />
          ) : null}
          {showDetails ? (
            <div className="space-y-4 rounded-2xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white p-4 shadow-[0_12px_28px_rgba(20,40,40,0.1)]">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
                  {status === 'found' ? (
                    <UserRound className="size-4" aria-hidden />
                  ) : (
                    <UserPlus className="size-4" aria-hidden />
                  )}
                </span>
                <p className="pt-2 text-sm font-semibold text-ink-900">
                  {status === 'found'
                    ? t('reservations.found', { name: `${firstName} ${lastName}`.trim() })
                    : t('reservations.newContactTitle')}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <FormField icon={UserRound} label={t('users.firstName')} htmlFor={`contact-${role}-first`}>
                  <input
                    id={`contact-${role}-first`}
                    className={fieldClassName}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required={status === 'new'}
                    disabled={status === 'found'}
                  />
                </FormField>
                <FormField icon={UserRound} label={t('users.lastName')} htmlFor={`contact-${role}-last`}>
                  <input
                    id={`contact-${role}-last`}
                    className={fieldClassName}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required={status === 'new'}
                    disabled={status === 'found'}
                  />
                </FormField>
                <FormField icon={Phone} label={t('users.phone')} htmlFor={`contact-${role}-phone`}>
                  <input
                    id={`contact-${role}-phone`}
                    className={fieldClassName}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </FormField>
                <Button type="submit" className="shrink-0" disabled={save.isPending}>
                  <Check className="size-4" aria-hidden />
                  {t('caravans.contactSave')}
                </Button>
              </div>
            </div>
          ) : null}
        </AppForm>
      ) : null}
    </article>
  )
}

function NationalIdNotFoundNotice({ nationalId }: { nationalId: string }) {
  const { t } = useTranslation()
  return (
    <aside
      className="relative overflow-hidden rounded-[22px] border border-gold-100 bg-gradient-to-b from-gold-50 via-white to-cream-50 p-4 shadow-[0_12px_28px_rgba(232,184,58,0.14)]"
      role="status"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-e from-gold-400 via-gold-500 to-teal-400"
        aria-hidden
      />
      <div className="flex items-start gap-3 pt-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gold-100 bg-white text-gold-600 shadow-sm">
          <SearchX className="size-5" aria-hidden />
        </span>
        <p className="pt-2 text-sm font-semibold leading-7 text-ink-900">
          {t('reservations.nationalIdNotFoundBefore')}
          <span className="mx-1.5 inline-flex items-center rounded-lg bg-white px-2 py-0.5 font-bold tracking-wide text-ink-900 shadow-sm ring-1 ring-gold-100">
            <CopyableDigits value={nationalId} />
          </span>
          {t('reservations.nationalIdNotFoundAfter')}
        </p>
      </div>
    </aside>
  )
}

function SectionTitle({
  icon: Icon,
  children,
  className = 'mb-2.5',
}: {
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={`inline-flex items-center gap-2 text-xs font-semibold text-ink-600 ${className}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {children}
    </h3>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${colors.wrap}`}>
      <span className={`flex size-9 items-center justify-center rounded-xl ${colors.icon}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
      <p className="text-[10px] text-ink-400">{unit}</p>
    </article>
  )
}
