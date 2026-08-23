import {
  Ban,
  Check,
  Hourglass,
  IdCard,
  Phone,
  ScrollText,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useTranslation, Trans } from 'react-i18next'
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
  formShellClassName,
} from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { confirmToast } from '../../components/ui/confirmToast'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import {
  isValidIranianNationalId,
  normalizeNationalId,
} from '../../lib/national-id'
import type {
  Country,
  Reservation,
  ReservationCaravanContact,
  ReservationMember,
  ReservationPerson,
} from '../../types/app'
import {
  contactRoles,
  currentStepFromStatus,
  selfAssignableContactRoles,
  type ReservationStepCode,
} from './reservation-steps'
import { InsuranceStatusBadge, ReservationStatusBadge } from './ReservationStatusBadge'
import { CompanionExcelImport } from './CompanionExcelImport'
import { PreviousMembersPanel } from './PreviousMembersPanel'
import {
  ReservationTravelFields,
  travelDatesError,
  type TravelValues,
} from './ReservationTravelFields'
import { ReservationStepReadonly } from './ReservationStepReadonly'
import { ReservationCompleteSummary } from './ReservationCompleteSummary'
import { ReservationTravelSummary } from './ReservationTravelSummary'
import { ReservationTimeline } from './ReservationTimeline'
import { ReservationWizardShell } from './ReservationWizardShell'
import { InsuranceStep } from './ReservationInsuranceStep'

type LookupResponse =
  | { found: false }
  | { found: true; user: ReservationPerson }

