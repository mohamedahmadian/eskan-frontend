import {
  ArrowRightLeft,
  BedDouble,
  Building2,
  CalendarClock,
  CalendarRange,
  Combine,
  Hand,
  IdCard,
  LayoutGrid,
  List,
  LogOut,
  Mars,
  Phone,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import {
  AppForm,
  Button,
  EntityNameSubtitle,
  FormActions,
  FormField,
  LoadingState,
  PageHeader,
  fieldClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  FormCard,
  FormFactTile,
  FormMetaChip,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import {
  reservationTypes,
  type AllocationSource,
  type PlacementAllocation,
  type PlacementAvailability,
  type PlacementReservationDetail,
  type UserGender,
} from '../../types/app'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import {
  ReservationPlacementSmsButton,
  buildPlacementStaySmsBody,
} from '../reservations/ReservationPlacementSms'
import { StayAccommodationCard } from '../reservations/StayAccommodationCard'

const sourceIcon: Record<AllocationSource, LucideIcon> = {
  SYSTEM: Sparkles,
  MANUAL: Hand,
  HYBRID: Combine,
}

function PilgrimCountPanel({
  title,
  icon: Icon,
  tone,
  totalLabel,
  total,
  allocatedLabel,
  allocated,
  remainingLabel,
  remaining,
}: {
  title: string
  icon: LucideIcon
  tone: 'teal' | 'mint'
  totalLabel: string
  total: string
  allocatedLabel: string
  allocated: string
  remainingLabel: string
  remaining: string
}) {
  const shell =
    tone === 'teal'
      ? 'border-teal-200 bg-teal-50/80'
      : 'border-mint-200 bg-mint-50/80'
  const badge = tone === 'teal' ? 'bg-teal-500' : 'bg-mint-500'
  const titleColor = tone === 'teal' ? 'text-teal-800' : 'text-mint-800'
  return (
    <section className={`rounded-2xl border p-3 sm:p-4 ${shell}`}>
      <div className={`mb-3 flex items-center gap-2 text-sm font-semibold ${titleColor}`}>
        <span
          className={`flex size-7 items-center justify-center rounded-lg text-white shadow-sm ${badge}`}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        {title}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <FormFactTile compact icon={Users} label={totalLabel} value={total} tone={tone} />
        <FormFactTile compact icon={UserCheck} label={allocatedLabel} value={allocated} tone={tone} />
        <FormFactTile compact icon={Users} label={remainingLabel} value={remaining} tone={tone} />
      </div>
    </section>
  )
}

export function PlacementDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const { reservationId = '' } = useParams()
  const queryClient = useQueryClient()
  const [accommodationId, setAccommodationId] = useState('')
  const [gender, setGender] = useState<UserGender | ''>('')
  const [headcount, setHeadcount] = useState('')
  const [accommodatedCount, setAccommodatedCount] = useState('')
  const [movingId, setMovingId] = useState<string | null>(null)
  const [showAllAccommodations, setShowAllAccommodations] = useState(false)

  const detail = useQuery({
    queryKey: ['placements', 'reservation', reservationId],
    enabled: Boolean(reservationId),
    queryFn: async () => {
      const { data } = await api.get<PlacementReservationDetail>(
        `/placements/reservations/${reservationId}`,
      )
      return data
    },
  })

  const row = detail.data
  const individual = row?.type === reservationTypes.INDIVIDUAL
  const individualGender: UserGender | '' =
    individual && row ? (row.maleCount >= 1 ? 'MALE' : 'FEMALE') : ''
  const soleGender: UserGender | '' =
    !individual && row && row.maleCount > 0 && row.femaleCount <= 0
      ? 'MALE'
      : !individual && row && row.femaleCount > 0 && row.maleCount <= 0
        ? 'FEMALE'
        : ''
  const stayStart = row?.stayStartDate ?? ''
  const stayEnd = row?.stayEndDate ?? ''
  const movingItem = row?.allocations.find((item) => item.id === movingId) ?? null
  const remainingMaleNeed = row ? Math.max(0, row.maleCount - row.allocatedMale) : 0
  const remainingFemaleNeed = row ? Math.max(0, row.femaleCount - row.allocatedFemale) : 0
  const partyFullyPlaced = remainingMaleNeed === 0 && remainingFemaleNeed === 0
  const showAllocateForm =
    Boolean(movingId) || (individual ? !row?.allocations.length : !partyFullyPlaced)
  const bothGenders = Boolean(row && !individual && row.maleCount > 0 && row.femaleCount > 0)
  const maleSettled = Boolean(
    bothGenders && remainingMaleNeed === 0 && movingItem?.gender !== 'MALE',
  )
  const femaleSettled = Boolean(
    bothGenders && remainingFemaleNeed === 0 && movingItem?.gender !== 'FEMALE',
  )
  const genderChoices = useMemo(() => {
    const choices: UserGender[] = []
    if (row && row.maleCount > 0 && !maleSettled) choices.push('MALE')
    if (row && row.femaleCount > 0 && !femaleSettled) choices.push('FEMALE')
    return choices
  }, [row, maleSettled, femaleSettled])
  const preferredGender: UserGender | '' =
    maleSettled && !femaleSettled
      ? 'FEMALE'
      : femaleSettled && !maleSettled
        ? 'MALE'
        : soleGender

  function currentAccommodatedFor(nextGender: UserGender) {
    if (!row) return 0
    const stored =
      (nextGender === 'MALE' ? row.accommodatedMaleCount : row.accommodatedFemaleCount) ?? 0
    if (stored > 0) return stored
    return nextGender === 'MALE' ? row.maleCount : row.femaleCount
  }

  useEffect(() => {
    if (!row || movingId) return
    if (row.type === reservationTypes.INDIVIDUAL) {
      const nextGender = row.maleCount >= 1 ? 'MALE' : 'FEMALE'
      setGender(nextGender)
      setHeadcount('1')
      setAccommodatedCount(String(currentAccommodatedFor(nextGender)))
      return
    }
    const next = preferredGender
    if (!next || gender === next) return
    if (!genderChoices.includes(next)) return
    if (gender && genderChoices.includes(gender) && genderChoices.length > 1) return
    const total = next === 'MALE' ? row.maleCount : row.femaleCount
    const allocated = next === 'MALE' ? row.allocatedMale : row.allocatedFemale
    const need = Math.max(0, total - allocated)
    setGender(next)
    setShowAllAccommodations(false)
    setAccommodationId('')
    setHeadcount(need > 0 ? String(need) : '')
    setAccommodatedCount(String(currentAccommodatedFor(next)))
  }, [row, movingId, preferredGender, gender, genderChoices])

  const availability = useQuery({
    queryKey: ['placements', 'availability', stayStart, stayEnd, reservationId],
    enabled: Boolean(stayStart && stayEnd),
    queryFn: async () => {
      const { data } = await api.get<PlacementAvailability[]>(
        '/placements/accommodations/availability',
        { params: { stayStartDate: stayStart, stayEndDate: stayEnd, reservationId } },
      )
      return data
    },
  })

  const selectedGender: UserGender | '' = individual
    ? individualGender
    : gender && genderChoices.includes(gender)
      ? gender
      : genderChoices.includes(preferredGender as UserGender)
        ? preferredGender
        : ''

  function accommodationMatchesGender(item: PlacementAvailability, nextGender: UserGender) {
    const capacity = nextGender === 'MALE' ? item.maleCapacity : item.femaleCapacity
    if (capacity <= 0) return false
    return item.genderType === nextGender || item.genderType === 'MIXED'
  }
  const selected = availability.data?.find((item) => item.id === accommodationId)
  const remaining =
    selectedGender === 'MALE'
      ? selected?.remainingMale
      : selectedGender === 'FEMALE'
        ? selected?.remainingFemale
        : undefined
  const remainingNominal =
    selectedGender === 'MALE'
      ? selected?.remainingNominalMale
      : selectedGender === 'FEMALE'
        ? selected?.remainingNominalFemale
        : undefined
  const usesOverflow =
    Boolean(headcount) &&
    remainingNominal != null &&
    Number(headcount) > remainingNominal &&
    remaining != null &&
    Number(headcount) <= remaining

  const needsOverride = useMemo(() => {
    if (!selected || !selectedGender) return false
    const genderMismatch =
      selected.genderType !== 'MIXED' && selected.genderType !== selectedGender
    const other = selected.otherGenders.some((item) => item !== selectedGender)
    const policyConflict =
      other && row?.placementGenderPolicy === 'SINGLE_GENDER'
    return genderMismatch || policyConflict
  }, [selected, selectedGender, row?.placementGenderPolicy])

  function remainingNeed(nextGender: UserGender) {
    if (!row) return 0
    const total = nextGender === 'MALE' ? row.maleCount : row.femaleCount
    const allocated = nextGender === 'MALE' ? row.allocatedMale : row.allocatedFemale
    const release = movingItem?.gender === nextGender ? movingItem.headcount : 0
    return Math.max(0, total - allocated + release)
  }

  function fillHeadcountForGender(nextGender: UserGender | '') {
    setGender(nextGender)
    setShowAllAccommodations(false)
    setAccommodationId('')
    if (!nextGender) {
      setAccommodatedCount('')
      return
    }
    setAccommodatedCount(String(currentAccommodatedFor(nextGender)))
    if (individual) return
    const remaining = remainingNeed(nextGender)
    setHeadcount(remaining > 0 ? String(remaining) : '')
  }

  function resetForm() {
    setMovingId(null)
    setAccommodationId('')
    setShowAllAccommodations(false)
    const nextGender = individualGender || preferredGender
    setGender(nextGender)
    if (individual) {
      setHeadcount('1')
    } else if (nextGender && row) {
      const total = nextGender === 'MALE' ? row.maleCount : row.femaleCount
      const allocated = nextGender === 'MALE' ? row.allocatedMale : row.allocatedFemale
      const need = Math.max(0, total - allocated)
      setHeadcount(need > 0 ? String(need) : '')
    } else {
      setHeadcount('')
    }
    setAccommodatedCount(nextGender ? String(currentAccommodatedFor(nextGender)) : '')
  }

  const allocate = useMutation({
    mutationFn: async (overrideNote: string | undefined) => {
      const payload = {
        accommodationId,
        gender: selectedGender,
        headcount: individual ? 1 : Number(headcount),
        accommodatedCount: Number(accommodatedCount),
        ...(overrideNote
          ? { genderOverride: true, overrideNote }
          : {}),
      }
      if (movingId) {
        await api.patch(`/placements/allocations/${movingId}`, payload)
        return
      }
      await api.post('/placements/allocate', {
        reservationId,
        items: [payload],
      })
    },
    onSuccess: () => {
      toast.success(movingId ? t('placements.movedOk') : t('placements.allocatedOk'))
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['placements'] })
      void queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function submitAllocate() {
    const nextGender = selectedGender
    const nextHeadcount = individual ? '1' : headcount
    if (!accommodationId || !nextGender || !nextHeadcount || accommodatedCount === '') {
      toast.error(t('common.error'))
      return
    }
    if (!individual) {
      const remaining = remainingNeed(nextGender)
      if (Number(nextHeadcount) > remaining) {
        toast.error(
          nextGender === 'MALE'
            ? t('placements.headcountExceedsMale')
            : t('placements.headcountExceedsFemale'),
        )
        return
      }
    }
    if (needsOverride) {
      confirmToast({
        title: t('placements.confirmOverride'),
        confirmLabel: t('common.yes'),
        cancelLabel: t('common.cancel'),
        prompt: {
          label: t('placements.overrideNote'),
          hint: t('placements.overrideHint'),
          required: true,
        },
        onConfirm: async (value?: string) => {
          await allocate.mutateAsync(value)
        },
      })
      return
    }
    void allocate.mutateAsync(undefined)
  }

  function vacate(item: PlacementAllocation) {
    confirmToast({
      title: t('placements.confirmVacate'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await api.post(`/placements/allocations/${item.id}/vacate`)
          toast.success(t('placements.vacatedOk'))
          if (movingId === item.id) resetForm()
          void queryClient.invalidateQueries({ queryKey: ['placements'] })
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  if (detail.isLoading || !row) return <LoadingState />

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        icon={Building2}
        title={t('placements.details')}
        subtitle={<EntityNameSubtitle name={row.partyName} icon={Building2} />}
        backTo="/placements"
        action={
          row.allocations.length ? (
            <ReservationPlacementSmsButton
              title={t('placements.smsPreviewTitle')}
              label={t('placements.sendSms')}
              phone={
                row.caravanManager?.phone?.trim() || row.createdBy?.phone?.trim() || ''
              }
              body={buildPlacementStaySmsBody(row.allocations, t)}
            />
          ) : null
        }
      />
      <FormCard
        icon={Building2}
        title={row.partyName}
        subtitle={<ReservationCodeBadge code={row.code} size="lg" />}
        chips={
          <>
            <FormMetaChip
              icon={CalendarRange}
              label={
                row.stayStartDate && row.stayEndDate ? (
                  <>
                    {t('placements.stay')}
                    {' · '}
                    <DateText value={row.stayStartDate} />
                    {' — '}
                    <DateText value={row.stayEndDate} />
                  </>
                ) : (
                  t('placements.needStayDates')
                )
              }
            />
            {row.caravanManager ? (
              <>
                <FormMetaChip
                  icon={UserRound}
                  label={`${t('reservations.caravanManager')} · ${row.caravanManager.fullName}`}
                />
                {row.caravanManager.nationalId ? (
                  <FormMetaChip icon={IdCard} copyValue={row.caravanManager.nationalId} />
                ) : null}
                {row.caravanManager.phone ? (
                  <FormMetaChip icon={Phone} copyValue={row.caravanManager.phone} />
                ) : null}
              </>
            ) : null}
          </>
        }
      >
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={Users}>{t('reservations.createSteps.count')}</FormSectionTitle>
          <div
            className={`grid gap-3 ${row.maleCount > 0 && row.femaleCount > 0 ? 'lg:grid-cols-2' : ''}`}
          >
            {row.maleCount > 0 ? (
              <PilgrimCountPanel
                title={t('placements.menGroup')}
                icon={Mars}
                tone="teal"
                totalLabel={t('placements.maleCount')}
                total={n(row.maleCount)}
                allocatedLabel={t('placements.assignedCapacity')}
                allocated={n(row.allocatedMale)}
                remainingLabel={t('placements.remaining')}
                remaining={n(Math.max(0, row.maleCount - row.allocatedMale))}
              />
            ) : null}
            {row.femaleCount > 0 ? (
              <PilgrimCountPanel
                title={t('placements.womenGroup')}
                icon={Venus}
                tone="mint"
                totalLabel={t('placements.femaleCount')}
                total={n(row.femaleCount)}
                allocatedLabel={t('placements.assignedCapacity')}
                allocated={n(row.allocatedFemale)}
                remainingLabel={t('placements.remaining')}
                remaining={n(Math.max(0, row.femaleCount - row.allocatedFemale))}
              />
            ) : null}
          </div>

          {row.allocations.length ? (
            <>
              <FormSectionTitle icon={Building2}>{t('placements.stayLocation')}</FormSectionTitle>
              <div className="space-y-4">
                {row.allocations.map((item) => {
                  const SourceIcon = sourceIcon[item.source]
                  const stayTitle =
                    individual
                      ? t('reservations.placementStayTitle')
                      : item.gender === 'FEMALE'
                        ? t('reservations.placementStayFemale')
                        : t('reservations.placementStayMale')
                  return (
                    <StayAccommodationCard
                      key={item.id}
                      title={stayTitle}
                      gender={item.gender}
                      needed={item.headcount}
                      allocation={item}
                      year={row.year}
                      locale={locale}
                      formatCount={n}
                      highlighted={item.id === movingId}
                      note={item.overrideNote}
                      footerAside={
                        <ReservationPlacementSmsButton
                          title={t('placements.smsPreviewTitle')}
                          label={t('placements.sendSms')}
                          phone={
                            row.caravanManager?.phone?.trim() ||
                            row.createdBy?.phone?.trim() ||
                            ''
                          }
                          body={buildPlacementStaySmsBody([item], t)}
                        />
                      }
                      chips={
                        <>
                          <FormMetaChip
                            icon={SourceIcon}
                            label={
                              item.genderOverride
                                ? `${t(`placements.sources.${item.source}`)} · ${t('placements.overrideFlag')}`
                                : t(`placements.sources.${item.source}`)
                            }
                          />
                          <FormMetaChip
                            icon={CalendarClock}
                            label={<DateText value={item.placedAt} withTime />}
                          />
                        </>
                      }
                      headerAction={
                        <>
                          <Button
                            type="button"
                            variant="soft"
                            onClick={() => {
                              setMovingId(item.id)
                              setAccommodationId('')
                              setGender(item.gender)
                              setHeadcount(String(item.headcount))
                              setAccommodatedCount(String(currentAccommodatedFor(item.gender)))
                            }}
                          >
                            <ArrowRightLeft className="size-4" aria-hidden />
                            {t('placements.move')}
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => vacate(item)}>
                            <LogOut className="size-4" aria-hidden />
                            {t('placements.vacateOne')}
                          </Button>
                        </>
                      }
                    />
                  )
                })}
              </div>
            </>
          ) : null}
        </div>
      </FormCard>

      {showAllocateForm ? (
        <div className="mt-6">
          <FormCard
            icon={LayoutGrid}
            title={movingId ? t('placements.move') : t('placements.allocateManual')}
          >
            <AppForm
              onSubmit={submitAllocate}
              className={formCardBodyClassName}
              autoFocusFirst={false}
            >
              {movingItem ? (
                <FormField icon={Building2} label={t('placements.fromAccommodation')}>
                  <p className={`${fieldClassName} flex min-h-[2.75rem] items-center bg-cream-100/80`}>
                    {movingItem.accommodation.name}
                  </p>
                </FormField>
              ) : null}
              {individual ? null : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    icon={selectedGender === 'FEMALE' ? Venus : selectedGender === 'MALE' ? Mars : Users}
                    label={t('placements.gender')}
                  >
                    <SearchSelect
                      value={selectedGender}
                      placeholder={t('placements.gender')}
                      onChange={(next: string) =>
                        fillHeadcountForGender((next || '') as UserGender | '')
                      }
                      options={genderChoices.map((value) => ({
                        value,
                        label:
                          value === 'FEMALE'
                            ? t('placements.genderFemale')
                            : t('userGenders.MALE'),
                      }))}
                    />
                  </FormField>
                  <FormField icon={Users} label={t('placements.headcount')} htmlFor="placement-headcount">
                    <input
                      id="placement-headcount"
                      type="number"
                      min={1}
                      className={fieldClassName}
                      value={headcount}
                      onChange={(event) => setHeadcount(event.target.value)}
                      required
                    />
                  </FormField>
                </div>
              )}
              <FormField
                icon={Building2}
                label={movingId ? t('placements.toAccommodation') : t('placements.accommodation')}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <SearchSelect
                      value={accommodationId}
                      placeholder={t('placements.selectAccommodation')}
                      onChange={setAccommodationId}
                      options={(availability.data ?? [])
                        .filter((item) => item.id !== movingItem?.accommodationId)
                        .filter((item) => {
                          if (showAllAccommodations || !selectedGender) return true
                          return accommodationMatchesGender(item, selectedGender)
                        })
                        .map((item) => ({
                          value: item.id,
                          label: t('placements.optionRemaining', {
                            name: item.name,
                            male: n(item.remainingMale),
                            female: n(item.remainingFemale),
                          }),
                        }))}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={showAllAccommodations ? 'soft' : 'ghost'}
                    className="shrink-0"
                    aria-pressed={showAllAccommodations}
                    onClick={() => {
                      const next = !showAllAccommodations
                      if (!next && accommodationId && selectedGender) {
                        const picked = availability.data?.find((item) => item.id === accommodationId)
                        if (picked && !accommodationMatchesGender(picked, selectedGender)) {
                          setAccommodationId('')
                        }
                      }
                      setShowAllAccommodations(next)
                    }}
                  >
                    <List className="size-4" aria-hidden />
                    {t('placements.showAllAccommodations')}
                  </Button>
                </div>
              </FormField>
              {selected && selectedGender ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {selectedGender === 'MALE' ? (
                    <>
                      <FormFactTile
                        compact
                        icon={BedDouble}
                        label={t('placements.capacityMale')}
                        value={n(selected.maleCapacity)}
                        tone="teal"
                      />
                      <FormFactTile
                        compact
                        icon={UserCheck}
                        label={t('placements.assignedCapacity')}
                        value={n(Math.max(0, selected.effectiveMale - selected.remainingMale))}
                        tone="teal"
                      />
                      <FormFactTile
                        compact
                        icon={Users}
                        label={t('placements.remainingCapacityMale')}
                        value={n(selected.remainingMale)}
                        tone="teal"
                      />
                    </>
                  ) : (
                    <>
                      <FormFactTile
                        compact
                        icon={BedDouble}
                        label={t('placements.capacityFemale')}
                        value={n(selected.femaleCapacity)}
                        tone="mint"
                      />
                      <FormFactTile
                        compact
                        icon={UserCheck}
                        label={t('placements.assignedCapacity')}
                        value={n(Math.max(0, selected.effectiveFemale - selected.remainingFemale))}
                        tone="mint"
                      />
                      <FormFactTile
                        compact
                        icon={Users}
                        label={t('placements.remainingCapacityFemale')}
                        value={n(selected.remainingFemale)}
                        tone="mint"
                      />
                    </>
                  )}
                </div>
              ) : null}
              {usesOverflow ? (
                <p className="text-sm text-amber-800">{t('placements.overflowWarning')}</p>
              ) : null}
              <div className="flex flex-wrap items-end gap-3">
                <FormField
                  icon={Users}
                  label={t('placements.accommodatedCount')}
                  htmlFor="placement-accommodated"
                >
                  <input
                    id="placement-accommodated"
                    type="number"
                    min={0}
                    className={`${fieldClassName} w-32`}
                    value={accommodatedCount}
                    onChange={(event) => setAccommodatedCount(event.target.value)}
                    required
                  />
                </FormField>
                <FormActions
                  submitLabel={movingId ? t('placements.move') : t('placements.selectStay')}
                  cancelLabel={movingId ? t('common.cancel') : undefined}
                  onCancel={movingId ? resetForm : undefined}
                  submitting={allocate.isPending}
                />
              </div>
            </AppForm>
          </FormCard>
        </div>
      ) : null}
    </div>
  )
}
