import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  IdCard,
  Landmark,
  Phone,
  Search,
  Shield,
  UserCog,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, FormField, fieldClassName, inputClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { api, getApiErrorMessage } from '../../lib/api'
import { parseDigitString } from '../../lib/datetime'
import {
  isValidIranianNationalId,
  normalizeNationalId,
} from '../../lib/national-id'
import type { ManagedUser } from '../../types/app'
import {
  caravanContactRoles,
  emptyContactDraft,
  isContactComplete,
  type CaravanContactDraft,
  type CaravanContactRole,
} from './caravanContacts'

type LookupResponse =
  | { found: false }
  | {
      found: true
      user: Pick<
        ManagedUser,
        'id' | 'firstName' | 'lastName' | 'fullName' | 'nationalId' | 'phone' | 'birthDate'
      >
    }

const roleIcons: Record<CaravanContactRole, LucideIcon> = {
  DEPUTY: UserCog,
  CLERIC: BookOpen,
  CULTURAL: Landmark,
  SECURITY: Shield,
  RECEPTION: ClipboardCheck,
}

function nextIncompleteRole(
  drafts: Record<CaravanContactRole, CaravanContactDraft>,
  from: CaravanContactRole,
): CaravanContactRole | null {
  const start = caravanContactRoles.indexOf(from)
  for (let i = 1; i <= caravanContactRoles.length; i += 1) {
    const role = caravanContactRoles[(start + i) % caravanContactRoles.length]
    if (!isContactComplete(drafts[role])) return role
  }
  return null
}

export function firstIncompleteContactRole(
  drafts: Record<CaravanContactRole, CaravanContactDraft>,
): CaravanContactRole {
  return (
    caravanContactRoles.find((role) => !isContactComplete(drafts[role])) ??
    caravanContactRoles[0]
  )
}

function personInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}` || '؟'
}

export function CaravanContactsPanel({
  drafts,
  activeRole,
  onActiveRoleChange,
  onDraftChange,
}: {
  drafts: Record<CaravanContactRole, CaravanContactDraft>
  activeRole: CaravanContactRole
  onActiveRoleChange: (role: CaravanContactRole) => void
  onDraftChange: (role: CaravanContactRole, draft: CaravanContactDraft) => void
}) {
  const { t } = useTranslation()
  const draft = drafts[activeRole]
  const roleLabel = t(`caravans.contactRoles.${activeRole}`)
  const RoleIcon = roleIcons[activeRole]
  const nationalIdRef = useRef<HTMLInputElement>(null)
  const complete = isContactComplete(draft)
  const [assignmentAlert, setAssignmentAlert] = useState<{
    role: CaravanContactRole
    name: string
    nextRole: CaravanContactRole | null
  } | null>(null)

  useEffect(() => {
    if (draft.status === 'idle' || draft.status === 'looking') {
      nationalIdRef.current?.focus()
    }
  }, [activeRole, draft.status])

  function announceAssignment(
    role: CaravanContactRole,
    name: string,
    updatedDrafts: Record<CaravanContactRole, CaravanContactDraft>,
  ) {
    const nextRole = nextIncompleteRole(updatedDrafts, role)
    setAssignmentAlert({ role, name, nextRole })
    if (nextRole) onActiveRoleChange(nextRole)
  }

  async function lookup(rawNationalId?: string) {
    const nationalId = normalizeNationalId(rawNationalId ?? draft.nationalId)
    if (!isValidIranianNationalId(nationalId)) {
      toast.error(t('users.nationalIdInvalid'))
      return
    }

    onDraftChange(activeRole, {
      ...emptyContactDraft(),
      nationalId,
      status: 'looking',
    })
    try {
      const { data } = await api.post<LookupResponse>('/pilgrims/identity-lookup', {
        nationalId,
      })
      if (data.found) {
        const nextDraft: CaravanContactDraft = {
          nationalId,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone ?? '',
          birthDate: data.user.birthDate?.slice(0, 10) ?? '',
          userId: data.user.id,
          status: 'found',
        }
        const updated = { ...drafts, [activeRole]: nextDraft }
        onDraftChange(activeRole, nextDraft)
        announceAssignment(activeRole, data.user.fullName, updated)
        return
      }
      onDraftChange(activeRole, {
        ...emptyContactDraft(),
        nationalId,
        status: 'new',
      })
      toast.message(t('caravans.contactNotFound'))
    } catch (error) {
      onDraftChange(activeRole, {
        ...emptyContactDraft(),
        nationalId,
        status: 'idle',
      })
      toast.error(getApiErrorMessage(error, t('common.error')))
    }
  }

  function clearContact() {
    onDraftChange(activeRole, emptyContactDraft())
    nationalIdRef.current?.focus()
  }

  function saveNewContact() {
    if (!isContactComplete(draft)) {
      toast.error(t('caravans.contactIncomplete', { role: roleLabel }))
      return
    }
    const name = [draft.firstName, draft.lastName].filter(Boolean).join(' ')
    announceAssignment(activeRole, name, drafts)
  }

  return (
    <div className="flex min-h-[22rem] flex-col gap-4">
      <div className="flex flex-1 flex-col justify-center space-y-4 rounded-2xl border border-line bg-gradient-to-b from-white to-cream-50/80 p-5 shadow-[0_8px_24px_rgba(20,40,40,0.04)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-sm">
            <RoleIcon className="size-5" aria-hidden />
          </span>
          <p className="text-base font-semibold text-ink-900">{roleLabel}</p>
          {!complete ? (
            <p className="max-w-sm text-sm text-ink-600">
              {t('caravans.contactSelectHint', { role: roleLabel })}
            </p>
          ) : null}
        </div>

        {complete ? (
          <AssignedPersonCard
            draft={draft}
            fromSystem={draft.status === 'found'}
            onClear={clearContact}
          />
        ) : null}

        {(draft.status === 'idle' || draft.status === 'looking') && !complete ? (
          <FormField
            icon={IdCard}
            label={t('users.nationalId')}
            htmlFor={`contact-${activeRole}-nationalId`}
          >
            <div className="flex gap-2">
              <input
                ref={nationalIdRef}
                id={`contact-${activeRole}-nationalId`}
                className={`${fieldClassName} digit-field`}
                value={draft.nationalId}
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                disabled={draft.status === 'looking'}
                onChange={(e) => {
                  const nationalId = parseDigitString(e.target.value).slice(0, 10)
                  onDraftChange(activeRole, {
                    ...emptyContactDraft(),
                    nationalId,
                    status: 'idle',
                  })
                  if (nationalId.length === 10) {
                    void lookup(nationalId)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void lookup(draft.nationalId)
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                icon
                disabled={draft.status === 'looking'}
                onClick={() => void lookup()}
                aria-label={t('caravans.contactLookup')}
              >
                <Search className="size-4" />
              </Button>
            </div>
          </FormField>
        ) : null}

        {draft.status === 'looking' ? (
          <p className="text-center text-sm text-ink-500">{t('caravans.contactLooking')}</p>
        ) : null}

        {draft.status === 'new' && !complete ? (
          <div className="space-y-4" data-enter-ignore>
            <p className="rounded-2xl border border-gold-200 bg-gold-50/70 px-3 py-2 text-center text-xs text-ink-700">
              {t('caravans.contactNewHint')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={UserRound}
                label={t('users.firstName')}
                htmlFor={`contact-${activeRole}-firstName`}
              >
                <input
                  id={`contact-${activeRole}-firstName`}
                  className={inputClassName()}
                  value={draft.firstName}
                  required
                  onChange={(e) =>
                    onDraftChange(activeRole, { ...draft, firstName: e.target.value })
                  }
                />
              </FormField>
              <FormField
                icon={UserRound}
                label={t('users.lastName')}
                htmlFor={`contact-${activeRole}-lastName`}
              >
                <input
                  id={`contact-${activeRole}-lastName`}
                  className={inputClassName()}
                  value={draft.lastName}
                  required
                  onChange={(e) =>
                    onDraftChange(activeRole, { ...draft, lastName: e.target.value })
                  }
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={Phone}
                label={t('users.phone')}
                htmlFor={`contact-${activeRole}-phone`}
              >
                <input
                  id={`contact-${activeRole}-phone`}
                  className={`${inputClassName()} digit-field`}
                  value={draft.phone}
                  dir="ltr"
                  required
                  onChange={(e) =>
                    onDraftChange(activeRole, { ...draft, phone: e.target.value })
                  }
                />
              </FormField>
              <FormField
                icon={Calendar}
                label={t('pilgrims.birthDate')}
                htmlFor={`contact-${activeRole}-birthDate`}
              >
                <PersianDateField
                  id={`contact-${activeRole}-birthDate`}
                  value={draft.birthDate || undefined}
                  onChange={(iso) =>
                    onDraftChange(activeRole, { ...draft, birthDate: iso ?? '' })
                  }
                />
              </FormField>
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="ghost" onClick={clearContact}>
                <X className="size-4" aria-hidden />
                {t('caravans.contactClear')}
              </Button>
              <Button type="button" onClick={saveNewContact}>
                <Check className="size-4" aria-hidden />
                {t('caravans.contactSave')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {caravanContactRoles.map((role) => {
          const item = drafts[role]
          const done = isContactComplete(item)
          const active = role === activeRole
          const Icon = roleIcons[role]
          return (
            <button
              key={role}
              type="button"
              onClick={() => onActiveRoleChange(role)}
              className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition ${
                active
                  ? 'border-teal-400 bg-teal-50 shadow-sm ring-2 ring-teal-200'
                  : done
                    ? 'border-teal-200 bg-white'
                    : 'border-line bg-cream-50 hover:border-teal-200'
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full border-2 ${
                  done
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : active
                      ? 'border-teal-300 bg-white text-teal-600'
                      : 'border-line bg-white text-ink-400'
                }`}
                aria-hidden
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : <Icon className="size-3.5" />}
              </span>
              <span className="text-[11px] font-medium leading-tight text-ink-800 sm:text-xs">
                {t(`caravans.contactRoles.${role}`)}
              </span>
              <span
                className={`min-h-[1rem] max-w-full truncate text-[10px] leading-tight ${
                  done ? 'text-ink-500' : 'text-transparent'
                }`}
              >
                {done ? item.lastName || '—' : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {assignmentAlert ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950 shadow-sm"
        >
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
            <CheckCircle2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="font-semibold">
              {t('caravans.contactAssignedTitle', {
                role: t(`caravans.contactRoles.${assignmentAlert.role}`),
              })}
            </p>
            <p className="mt-1 text-teal-900/90">
              {assignmentAlert.nextRole
                ? t('caravans.contactAssignedNext', {
                    name: assignmentAlert.name,
                    nextRole: t(`caravans.contactRoles.${assignmentAlert.nextRole}`),
                  })
                : t('caravans.contactAssignedDone', {
                    name: assignmentAlert.name,
                  })}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AssignedPersonCard({
  draft,
  fromSystem,
  onClear,
}: {
  draft: CaravanContactDraft
  fromSystem: boolean
  onClear: () => void
}) {
  const { t } = useTranslation()
  const fullName = [draft.firstName, draft.lastName].filter(Boolean).join(' ')

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-teal-50 bg-teal-50/70 px-4 py-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
            {personInitials(draft.firstName, draft.lastName)}
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="truncate text-base font-semibold text-ink-900">{fullName}</p>
            <p className="mt-0.5 text-xs text-teal-800">
              {fromSystem ? t('caravans.contactStatusFound') : t('caravans.contactStatusNew')}
            </p>
          </div>
        </div>

        <div className="grid gap-2 p-3 sm:grid-cols-2">
          <FactChip
            icon={IdCard}
            label={t('users.nationalId')}
            value={<CopyableDigits value={draft.nationalId} />}
          />
          <FactChip
            icon={Phone}
            label={t('users.phone')}
            value={<CopyableDigits value={draft.phone} />}
          />
          <FactChip icon={UserRound} label={t('users.firstName')} value={draft.firstName} />
          <FactChip icon={UserRound} label={t('users.lastName')} value={draft.lastName} />
          <div className="sm:col-span-2">
            <FactChip
              icon={Calendar}
              label={t('pilgrims.birthDate')}
              value={<DateText value={draft.birthDate || null} />}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button type="button" variant="ghost" onClick={onClear}>
          <X className="size-4" aria-hidden />
          {t('caravans.contactClear')}
        </Button>
      </div>
    </div>
  )
}

function FactChip({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  ltr?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line bg-cream-50/80 px-3 py-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-start">
        <p className="text-[11px] text-ink-500">{label}</p>
        <p
          className="mt-0.5 truncate text-sm font-medium text-ink-900"
          dir={ltr ? 'ltr' : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