export function ReservationWizardPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['reservations', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Reservation>(`/reservations/${id}`)
      return data
    },
  })

  const reservation = query.data
  const currentStep = reservation
    ? currentStepFromStatus(reservation.status, reservation.type)
    : 'travel'
  const [viewedStep, setViewedStep] = useState<ReservationStepCode | null>(
    reservation?.status === 'CANCELLED' ? null : currentStep,
  )

  useEffect(() => {
    setViewedStep(reservation?.status === 'CANCELLED' ? null : currentStep)
  }, [currentStep, reservation?.status])

  if (!id || query.isLoading) return <LoadingState />
  if (query.isError || !reservation) {
    const status = axios.isAxiosError(query.error) ? query.error.response?.status : 0
    const message =
      status === 403
        ? t('reservations.forbidden')
        : status === 404
          ? t('reservations.notFound')
          : t('common.error')
    return <p className="text-sm text-red-700">{message}</p>
  }

  const blocked = reservation.status === 'REJECTED' || reservation.status === 'CANCELLED'

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={`${t('reservations.wizard')} ${formatNumber(reservation.year, locale)}`}
        subtitle={
          <div className="flex flex-wrap items-center gap-2">
            <EntityNameSubtitle
              name={t(`reservations.types.${reservation.type}`)}
              icon={ScrollText}
            />
            {reservation.status === 'PENDING_MANAGEMENT_REVIEW' ||
            reservation.status === 'CANCELLED' ? null : (
              <ReservationStatusBadge status={reservation.status} />
            )}
          </div>
        }
      />
      {reservation.status === 'REJECTED' ? (
        <div className={`${cardClassName} mb-4 border-red-100 p-4`}>
          <p className="font-medium text-red-700">{t('reservations.rejectedTitle')}</p>
          <p className="mt-1 text-sm text-ink-600">{t('reservations.rejectedHint')}</p>
          {reservation.rejectionReason ? (
            <p className="mt-2 text-sm text-ink-800">
              {t('reservations.rejectionReason')}: {reservation.rejectionReason}
            </p>
          ) : null}
        </div>
      ) : null}
      {reservation.status === 'CANCELLED' ? (
        <CancelledBanner cancelledAt={reservation.cancelledAt} />
      ) : null}
      {reservation.status === 'PENDING_MANAGEMENT_REVIEW' ? <ReviewWaitingBanner /> : null}

      <ReservationWizardShell
        reservation={reservation}
        viewedStep={viewedStep}
        onViewStep={setViewedStep}
      >
        {reservation.status === 'CANCELLED' ? (
          viewedStep ? (
            <ReservationStepReadonly
              reservation={reservation}
              step={viewedStep}
              onBack={() => setViewedStep(null)}
              backLabel={t('reservations.backToFileInfo')}
            />
          ) : (
            <ReservationCompleteSummary reservation={reservation} variant="cancelled" />
          )
        ) : blocked ? (
          <div className={`${cardClassName} p-6`}>
            <ReservationStatusBadge status={reservation.status} />
          </div>
        ) : viewedStep && viewedStep !== currentStep ? (
          <ReservationStepReadonly
            reservation={reservation}
            step={viewedStep}
            onBack={() => setViewedStep(currentStep)}
          />
        ) : (
          <ActiveStep
            reservation={reservation}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ['reservations', id] })}
          />
        )}
      </ReservationWizardShell>
      <div className="mt-4">
        <ReservationTimeline reservation={reservation} />
      </div>
      {reservation.status !== 'COMPLETED' && reservation.status !== 'CANCELLED' ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="danger"
            onClick={() =>
              confirmToast({
                title: t('reservations.confirmCancelFile'),
                confirmLabel: t('reservations.cancelFile'),
                cancelLabel: t('common.cancel'),
                confirmVariant: 'danger',
                onConfirm: async () => {
                  try {
                    await api.post(`/reservations/${reservation.id}/cancel`)
                    toast.success(t('reservations.cancelledOk'))
                    void queryClient.invalidateQueries({ queryKey: ['reservations', id] })
                    void queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] })
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, t('common.error')))
                  }
                },
              })
            }
          >
            <Ban className="size-4" aria-hidden />
            {t('reservations.cancelFile')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ActiveStep({
  reservation,
  onChanged,
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const step = currentStepFromStatus(reservation.status, reservation.type)
  if (step === 'travel') {
    return <TravelStep reservation={reservation} onChanged={onChanged} />
  }
  if (step === 'review') {
    return <ReviewStep reservation={reservation} />
  }
  if (step === 'companions') {
    return <CompanionsStep reservation={reservation} onChanged={onChanged} />
  }
  if (step === 'contacts') {
    return <ContactsStep reservation={reservation} onChanged={onChanged} />
  }
  if (step === 'insurance') {
    return <InsuranceStep reservation={reservation} onChanged={onChanged} />
  }
  return <ReservationCompleteSummary reservation={reservation} />
}

function TravelStep({
  reservation,
  onChanged,
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const locked = Boolean(reservation.basicInfoLockedAt)
  const [values, setValues] = useState<TravelValues>({
    provinceId: reservation.originCity?.provinceId ?? '',
    originCityId: reservation.originCity?.id ?? '',
    walkingRouteId: reservation.walkingRoute?.id ?? '',
    stayStartDate: reservation.stayStartDate ?? '',
    stayEndDate: reservation.stayEndDate ?? '',
    walkingStartDate: reservation.walkingStartDate ?? '',
    maleCount: String(reservation.maleCount),
    femaleCount: String(reservation.femaleCount),
    caravanId: reservation.caravan?.id ?? '',
  })
  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''

  const submit = useMutation({
    mutationFn: async () => {
      if (!locked) {
        await api.patch(`/reservations/${reservation.id}`, travelPayload(reservation.type, values))
      }
      await api.post(`/reservations/${reservation.id}/submit`)
    },
    onSuccess: () => {
      toast.success(t('reservations.submitted'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  function assertTravelDates() {
    const dateError = travelDatesError(values, t, reservation.walkingStartDate)
    if (dateError) {
      toast.error(dateError)
      return false
    }
    return true
  }

  return (
    <AppForm
      autoFocusFirst={false}
      onSubmit={(event) => {
        event.preventDefault()
        if (!assertTravelDates()) return
        submit.mutate()
      }}
      className={`space-y-4 p-6 ${cardClassName}`}
    >
      {locked ? <p className="text-sm text-ink-500">{t('reservations.lockedHint')}</p> : null}
      <ReservationTravelFields
        values={values}
        onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        type={reservation.type}
        locked={locked}
        iranId={iranId}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submit.isPending}>
          <Check className="size-4" aria-hidden />
          {t('reservations.submitTravel')}
        </Button>
      </div>
    </AppForm>
  )
}

function travelPayload(type: Reservation['type'], values: TravelValues) {
  return {
    originCityId: values.originCityId || null,
    walkingRouteId: values.walkingRouteId || null,
    stayStartDate: values.stayStartDate || null,
    stayEndDate: values.stayEndDate || null,
    walkingStartDate: values.walkingStartDate || null,
    maleCount: Number(values.maleCount) || 0,
    femaleCount: Number(values.femaleCount) || 0,
    caravanId: type === 'CARAVAN' ? values.caravanId || null : null,
  }
}

function ReviewStep({ reservation }: { reservation: Reservation }) {
  const { t } = useTranslation()
  return (
    <ReservationTravelSummary
      reservation={reservation}
      variant="review"
      hint={
        reservation.managementReviewedAt
          ? t('reservations.reviewAuto')
          : t('reservations.reviewSummaryHint')
      }
    />
  )
}

function CancelledBanner({ cancelledAt }: { cancelledAt: string | null }) {
  const { t } = useTranslation()
  return (
    <aside
      className="mb-4 flex flex-col items-center gap-3 rounded-[28px] border-2 border-red-200 bg-gradient-to-b from-red-50 via-white to-white px-5 py-7 text-center shadow-[0_16px_36px_rgba(185,28,28,0.14)]"
      role="status"
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-red-500 text-white shadow-[0_10px_22px_rgba(185,28,28,0.28)]">
        <Ban className="size-8" aria-hidden />
      </span>
      <p className="text-xl font-bold leading-8 text-red-700 sm:text-2xl">
        <Trans
          i18nKey="reservations.cancelledByYou"
          components={{
            date: (
              <span className="mx-1 inline-flex align-baseline text-red-800">
                <DateText value={cancelledAt} withTime />
              </span>
            ),
          }}
        />
      </p>
      <p className="max-w-lg text-sm leading-7 text-ink-700">{t('reservations.cancelledHint')}</p>
    </aside>
  )
}

function ReviewWaitingBanner() {
  const { t } = useTranslation()
  return (
    <aside
      className="mb-4 flex flex-col items-center gap-3 rounded-[28px] border-2 border-gold-400 bg-gradient-to-b from-gold-100 via-gold-50 to-white px-5 py-7 text-center shadow-[0_16px_36px_rgba(232,184,58,0.2)]"
      role="status"
      aria-live="polite"
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-gold-500 text-white shadow-[0_10px_22px_rgba(196,146,26,0.35)]">
        <Hourglass className="size-8" aria-hidden />
      </span>
      <p className="text-xl font-bold leading-8 text-gold-600 sm:text-2xl">
        {t('reservations.statuses.PENDING_MANAGEMENT_REVIEW')}
      </p>
      <p className="max-w-lg text-sm leading-7 text-ink-700">{t('reservations.reviewWaiting')}</p>
      <p className="text-base font-semibold text-ink-900">{t('reservations.reviewPleaseWait')}</p>
    </aside>
  )
}

function CompanionsStep({
  reservation,
  onChanged,
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const canSeeMembers = reservation.members !== undefined
  const members = reservation.members ?? []
  const males = members.filter((item) => item.user.gender === 'MALE').length
  const females = members.filter((item) => item.user.gender === 'FEMALE').length
  const remaining = Math.max(0, reservation.totalCount - members.length)

  const complete = useMutation({
    mutationFn: async () => {
      if (males !== reservation.maleCount || females !== reservation.femaleCount) {
        throw new Error(t('reservations.companionsMismatch'))
      }
      await api.post(`/reservations/${reservation.id}/companions/complete`)
    },
    onSuccess: () => {
      toast.success(t('reservations.companionsCompleted'))
      onChanged()
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message === t('reservations.companionsMismatch')
          ? error.message
          : getApiErrorMessage(error, t('common.error')),
      ),
  })

  if (!canSeeMembers) {
    return <p className={`${cardClassName} p-4 text-sm text-ink-600`}>{t('reservations.membersHidden')}</p>
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClassName} p-4 text-sm text-ink-700`}>
        <p>{t('reservations.expectedCount', { count: formatNumber(reservation.totalCount, locale) })}</p>
        <p>{t('reservations.registeredCount', { count: formatNumber(members.length, locale) })}</p>
        <p>{t('reservations.remainingCount', { count: formatNumber(remaining, locale) })}</p>
        <p className="mt-2">
          {t('reservations.genderProgress', {
            gender: t('reservations.maleCount'),
            have: formatNumber(males, locale),
            need: formatNumber(reservation.maleCount, locale),
          })}
          {' · '}
          {t('reservations.genderProgress', {
            gender: t('reservations.femaleCount'),
            have: formatNumber(females, locale),
            need: formatNumber(reservation.femaleCount, locale),
          })}
        </p>
      </div>
      <p className="text-sm font-medium text-ink-800">{t('reservations.manualAdd')}</p>
      <MemberLookupForm reservationId={reservation.id} onAdded={onChanged} />
      <CompanionExcelImport reservationId={reservation.id} onImported={onChanged} />
      {reservation.type === 'CARAVAN' ? (
        <PreviousMembersPanel
          reservationId={reservation.id}
          remainingMale={Math.max(0, reservation.maleCount - males)}
          remainingFemale={Math.max(0, reservation.femaleCount - females)}
          onImported={onChanged}
        />
      ) : null}
      <MembersList reservationId={reservation.id} members={members} onChanged={onChanged} />
      <Button
        type="button"
        disabled={complete.isPending}
        onClick={() => complete.mutate()}
      >
        {t('reservations.completeCompanions')}
      </Button>
    </div>
  )
}

function MemberLookupForm({
  reservationId,
  onAdded,
}: {
  reservationId: string
  onAdded: () => void
}) {
  const { t } = useTranslation()
  const nationalRef = useRef<HTMLInputElement>(null)
  const [nationalId, setNationalId] = useState('')
  const [status, setStatus] = useState<'idle' | 'looking' | 'found' | 'new'>('idle')
  const [person, setPerson] = useState<Partial<ReservationPerson>>({})
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')

  useEffect(() => {
    if (status === 'idle') nationalRef.current?.focus()
  }, [status])

  async function lookup(event?: FormEvent) {
    event?.preventDefault()
    const id = normalizeNationalId(nationalId)
    if (!isValidIranianNationalId(id)) {
      toast.error(t('users.nationalIdInvalid'))
      return
    }
    setStatus('looking')
    try {
      const { data } = await api.post<LookupResponse>('/pilgrims/identity-lookup', {
        nationalId: id,
      })
      if (data.found) {
        setPerson(data.user)
        setGender(data.user.gender ?? '')
        setBirthDate(data.user.birthDate ?? '')
        setStatus('found')
        return
      }
      setPerson({})
      setGender('')
      setBirthDate('')
      setStatus('new')
      toast.message(t('reservations.notFound'))
    } catch (error) {
      setStatus('idle')
      toast.error(getApiErrorMessage(error, t('common.error')))
    }
  }

  const add = useMutation({
    mutationFn: async () => {
      await api.post(`/reservations/${reservationId}/members`, {
        nationalId: normalizeNationalId(nationalId),
        firstName: person.firstName,
        lastName: person.lastName,
        gender: gender || undefined,
        phone: person.phone || null,
        birthDate: birthDate || null,
      })
    },
    onSuccess: () => {
      toast.success(t('reservations.memberAdded'))
      setNationalId('')
      setPerson({})
      setGender('')
      setBirthDate('')
      setStatus('idle')
      onAdded()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  return (
    <AppForm autoFocusFirst={false} onSubmit={lookup} className={`space-y-3 p-4 ${cardClassName}`}>
      <FormField icon={IdCard} label={t('reservations.nationalId')} htmlFor="companion-nid">
        <input
          id="companion-nid"
          ref={nationalRef}
          className={fieldClassName}
          value={nationalId}
          onChange={(event) => setNationalId(event.target.value)}
          inputMode="numeric"
        />
      </FormField>
      <Button type="submit" variant="soft" disabled={status === 'looking'}>
        {status === 'looking' ? t('reservations.looking') : t('reservations.lookup')}
      </Button>
      {status === 'found' || status === 'new' ? (
        <div className="space-y-3">
          {status === 'found' ? (
            <p className="text-sm text-teal-700">{t('reservations.found')}</p>
          ) : null}
          <FormField icon={UserRound} label={t('users.firstName')} htmlFor="c-first">
            <input
              id="c-first"
              className={fieldClassName}
              value={person.firstName ?? ''}
              onChange={(event) => setPerson((current) => ({ ...current, firstName: event.target.value }))}
              required={status === 'new'}
              disabled={status === 'found'}
            />
          </FormField>
          <FormField icon={UserRound} label={t('users.lastName')} htmlFor="c-last">
            <input
              id="c-last"
              className={fieldClassName}
              value={person.lastName ?? ''}
              onChange={(event) => setPerson((current) => ({ ...current, lastName: event.target.value }))}
              required={status === 'new'}
              disabled={status === 'found'}
            />
          </FormField>
          <FormField icon={Users} label={t('users.gender')}>
            <SearchSelect
              value={gender}
              onChange={setGender}
              placeholder={t('users.selectOptional')}
              options={[
                { value: 'MALE', label: t('userGenders.MALE') },
                { value: 'FEMALE', label: t('userGenders.FEMALE') },
              ]}
              required={status === 'new'}
              disabled={status === 'found' && Boolean(gender)}
            />
          </FormField>
          <FormField icon={Phone} label={t('users.phone')} htmlFor="c-phone">
            <input
              id="c-phone"
              className={fieldClassName}
              value={person.phone ?? ''}
              onChange={(event) => setPerson((current) => ({ ...current, phone: event.target.value }))}
            />
          </FormField>
          {status === 'new' ? (
            <FormField icon={UserRound} label={t('users.birthDate')}>
              <PersianDateField value={birthDate} onChange={(value) => setBirthDate(value ?? '')} />
            </FormField>
          ) : null}
          <Button type="button" disabled={add.isPending} onClick={() => add.mutate()}>
            <UserPlus className="size-4" aria-hidden />
            {t('reservations.addMember')}
          </Button>
        </div>
      ) : null}
    </AppForm>
  )
}

function MembersList({
  reservationId,
  members,
  onChanged,
}: {
  reservationId: string
  members: ReservationMember[]
  onChanged: () => void
}) {
  const { t } = useTranslation()

  function remove(member: ReservationMember) {
    confirmToast({
      title: t('reservations.confirmRemoveMember'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/reservations/${reservationId}/members/${member.id}`)
          toast.success(t('reservations.memberRemoved'))
          onChanged()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  if (!members.length) return null

  return (
    <div className={`${cardClassName} overflow-hidden`}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-3 py-2 text-start">{t('users.nationalId')}</th>
              <th className="px-3 py-2 text-start">{t('users.firstName')}</th>
              <th className="px-3 py-2 text-start">{t('users.lastName')}</th>
              <th className="px-3 py-2 text-start">{t('users.gender')}</th>
              <th className="px-3 py-2 text-start">{t('users.phone')}</th>
              <th className="px-3 py-2 text-start">{t('reservations.steps.insurance')}</th>
              <th className="px-3 py-2 text-start">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-3 py-2" dir="ltr">
                  {item.user.nationalId ?? '—'}
                </td>
                <td className="px-3 py-2">{item.user.firstName}</td>
                <td className="px-3 py-2">{item.user.lastName}</td>
                <td className="px-3 py-2">
                  {item.user.gender ? t(`userGenders.${item.user.gender}`) : '—'}
                </td>
                <td className="px-3 py-2" dir="ltr">
                  {item.user.phone ?? '—'}
                </td>
                <td className="px-3 py-2">
                  <InsuranceStatusBadge status={item.insuranceStatus} />
                </td>
                <td className="px-3 py-2">
                  <Button type="button" variant="ghost" icon onClick={() => remove(item)}>
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 p-3 md:hidden">
        {members.map((item) => (
          <div key={item.id} className="rounded-2xl border border-line p-3 text-sm">
            <p className="font-medium">{item.user.fullName}</p>
            <p dir="ltr">{item.user.nationalId}</p>
            <InsuranceStatusBadge status={item.insuranceStatus} />
            <Button type="button" variant="ghost" className="mt-2" onClick={() => remove(item)}>
              <Trash2 className="size-4" aria-hidden />
              {t('common.delete')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactsStep({
  reservation,
  onChanged,
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const canSeeContacts = reservation.caravanContacts !== undefined
  const contacts = reservation.caravanContacts ?? []
  const filled = new Set(contacts.map((item) => item.role))
  const emptySelfRoles = selfAssignableContactRoles.filter((role) => !filled.has(role))
  const me = reservation.caravanManager ?? reservation.createdBy

  const assignSelf = useMutation({
    mutationFn: async () => {
      if (!me.nationalId) throw new Error(t('reservations.assignMyselfNeedId'))
      for (const role of emptySelfRoles) {
        await api.put(`/reservations/${reservation.id}/contacts`, {
          role,
          nationalId: me.nationalId,
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

  const complete = useMutation({
    mutationFn: async () => {
      if (contactRoles.some((role) => !filled.has(role))) {
        throw new Error(t('reservations.contactsIncomplete'))
      }
      await api.post(`/reservations/${reservation.id}/contacts/complete`)
    },
    onSuccess: () => {
      toast.success(t('reservations.contactsCompleted'))
      onChanged()
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
    <div className="space-y-4">
      <p className="text-sm text-ink-600">{t('reservations.assignMyselfHint')}</p>
      <Button
        type="button"
        variant="soft"
        disabled={!emptySelfRoles.length || !me.nationalId || assignSelf.isPending}
        onClick={() =>
          confirmToast({
            title: t('reservations.confirmAssignMyself'),
            confirmLabel: t('common.yes'),
            cancelLabel: t('common.cancel'),
            onConfirm: () => assignSelf.mutate(),
          })
        }
      >
        {t('reservations.assignMyself')}
      </Button>
      {contactRoles.map((role) => (
        <ContactRoleCard
          key={role}
          reservationId={reservation.id}
          role={role}
          current={contacts.find((item) => item.role === role)}
          onChanged={onChanged}
        />
      ))}
      <Button type="button" disabled={complete.isPending} onClick={() => complete.mutate()}>
        {t('reservations.completeContacts')}
      </Button>
    </div>
  )
}

function ContactRoleCard({
  reservationId,
  role,
  current,
  onChanged,
}: {
  reservationId: string
  role: (typeof contactRoles)[number]
  current?: ReservationCaravanContact
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [nationalId, setNationalId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'found' | 'new'>('idle')

  async function lookup() {
    const id = normalizeNationalId(nationalId)
    if (!isValidIranianNationalId(id)) {
      toast.error(t('users.nationalIdInvalid'))
      return
    }
    try {
      const { data } = await api.post<LookupResponse>('/pilgrims/identity-lookup', {
        nationalId: id,
      })
      if (data.found) {
        setFirstName(data.user.firstName)
        setLastName(data.user.lastName)
        setPhone(data.user.phone ?? '')
        setStatus('found')
        return
      }
      setFirstName('')
      setLastName('')
      setPhone('')
      setStatus('new')
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    }
  }

  const save = useMutation({
    mutationFn: async () => {
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
      setStatus('idle')
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  return (
    <div className={`${cardClassName} p-4`}>
      <p className="mb-2 text-sm font-medium text-ink-900">
        {t(`caravans.contactRoles.${role}`)}
        {role === 'DEPUTY' ? ' *' : ''}
      </p>
      {current ? (
        <p className="text-sm text-ink-700">{current.user.fullName}</p>
      ) : (
        <div className="space-y-3">
          <FormField icon={IdCard} label={t('reservations.nationalId')} htmlFor={`contact-${role}-nid`}>
            <input
              id={`contact-${role}-nid`}
              className={fieldClassName}
              value={nationalId}
              onChange={(event) => setNationalId(event.target.value)}
              inputMode="numeric"
            />
          </FormField>
          <Button type="button" variant="soft" onClick={() => void lookup()}>
            {t('reservations.lookup')}
          </Button>
          {status !== 'idle' ? (
            <>
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
              <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
                {t('caravans.contactSave')}
              </Button>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
