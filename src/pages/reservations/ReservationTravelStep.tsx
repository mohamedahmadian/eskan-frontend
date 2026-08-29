import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import { AppForm, Button, cardClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import type { Country, Reservation } from '../../types/app'
import {
  ReservationTravelFields,
  travelDatesError,
  type TravelValues,
} from './ReservationTravelFields'
import {
  RESERVATION_DATE_OVERLAP_CHECK_ENABLED,
  fetchSubjectReservationSpans,
} from './reservation-date-overlap'
import { workingHeadcount, requestedHeadcount } from './reservation-steps'
import { TravelSubStepBar } from './TravelSubStepBar'
import {
  inferTravelSubMaxReached,
  travelSubStepsForType,
  type TravelSubStep,
} from './travel-sub-steps'
import type { PartyItemSnapshot } from './ReservationPartyFields'

export function ReservationTravelStep({
  reservation,
  onChanged,
  mode = 'owner',
}: {
  reservation: Reservation
  onChanged: () => void
  mode?: 'owner' | 'admin'
}) {
  const { t } = useTranslation()
  const locked = mode === 'owner' && Boolean(reservation.basicInfoLockedAt)
  const sendForReview = reservation.status === 'DRAFT'
  const dualCounts = mode === 'admin'
  const counts = workingHeadcount(reservation)
  const requested = requestedHeadcount(reservation)
  const [values, setValues] = useState<TravelValues>({
    provinceId: reservation.originCity?.provinceId ?? '',
    originCityId: reservation.originCity?.id ?? '',
    walkingRouteId: reservation.walkingRoute?.id ?? '',
    stayStartDate: reservation.stayStartDate ?? '',
    stayEndDate: reservation.stayEndDate ?? '',
    walkingStartDate: reservation.walkingStartDate ?? '',
    maleCount: String(counts.male),
    femaleCount: String(counts.female),
    requestedMaleCount: String(requested.male),
    requestedFemaleCount: String(requested.female),
    caravanId: reservation.caravan?.id ?? '',
    groupId: reservation.group?.id ?? '',
    requestsAccommodation: reservation.requestsAccommodation ?? true,
    requestsBus: reservation.requestsBus ?? true,
    requestsSimCard: reservation.requestsSimCard ?? false,
    requestsBankCard: reservation.requestsBankCard ?? false,
    specialServices: reservation.specialServices ?? '',
  })
  const selectedParty: PartyItemSnapshot | null =
    reservation.type === 'CARAVAN' && reservation.caravan
      ? {
          id: reservation.caravan.id,
          name: reservation.caravan.name,
          maleCount: reservation.caravan.maleCount ?? 0,
          femaleCount: reservation.caravan.femaleCount ?? 0,
          totalCount: reservation.caravan.totalCount ?? 0,
          city: reservation.caravan.city,
        }
      : reservation.type === 'GROUP' && reservation.group
        ? {
            id: reservation.group.id,
            name: reservation.group.name,
            maleCount: reservation.group.maleCount ?? 0,
            femaleCount: reservation.group.femaleCount ?? 0,
            totalCount: reservation.group.totalCount ?? 0,
            city: reservation.group.city,
          }
        : null
  const subSteps = useMemo(() => travelSubStepsForType(reservation.type), [reservation.type])
  const inferredMax = useMemo(
    () => inferTravelSubMaxReached(reservation.type, values),
    [reservation.type, values],
  )
  const [subStep, setSubStep] = useState<TravelSubStep>(() => subSteps[0])
  const [maxReached, setMaxReached] = useState<TravelSubStep>(() =>
    mode === 'admin' || locked ? subSteps[subSteps.length - 1] : inferredMax,
  )
  const activeSubStep = subSteps.includes(subStep)
    ? subStep
    : subStep === 'optional'
      ? 'dates'
      : subSteps[0]
  const stepIndex = subSteps.indexOf(activeSubStep)
  const maxReachedIndex = Math.max(stepIndex, subSteps.indexOf(maxReached), subSteps.indexOf(inferredMax))
  const effectiveMax = subSteps[Math.min(maxReachedIndex, subSteps.length - 1)] ?? subSteps[0]
  const lastStep = stepIndex >= subSteps.length - 1

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', {
        params: { activeOnly: true },
      })
      return data
    },
  })
  const iranId = countries.data?.find((item) => item.iso2 === 'IR')?.id ?? ''
  const applicant = reservation.createdBy
  const existingReservationsQuery = useQuery({
    queryKey: [
      'reservations',
      'date-overlap',
      mode,
      applicant.id,
      applicant.nationalId ?? '',
    ],
    enabled: RESERVATION_DATE_OVERLAP_CHECK_ENABLED,
    queryFn: () =>
      fetchSubjectReservationSpans({
        forSelf: mode === 'owner',
        subjectId: applicant.id,
        subjectNationalId: applicant.nationalId,
      }),
  })
  const datesOverlapError = useMemo(() => {
    if (!existingReservationsQuery.data) return null
    if (travelDatesError(values, t)) return null
    return travelDatesError(values, t, {
      others: existingReservationsQuery.data,
      excludeId: reservation.id,
    })
  }, [existingReservationsQuery.data, reservation.id, t, values])

  const submit = useMutation({
    mutationFn: async () => {
      if (!locked) {
        await api.patch(
          `/reservations/${reservation.id}`,
          travelPayload(reservation.type, values, dualCounts),
        )
      }
      if (sendForReview) {
        await api.post(`/reservations/${reservation.id}/submit`)
      }
    },
    onSuccess: () => {
      toast.success(t(sendForReview ? 'reservations.submitted' : 'reservations.updated'))
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  async function assertTravelDates() {
    try {
      const others = RESERVATION_DATE_OVERLAP_CHECK_ENABLED
        ? (existingReservationsQuery.data ??
          (await existingReservationsQuery.refetch()).data ??
          [])
        : []
      const dateError = travelDatesError(values, t, {
        others,
        excludeId: reservation.id,
      })
      if (dateError) {
        toast.error(dateError)
        return false
      }
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      return false
    }
  }

  function countTotal() {
    if (dualCounts && reservation.type !== 'INDIVIDUAL') {
      return (
        (Number(values.requestedMaleCount) || 0) + (Number(values.requestedFemaleCount) || 0)
      )
    }
    return (Number(values.maleCount) || 0) + (Number(values.femaleCount) || 0)
  }

  async function assertCurrentSubStep() {
    if (locked) return true
    if (activeSubStep === 'count') {
      if (countTotal() <= 0) {
        toast.error(t('reservations.countInvalid'))
        return false
      }
      return true
    }
    if (activeSubStep === 'party') {
      if (reservation.type === 'GROUP' && !values.groupId) {
        toast.error(t('reservations.groupRequired'))
        return false
      }
      if (reservation.type === 'CARAVAN' && !values.caravanId) {
        toast.error(t('reservations.caravanRequired'))
        return false
      }
      return true
    }
    if (activeSubStep === 'dates') {
      return assertTravelDates()
    }
    return true
  }

  async function assertAllForSubmit() {
    if (locked) return true
    if (countTotal() <= 0) {
      toast.error(t('reservations.countInvalid'))
      return false
    }
    if (reservation.type === 'GROUP' && !values.groupId) {
      toast.error(t('reservations.groupRequired'))
      return false
    }
    if (reservation.type === 'CARAVAN' && !values.caravanId) {
      toast.error(t('reservations.caravanRequired'))
      return false
    }
    return assertTravelDates()
  }

  function goToSubStep(next: TravelSubStep) {
    const target = subSteps.indexOf(next)
    if (target < 0 || target > maxReachedIndex) return
    setSubStep(next)
  }

  function advanceMax(to: TravelSubStep) {
    const toIndex = subSteps.indexOf(to)
    if (toIndex > subSteps.indexOf(maxReached)) {
      setMaxReached(to)
    }
  }

  async function goNext() {
    if (!(await assertCurrentSubStep())) return
    if (lastStep) return
    const next = subSteps[stepIndex + 1]
    advanceMax(next)
    setSubStep(next)
  }

  function goPrev() {
    if (stepIndex <= 0) return
    setSubStep(subSteps[stepIndex - 1])
  }

  async function runSubmit() {
    if (!(await assertAllForSubmit())) return
    if (!sendForReview) {
      submit.mutate()
      return
    }
    confirmToast({
      title: t('reservations.confirmSubmitForReview'),
      confirmLabel: t('reservations.submitTravel'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => submit.mutate(),
    })
  }

  return (
    <div className="space-y-4">
      <TravelSubStepBar
        current={activeSubStep}
        maxReached={effectiveMax}
        steps={subSteps}
        type={reservation.type}
        onSelect={goToSubStep}
      />
      <AppForm
        key={activeSubStep}
        autoFocusFirst={false}
        onSubmit={(event) => {
          event.preventDefault()
          if (lastStep) {
            runSubmit()
            return
          }
          goNext()
        }}
        className={`space-y-4 p-6 ${cardClassName}`}
      >
        {mode === 'admin' ? (
          <p className="text-sm text-ink-500">{t('reservations.adminEditHint')}</p>
        ) : locked ? (
          <p className="text-sm text-ink-500">{t('reservations.lockedHint')}</p>
        ) : null}
        <ReservationTravelFields
          values={values}
          onChange={(patch) =>
            setValues((current) => {
              const next = { ...current, ...patch }
              if (dualCounts && reservation.type !== 'INDIVIDUAL') {
                if (
                  patch.requestedMaleCount !== undefined &&
                  current.maleCount === current.requestedMaleCount
                ) {
                  next.maleCount = patch.requestedMaleCount
                }
                if (
                  patch.requestedFemaleCount !== undefined &&
                  current.femaleCount === current.requestedFemaleCount
                ) {
                  next.femaleCount = patch.requestedFemaleCount
                }
              }
              return next
            })
          }
          type={reservation.type}
          locked={locked}
          iranId={iranId}
          activeSubStep={activeSubStep}
          dualCounts={dualCounts}
          selectedParty={selectedParty}
          reservationId={mode === 'admin' ? reservation.id : undefined}
          datesError={datesOverlapError}
          subjectUser={
            mode === 'admin'
              ? reservation.type === 'CARAVAN' && reservation.caravanManager
                ? reservation.caravanManager
                : reservation.createdBy
              : undefined
          }
        />
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {stepIndex > 0 ? (
            <Button type="button" onClick={goPrev} disabled={submit.isPending}>
              <ChevronRight className="size-4" aria-hidden />
              {t('reservations.prevStep')}
            </Button>
          ) : null}
          <Button type="submit" className="ms-auto" disabled={submit.isPending}>
            {lastStep ? (
              <>
                <Check className="size-4" aria-hidden />
                {t(sendForReview ? 'reservations.submitTravel' : 'reservations.saveTravel')}
              </>
            ) : (
              <>
                {t('reservations.nextStep')}
                <ChevronLeft className="size-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </AppForm>
    </div>
  )
}

function travelPayload(
  type: Reservation['type'],
  values: TravelValues,
  dualCounts: boolean,
) {
  const base = {
    originCityId: values.originCityId || null,
    walkingRouteId: values.walkingRouteId || null,
    stayStartDate: values.stayStartDate || null,
    stayEndDate: values.stayEndDate || null,
    walkingStartDate: values.walkingStartDate || null,
    requestsAccommodation: values.requestsAccommodation,
    requestsBus: values.requestsBus,
    requestsSimCard: values.requestsSimCard,
    requestsBankCard: values.requestsBankCard,
    specialServices: values.specialServices.trim() || null,
    caravanId: type === 'CARAVAN' ? values.caravanId || null : null,
    groupId: type === 'GROUP' ? values.groupId || null : null,
  }
  if (dualCounts && type !== 'INDIVIDUAL') {
    return {
      ...base,
      requestedMaleCount: Number(values.requestedMaleCount) || 0,
      requestedFemaleCount: Number(values.requestedFemaleCount) || 0,
      maleCount: Number(values.maleCount) || 0,
      femaleCount: Number(values.femaleCount) || 0,
    }
  }
  return {
    ...base,
    maleCount: Number(values.maleCount) || 0,
    femaleCount: Number(values.femaleCount) || 0,
  }
}
