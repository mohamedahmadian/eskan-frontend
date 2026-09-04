import {
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { confirmToast } from '../../components/ui/confirmToast'
import { Button, LoadingState, cardClassName } from '../../components/ui/Form'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { FormField, fieldClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type {
  PublicBankAccount,
  ReceptionInsurancePlan,
  ReceptionSettings,
  Reservation,
  ReservationMember,
} from '../../types/app'
import {
  canPayInsurance,
  currentStepFromStatus,
  insurancePaidMethodLabel,
  isInsuranceAccepted,
  neighborFlowStep,
  summarizeInsurance,
  type ReservationStepCode,
} from './reservation-steps'
import { ReservationStepNav } from './ReservationStepNav'
import { ReservationIdentityChips, ReservationSectionHeader } from './ReservationSectionHeader'
import { InsuranceStatusBadge, MemberInsuranceAmountBadges } from './ReservationStatusBadge'

const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

type InsurancePaymentTab = 'online' | 'receipt'

type PayInsurancePayload = {
  memberIds: string[]
  method: InsurancePaymentTab
  receiptDate?: string
  receiptTrackingNo?: string
  receiptBankName?: string
}

type Tone = 'teal' | 'mint' | 'ink' | 'amber' | 'red'

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
  amber: {
    wrap: 'border-amber-100 bg-gradient-to-b from-amber-50 to-white',
    icon: 'bg-amber-500 text-white shadow-[0_8px_16px_rgba(245,158,11,0.28)]',
  },
  red: {
    wrap: 'border-red-100 bg-gradient-to-b from-red-50 to-white',
    icon: 'bg-red-500 text-white shadow-[0_8px_16px_rgba(239,68,68,0.24)]',
  },
}

function chartValueText(value: unknown, locale: string) {
  const n = Number(value ?? 0)
  return n > 0 ? formatNumber(n, locale) : ''
}

function moneyText(amount: number, locale: string, t: (key: string) => string) {
  return `${formatGroupedNumber(amount, locale)} ${t('receptionSettings.toman')}`
}

export function InsuranceStep({
  reservation,
  onChanged,
  onGoToStep,
  mode = 'user',
}: {
  reservation: Reservation
  onChanged: () => void
  onGoToStep?: (step: ReservationStepCode) => void
  mode?: 'user' | 'admin'
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const canSeeMembers = reservation.members !== undefined
  const members = reservation.members ?? []
  const payable = members.filter((item) => canPayInsurance(item.insuranceStatus))
  const groupSelect = reservation.type !== 'INDIVIDUAL'
  const allAccepted =
    members.length > 0 && members.every((item) => isInsuranceAccepted(item.insuranceStatus))
  const [selected, setSelected] = useState<string[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [paymentTab, setPaymentTab] = useState<InsurancePaymentTab>('online')
  const [receiptDate, setReceiptDate] = useState('')
  const [receiptTrackingNo, setReceiptTrackingNo] = useState('')
  const [receiptBankName, setReceiptBankName] = useState('')
  const showNav =
    reservation.status !== 'COMPLETED' &&
    reservation.status !== 'CANCELLED' &&
    reservation.status !== 'REJECTED'
  const prevStep = neighborFlowStep(reservation.type, 'insurance', -1, reservation)

  const settings = useQuery({
    queryKey: ['reception-settings', reservation.year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${reservation.year}`)
      return data
    },
  })
  const plans = settings.data?.insurancePlans ?? []
  const insuranceBankAccount = settings.data?.insuranceBankAccount ?? null
  const receiptPaymentEnabled = mode === 'user' && Boolean(insuranceBankAccount)
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null
  const premium = selectedPlan?.premiumAmount ?? 0
  const summary = summarizeInsurance(members, premium)

  useEffect(() => {
    const list = settings.data?.insurancePlans ?? []
    if (!list.length) {
      setSelectedPlanId('')
      return
    }
    setSelectedPlanId((current) =>
      current && list.some((plan) => plan.id === current) ? current : list[0].id,
    )
  }, [settings.data?.insurancePlans])

  const completeFile = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Reservation>(
        `/reservations/${reservation.id}/insurance/complete`,
      )
      return data
    },
    onSuccess: (data) => {
      toast.success(t('reservations.insuranceCompleted'))
      onChanged()
      onGoToStep?.(currentStepFromStatus(data.status, data.type, data))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const pay = useMutation({
    mutationFn: async (payload: PayInsurancePayload) => {
      if (!selectedPlanId) {
        throw new Error('NO_PLAN')
      }
      const body: Record<string, unknown> = {
        memberIds: payload.memberIds,
        insurancePlanId: selectedPlanId,
        method: payload.method === 'receipt' ? 'RECEIPT' : 'ONLINE',
      }
      if (payload.method === 'receipt') {
        body.receiptDate = payload.receiptDate
        body.receiptTrackingNo = payload.receiptTrackingNo
        body.receiptBankName = payload.receiptBankName
      }
      const { data } = await api.post<Reservation>(
        `/reservations/${reservation.id}/insurance/pay`,
        body,
      )
      return { data, method: payload.method }
    },
    onSuccess: ({ data, method }) => {
      toast.success(
        data.status === 'COMPLETED'
          ? t('reservations.insuranceCompleted')
          : method === 'receipt'
            ? t('reservations.insuranceReceiptSubmittedOk')
            : t('reservations.insurancePaidOk'),
      )
      setSelected([])
      setReceiptDate('')
      setReceiptTrackingNo('')
      setReceiptBankName('')
      onChanged()
      if (data.status === 'COMPLETED') {
        onGoToStep?.(currentStepFromStatus(data.status, data.type, data))
      }
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'NO_PLAN') {
        toast.error(t('reservations.insuranceSelectPlan'))
        return
      }
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  if (!canSeeMembers) {
    return <p className={`${cardClassName} p-4 text-sm text-ink-600`}>{t('reservations.membersHidden')}</p>
  }

  if (settings.isLoading && !settings.data) {
    return <LoadingState />
  }

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    )
  }

  function buildReceiptPayload(memberIds: string[]): PayInsurancePayload | null {
    const tracking = receiptTrackingNo.trim()
    const bank = receiptBankName.trim()
    if (!receiptDate) {
      toast.error(t('reservations.insuranceReceiptDate'))
      return null
    }
    if (!tracking) {
      toast.error(t('reservations.insuranceReceiptTrackingNo'))
      return null
    }
    if (!bank) {
      toast.error(t('reservations.insuranceReceiptBankName'))
      return null
    }
    return {
      memberIds,
      method: 'receipt',
      receiptDate,
      receiptTrackingNo: tracking,
      receiptBankName: bank,
    }
  }

  function payOne(id: string) {
    if (!selectedPlanId) {
      toast.error(t('reservations.insuranceSelectPlan'))
      return
    }
    if (mode === 'user' && paymentTab === 'receipt') {
      const payload = buildReceiptPayload([id])
      if (!payload) return
      pay.mutate(payload)
      return
    }
    pay.mutate({ memberIds: [id], method: 'online' })
  }

  function paySelected() {
    if (!selectedPlanId) {
      toast.error(t('reservations.insuranceSelectPlan'))
      return
    }
    if (!selected.length) {
      toast.error(t('reservations.insuranceNoneSelected'))
      return
    }
    if (mode === 'user' && paymentTab === 'receipt') {
      const payload = buildReceiptPayload(selected)
      if (!payload) return
      pay.mutate(payload)
      return
    }
    pay.mutate({ memberIds: selected, method: 'online' })
  }

  const payableIds = payable.map((item) => item.id)
  const allSelected = payableIds.length > 0 && payableIds.every((id) => selected.includes(id))

  function toggleAll(checked: boolean) {
    setSelected(checked ? payableIds : [])
  }

  function selectAll() {
    setSelected(payableIds)
  }

  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <ReservationSectionHeader
        icon={Shield}
        title={t('reservations.steps.insurance')}
        hint={t(
          mode === 'admin' ? 'reservations.insuranceStepHintAdmin' : 'reservations.insuranceStepHint',
        )}
        badge={
          allAccepted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-2 py-0.5 text-[11px] font-medium text-white">
              <ShieldCheck className="size-3" aria-hidden />
              {t('reservations.insuranceCompleteBadge')}
            </span>
          ) : null
        }
        chips={<ReservationIdentityChips reservation={reservation} />}
      />

      <div className="space-y-5 p-5 sm:p-6">
        <InsuranceInfoSection
          settings={settings.data}
          locale={locale}
          selectedPlanId={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
          canSelect={!allAccepted}
        />
        {groupSelect ? (
          <GroupInsuranceBody
            reservationId={reservation.id}
            members={members}
            summary={summary}
            locale={locale}
            amountText={moneyText(summary.paidAmount, locale, t)}
            planCoverage={selectedPlan?.coverageAmount ?? 0}
            planPremium={premium}
            selected={selected}
            allSelected={allSelected}
            canSelect={payableIds.length > 0 && Boolean(selectedPlanId)}
            paying={pay.isPending}
            mode={mode}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onSelectAll={selectAll}
            onPayOne={payOne}
            onChanged={onChanged}
          />
        ) : (
          <IndividualInsuranceBody
            member={members[0]}
            reservationId={reservation.id}
            amount={moneyText(premium, locale, t)}
            paidAmount={moneyText(members[0]?.insurancePaidAmount ?? premium, locale, t)}
            paying={pay.isPending}
            mode={mode}
            locale={locale}
            canPayPlan={Boolean(selectedPlanId)}
            paymentTab={paymentTab}
            onPaymentTabChange={setPaymentTab}
            receiptPaymentEnabled={receiptPaymentEnabled}
            insuranceBankAccount={insuranceBankAccount}
            receiptDate={receiptDate}
            receiptTrackingNo={receiptTrackingNo}
            receiptBankName={receiptBankName}
            onReceiptDateChange={setReceiptDate}
            onReceiptTrackingNoChange={setReceiptTrackingNo}
            onReceiptBankNameChange={setReceiptBankName}
            onPay={() => members[0] && payOne(members[0].id)}
            onChanged={onChanged}
          />
        )}
        {groupSelect && payable.length ? (
          <InsuranceSelectionBar
            selectedCount={selected.length}
            premiumTotal={selected.length * premium}
            locale={locale}
            paying={pay.isPending}
            mode={mode}
            paymentTab={paymentTab}
            onPaymentTabChange={setPaymentTab}
            receiptPaymentEnabled={receiptPaymentEnabled}
            insuranceBankAccount={insuranceBankAccount}
            receiptDate={receiptDate}
            receiptTrackingNo={receiptTrackingNo}
            receiptBankName={receiptBankName}
            onReceiptDateChange={setReceiptDate}
            onReceiptTrackingNoChange={setReceiptTrackingNo}
            onReceiptBankNameChange={setReceiptBankName}
            onPay={paySelected}
          />
        ) : null}
      </div>
      {showNav ? (
        <ReservationStepNav
          onPrev={prevStep && onGoToStep ? () => onGoToStep(prevStep) : undefined}
          onNext={
            allAccepted
              ? () =>
                  confirmToast({
                    title: t('reservations.confirmComplete'),
                    confirmLabel: t('reservations.steps.complete'),
                    cancelLabel: t('common.cancel'),
                    onConfirm: () => completeFile.mutate(),
                  })
              : undefined
          }
          nextLabel={t('reservations.steps.complete')}
          nextIcon="complete"
          nextPending={completeFile.isPending}
        />
      ) : null}
    </section>
  )
}

function IndividualInsuranceBody({
  member,
  reservationId,
  amount,
  paidAmount,
  paying,
  mode,
  locale,
  canPayPlan,
  paymentTab,
  onPaymentTabChange,
  receiptPaymentEnabled,
  insuranceBankAccount,
  receiptDate,
  receiptTrackingNo,
  receiptBankName,
  onReceiptDateChange,
  onReceiptTrackingNoChange,
  onReceiptBankNameChange,
  onPay,
  onChanged,
}: {
  member?: ReservationMember
  reservationId: string
  amount: string
  paidAmount: string
  paying: boolean
  mode: 'user' | 'admin'
  locale: string
  canPayPlan: boolean
  paymentTab: InsurancePaymentTab
  onPaymentTabChange: (tab: InsurancePaymentTab) => void
  receiptPaymentEnabled: boolean
  insuranceBankAccount: PublicBankAccount | null
  receiptDate: string
  receiptTrackingNo: string
  receiptBankName: string
  onReceiptDateChange: (value: string) => void
  onReceiptTrackingNoChange: (value: string) => void
  onReceiptBankNameChange: (value: string) => void
  onPay: () => void
  onChanged: () => void
}) {
  const { t } = useTranslation()
  if (!member) return null
  const accepted = isInsuranceAccepted(member.insuranceStatus)
  const awaitingApproval = member.insuranceStatus === 'PAID'
  const canPay = canPayInsurance(member.insuranceStatus)

  return (
    <>
      <section>
        <SectionTitle icon={Wallet}>{t('reservations.insurancePremium')}</SectionTitle>
        {accepted || awaitingApproval ? (
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {member.insuranceCoverageAmount != null ? (
              <FactTile
                icon={Shield}
                label={t('reservations.insuranceCoverageAmount')}
                value={moneyText(member.insuranceCoverageAmount, locale, t)}
                tone="mint"
              />
            ) : null}
            <FactTile
              icon={Banknote}
              label={t('reservations.insurancePaidAmount')}
              value={paidAmount}
              tone="teal"
            />
            <FactTile
              icon={CalendarDays}
              label={t('reservations.insurancePaidAt')}
              value={member.insurancePaidAt ? <DateText value={member.insurancePaidAt} withTime /> : '—'}
              empty={!member.insurancePaidAt}
              tone="mint"
            />
            <FactTile
              icon={Wallet}
              label={t('reservations.insurancePaidMethod')}
              value={insurancePaidMethodLabel(member.insurancePaidMethod, t) ?? '—'}
              empty={!member.insurancePaidMethod}
              tone="teal"
            />
            <FactTile
              icon={UserRound}
              label={t('reservations.insurancePaidBy')}
              value={member.insurancePaidBy?.fullName ?? '—'}
              empty={!member.insurancePaidBy}
              tone="ink"
            />
          </div>
        ) : (
          <FactTile icon={Banknote} label={t('reservations.insurancePremium')} value={amount} tone="teal" />
        )}
        {accepted ? null : awaitingApproval ? (
          <p className="mt-3 text-sm leading-7 text-teal-800">
            {t('reservations.insuranceReceiptAwaitingApproval')}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-7 text-ink-700">
            {t('reservations.insuranceIndividualBody', { amount })}
          </p>
        )}
        {awaitingApproval || member.insurancePaidMethod === 'BANK_RECEIPT' ? (
          <InsuranceReceiptDetails member={member} locale={locale} className="mt-4" />
        ) : null}
        {mode === 'admin' && awaitingApproval ? (
          <AdminInsuranceReview
            reservationId={reservationId}
            member={member}
            onChanged={onChanged}
            className="mt-4"
          />
        ) : null}
        {mode === 'admin' && !accepted && !awaitingApproval ? (
          <p className="mt-1 text-sm leading-7 text-ink-500">
            {t('reservations.insuranceIndividualHintAdmin')}
          </p>
        ) : null}
        {member.insuranceStatus === 'REJECTED' ? (
          <p className="mt-3 text-sm leading-7 text-red-700">
            {t('reservations.insuranceRejectedHint')}
            {member.insuranceManualNote
              ? ` ${t('reservations.rejectionReason')}: ${member.insuranceManualNote}`
              : ''}
          </p>
        ) : null}
        {canPay ? (
          <div className="mt-4 space-y-4">
            {mode === 'user' ? (
              <InsurancePaymentTabs
                tab={paymentTab}
                onChange={onPaymentTabChange}
                receiptEnabled={receiptPaymentEnabled}
                onOnlineActivate={onPay}
                canPayOnline={canPayPlan && !paying}
              />
            ) : null}
            {mode === 'user' && paymentTab === 'receipt' && receiptPaymentEnabled && insuranceBankAccount ? (
              <>
                <InsuranceBankAccountInfo account={insuranceBankAccount} />
                <InsuranceReceiptForm
                  receiptDate={receiptDate}
                  receiptTrackingNo={receiptTrackingNo}
                  receiptBankName={receiptBankName}
                  onReceiptDateChange={onReceiptDateChange}
                  onReceiptTrackingNoChange={onReceiptTrackingNoChange}
                  onReceiptBankNameChange={onReceiptBankNameChange}
                  onSubmit={(event) => {
                    event.preventDefault()
                    onPay()
                  }}
                  submitting={paying}
                  disabled={!canPayPlan}
                />
              </>
            ) : mode === 'admin' ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" disabled={paying || !canPayPlan} onClick={onPay}>
                  <Banknote className="size-4" aria-hidden />
                  {t('reservations.insurancePayManual')}
                </Button>
              </div>
            ) : null}
          </div>
        ) : accepted || awaitingApproval ? (
          <div className="mt-4">
            <InsuranceStatusBadge status={member.insuranceStatus} />
          </div>
        ) : (
          <div className="mt-4">
            <InsuranceStatusBadge status={member.insuranceStatus} />
          </div>
        )}
      </section>
    </>
  )
}

function GroupInsuranceBody({
  reservationId,
  members,
  summary,
  locale,
  amountText,
  planCoverage,
  planPremium,
  selected,
  allSelected,
  canSelect,
  paying,
  mode,
  onToggle,
  onToggleAll,
  onSelectAll,
  onPayOne,
  onChanged,
}: {
  reservationId: string
  members: ReservationMember[]
  summary: ReturnType<typeof summarizeInsurance>
  locale: string
  amountText: string
  planCoverage: number
  planPremium: number
  selected: string[]
  allSelected: boolean
  canSelect: boolean
  paying: boolean
  mode: 'user' | 'admin'
  onToggle: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
  onSelectAll: () => void
  onPayOne: (id: string) => void
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const n = (value: number) => formatNumber(value, locale)
  const hasPayment = summary.approved > 0 || summary.paid > 0 || Boolean(summary.lastPaidAt)
  const tiles: { key: string; label: string; value: number; Icon: LucideIcon; tone: Tone }[] = [
    {
      key: 'total',
      label: t('reservations.insuranceTotal'),
      value: summary.total,
      Icon: Users,
      tone: 'teal',
    },
    {
      key: 'approved',
      label: t('reservations.insuranceApprovedCount'),
      value: summary.approved,
      Icon: ShieldCheck,
      tone: 'mint',
    },
    ...(summary.paid > 0
      ? [
          {
            key: 'paid',
            label: t('reservations.insuranceAwaitingApprovalCount'),
            value: summary.paid,
            Icon: Clock3,
            tone: 'amber' as Tone,
          },
        ]
      : []),
    {
      key: 'pending',
      label: t('reservations.insurancePendingCount'),
      value: summary.pending,
      Icon: Clock3,
      tone: 'amber',
    },
    {
      key: 'rejected',
      label: t('reservations.insuranceRejectedCount'),
      value: summary.rejected,
      Icon: XCircle,
      tone: 'red',
    },
  ]
  const chartData = [
    { key: 'approved', name: t('reservations.insuranceApprovedCount'), value: summary.approved, fill: '#059669' },
    ...(summary.paid > 0
      ? [
          {
            key: 'paid',
            name: t('reservations.insuranceAwaitingApprovalCount'),
            value: summary.paid,
            fill: '#2ebdb6',
          },
        ]
      : []),
    { key: 'pending', name: t('reservations.insurancePendingCount'), value: summary.pending, fill: '#f59e0b' },
    { key: 'rejected', name: t('reservations.insuranceRejectedCount'), value: summary.rejected, fill: '#ef4444' },
  ].filter((item) => item.value > 0)

  return (
    <>
      <section>
        <SectionTitle icon={Users}>{t('reservations.insuranceTotal')}</SectionTitle>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {tiles.map((tile) => (
              <MetricTile
                key={tile.key}
                icon={tile.Icon}
                label={tile.label}
                value={n(tile.value)}
                unit={t('reservations.people')}
                tone={tile.tone}
              />
            ))}
          </div>
          {chartData.length ? (
            <div className="relative h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    cornerRadius={6}
                    stroke="#ffffff"
                    strokeWidth={3}
                    labelLine={false}
                  >
                    {chartData.map((item) => (
                      <Cell key={item.key} fill={item.fill} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="outside"
                      offset={8}
                      style={chartValueLabel}
                      formatter={(value) => chartValueText(value, locale)}
                    />
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0]
                      const value = Number(item.value ?? 0)
                      if (!value) return null
                      return (
                        <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink-800 shadow-sm">
                          {String(item.name ?? '')}: {formatNumber(value, locale)}
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </section>

      {hasPayment ? (
        <section>
          <SectionTitle icon={Banknote}>{t('reservations.insurancePaidAmount')}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FactTile
              icon={Banknote}
              label={t('reservations.insurancePaidSoFar')}
              value={amountText}
              tone="teal"
            />
            <FactTile
              icon={CalendarDays}
              label={
                summary.completed
                  ? t('reservations.insurancePaymentsCompletedAt')
                  : t('reservations.insuranceLastPaidAt')
              }
              value={summary.lastPaidAt ? <DateText value={summary.lastPaidAt} withTime /> : '—'}
              empty={!summary.lastPaidAt}
              tone="mint"
            />
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <SectionTitle className="mb-0" icon={Users}>
            {t('reservations.insuranceMembers')}
          </SectionTitle>
          {canSelect ? (
            <Button type="button" variant="soft" onClick={onSelectAll}>
              <CheckCheck className="size-4" aria-hidden />
              {t('reservations.selectAll')}
            </Button>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">
                    {canSelect ? (
                      <CheckboxField
                        compact
                        checked={allSelected}
                        onChange={onToggleAll}
                        label={t('reservations.selectAll')}
                      />
                    ) : null}
                  </th>
                  <th className="px-3 py-2 text-start font-medium">{t('reservations.row')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('users.nationalId')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('users.firstName')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('users.lastName')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('users.gender')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('reservations.steps.insurance')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('reservations.insurancePaidMethod')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((item, index) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      {canPayInsurance(item.insuranceStatus) ? (
                        <CheckboxField
                          compact
                          checked={selected.includes(item.id)}
                          onChange={(checked) => onToggle(item.id, checked)}
                          label={item.user.fullName}
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{n(index + 1)}</td>
                    <td className="px-3 py-2">
                      <CopyableDigits value={item.user.nationalId} />
                    </td>
                    <td className="px-3 py-2">{item.user.firstName}</td>
                    <td className="px-3 py-2">{item.user.lastName}</td>
                    <td className="px-3 py-2">
                      {item.user.gender ? t(`userGenders.${item.user.gender}`) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <InsuranceStatusBadge status={item.insuranceStatus} />
                      <MemberInsuranceAmountBadges
                        coverageAmount={item.insuranceCoverageAmount ?? planCoverage}
                        premiumAmount={item.insurancePaidAmount ?? planPremium}
                        locale={locale}
                      />
                      {item.insuranceStatus === 'PAID' ? (
                        <InsuranceReceiptDetails member={item} locale={locale} compact className="mt-2" />
                      ) : null}
                      {item.insuranceStatus === 'REJECTED' ? (
                        <p className="mt-1 text-xs text-red-700">
                          {t('reservations.insuranceRejectedHint')}
                          {item.insuranceManualNote
                            ? ` ${t('reservations.rejectionReason')}: ${item.insuranceManualNote}`
                            : ''}
                        </p>
                      ) : null}
                      {mode === 'admin' && item.insuranceStatus === 'PAID' ? (
                        <AdminInsuranceReview
                          reservationId={reservationId}
                          member={item}
                          onChanged={onChanged}
                          compact
                          className="mt-2"
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {insurancePaidMethodLabel(item.insurancePaidMethod, t) ?? '—'}
                      {item.insurancePaidBy?.fullName ? (
                        <p className="mt-1 text-xs text-ink-500">{item.insurancePaidBy.fullName}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {canPayInsurance(item.insuranceStatus) ? (
                        <Button
                          type="button"
                          variant="soft"
                          disabled={paying}
                          onClick={() => onPayOne(item.id)}
                        >
                          {t(mode === 'admin' ? 'reservations.insurancePayManual' : 'reservations.insurancePay')}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {members.map((item, index) => (
              <article key={item.id} className="rounded-2xl border border-line bg-cream-50 p-3 text-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-medium text-ink-900">
                    {n(index + 1)}. {item.user.firstName} {item.user.lastName}
                  </p>
                  {canPayInsurance(item.insuranceStatus) ? (
                    <CheckboxField
                      compact
                      checked={selected.includes(item.id)}
                      onChange={(checked) => onToggle(item.id, checked)}
                      label={item.user.fullName}
                    />
                  ) : null}
                </div>
                <p className="text-ink-600">
                  <CopyableDigits value={item.user.nationalId} />
                </p>
                <p className="mt-1 text-ink-600">
                  {item.user.gender ? t(`userGenders.${item.user.gender}`) : '—'}
                </p>
                <div className="mt-2">
                  <InsuranceStatusBadge status={item.insuranceStatus} />
                  <MemberInsuranceAmountBadges
                    coverageAmount={item.insuranceCoverageAmount ?? planCoverage}
                    premiumAmount={item.insurancePaidAmount ?? planPremium}
                    locale={locale}
                  />
                </div>
                {item.insuranceStatus === 'PAID' ? (
                  <InsuranceReceiptDetails member={item} locale={locale} compact className="mt-2" />
                ) : null}
                {mode === 'admin' && item.insuranceStatus === 'PAID' ? (
                  <AdminInsuranceReview
                    reservationId={reservationId}
                    member={item}
                    onChanged={onChanged}
                    compact
                    className="mt-2"
                  />
                ) : null}
                {item.insurancePaidMethod ? (
                  <p className="mt-1 text-xs text-ink-600">
                    {insurancePaidMethodLabel(item.insurancePaidMethod, t)}
                    {item.insurancePaidBy?.fullName ? ` · ${item.insurancePaidBy.fullName}` : ''}
                  </p>
                ) : null}
                {item.insuranceStatus === 'REJECTED' ? (
                  <p className="mt-2 text-xs text-red-700">
                    {t('reservations.insuranceRejectedHint')}
                    {item.insuranceManualNote
                      ? ` ${t('reservations.rejectionReason')}: ${item.insuranceManualNote}`
                      : ''}
                  </p>
                ) : null}
                {canPayInsurance(item.insuranceStatus) ? (
                  <Button
                    type="button"
                    variant="soft"
                    className="mt-3"
                    disabled={paying}
                    onClick={() => onPayOne(item.id)}
                  >
                    {t(mode === 'admin' ? 'reservations.insurancePayManual' : 'reservations.insurancePay')}
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function InsuranceSelectionBar({
  selectedCount,
  premiumTotal,
  locale,
  paying,
  mode,
  paymentTab,
  onPaymentTabChange,
  receiptPaymentEnabled,
  insuranceBankAccount,
  receiptDate,
  receiptTrackingNo,
  receiptBankName,
  onReceiptDateChange,
  onReceiptTrackingNoChange,
  onReceiptBankNameChange,
  onPay,
}: {
  selectedCount: number
  premiumTotal: number
  locale: string
  paying: boolean
  mode: 'user' | 'admin'
  paymentTab: InsurancePaymentTab
  onPaymentTabChange: (tab: InsurancePaymentTab) => void
  receiptPaymentEnabled: boolean
  insuranceBankAccount: PublicBankAccount | null
  receiptDate: string
  receiptTrackingNo: string
  receiptBankName: string
  onReceiptDateChange: (value: string) => void
  onReceiptTrackingNoChange: (value: string) => void
  onReceiptBankNameChange: (value: string) => void
  onPay: () => void
}) {
  const { t } = useTranslation()
  const n = (value: number) => formatNumber(value, locale)

  return (
    <section aria-live="polite" className="space-y-4">
      {mode === 'user' ? (
        <InsurancePaymentTabs
          tab={paymentTab}
          onChange={onPaymentTabChange}
          receiptEnabled={receiptPaymentEnabled}
          onOnlineActivate={onPay}
          canPayOnline={selectedCount > 0 && !paying}
        />
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <FactTile
            icon={Users}
            label={t('reservations.insuranceSelectedLabel')}
            value={`${n(selectedCount)} ${t('reservations.people')}`}
            tone="teal"
          />
          <FactTile
            icon={Banknote}
            label={t('reservations.insuranceSelectedPremium')}
            value={moneyText(premiumTotal, locale, t)}
            tone="mint"
          />
        </div>
        {mode === 'user' && paymentTab === 'receipt' && receiptPaymentEnabled && insuranceBankAccount ? (
          <div className="w-full space-y-4 lg:flex-1">
            <InsuranceBankAccountInfo account={insuranceBankAccount} />
            <InsuranceReceiptForm
              receiptDate={receiptDate}
              receiptTrackingNo={receiptTrackingNo}
              receiptBankName={receiptBankName}
              onReceiptDateChange={onReceiptDateChange}
              onReceiptTrackingNoChange={onReceiptTrackingNoChange}
              onReceiptBankNameChange={onReceiptBankNameChange}
              onSubmit={(event) => {
                event.preventDefault()
                onPay()
              }}
              submitting={paying}
              disabled={!selectedCount}
              submitLabel={t('reservations.insurancePayMany', { count: n(selectedCount) })}
            />
          </div>
        ) : mode === 'admin' ? (
          <div className="flex items-center">
            <Button
              type="button"
              className="w-full lg:min-h-[4.25rem] lg:w-auto"
              disabled={!selectedCount || paying}
              onClick={onPay}
            >
              <Banknote className="size-4" aria-hidden />
              {t('reservations.insurancePayManualMany', { count: n(selectedCount) })}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function InsuranceInfoSection({
  settings,
  locale,
  selectedPlanId,
  onSelectPlan,
  canSelect,
}: {
  settings?: ReceptionSettings
  locale: string
  selectedPlanId: string
  onSelectPlan: (id: string) => void
  canSelect: boolean
}) {
  const { t } = useTranslation()
  const organization = settings?.insuranceOrganization?.trim() || '—'
  const plans = settings?.insurancePlans ?? []

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-cream-50/80 px-3 py-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-white">
          <Building2 className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-ink-500">{t('reservations.insuranceOrg')}</p>
          <p className="truncate text-sm font-semibold text-ink-900">{organization}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-mint-100 text-mint-700">
              <Shield className="size-3" aria-hidden />
            </span>
            {t('reservations.insuranceSelectPlan')}
          </h3>
          {canSelect && plans.length > 0 ? (
            <p className="text-[11px] text-ink-400">{t('reservations.insuranceSelectPlanHint')}</p>
          ) : null}
        </div>
        {plans.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-cream-50 px-3 py-2.5 text-sm text-ink-500">
            {t('reservations.insuranceNoPlans')}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {plans.map((plan) => (
              <InsurancePlanCard
                key={plan.id}
                plan={plan}
                locale={locale}
                selected={selectedPlanId === plan.id}
                disabled={!canSelect}
                onSelect={() => onSelectPlan(plan.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function InsurancePlanCard({
  plan,
  locale,
  selected,
  disabled,
  onSelect,
}: {
  plan: ReceptionInsurancePlan
  locale: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const desc = plan.description.trim()

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      title={desc || undefined}
      className={`group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-start transition ${
        selected
          ? 'border-teal-400 bg-teal-50/90 ring-1 ring-teal-300/60'
          : 'border-line bg-white hover:border-teal-200 hover:bg-cream-50/60'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
          selected
            ? 'bg-teal-500 text-white shadow-sm'
            : 'bg-cream-100 text-teal-700 group-hover:bg-teal-100'
        }`}
        aria-hidden
      >
        {selected ? <Check className="size-4" /> : <Shield className="size-3.5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-xs text-ink-600">
            <ShieldCheck className="size-3.5 shrink-0 text-mint-600" aria-hidden />
            <span className="text-ink-400">{t('reservations.insuranceCoverage')}:</span>
            <span className="font-semibold text-ink-900">
              {moneyText(plan.coverageAmount, locale, t)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-ink-600">
            <Banknote className="size-3.5 shrink-0 text-teal-600" aria-hidden />
            <span className="text-ink-400">{t('reservations.insurancePremium')}:</span>
            <span className="font-semibold text-teal-700">
              {moneyText(plan.premiumAmount, locale, t)}
            </span>
            <span className="text-[10px] text-ink-400">({t('reservations.insurancePerPerson')})</span>
          </span>
        </div>
        {desc ? (
          <p className="mt-0.5 truncate text-[11px] leading-4 text-ink-500">{desc}</p>
        ) : null}
      </div>

      <span
        className={`size-4 shrink-0 rounded-full border-2 ${
          selected ? 'border-teal-500 bg-teal-500' : 'border-line bg-white'
        }`}
        aria-hidden
      />
    </button>
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

function FactTile({
  icon: Icon,
  label,
  value,
  empty,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  empty?: boolean
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article className={`relative z-10 flex items-center gap-3 rounded-2xl border px-3 py-3 ${colors.wrap}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-500">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold ${empty ? 'text-ink-400' : 'text-ink-900'}`}>
          {value}
        </p>
      </div>
    </article>
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

function InsurancePaymentTabs({
  tab,
  onChange,
  receiptEnabled,
  onOnlineActivate,
  canPayOnline = true,
}: {
  tab: InsurancePaymentTab
  onChange: (tab: InsurancePaymentTab) => void
  receiptEnabled: boolean
  onOnlineActivate?: () => void
  canPayOnline?: boolean
}) {
  const { t } = useTranslation()

  function selectOnline() {
    if (tab !== 'online') onChange('online')
    if (canPayOnline) onOnlineActivate?.()
  }

  return (
    <nav className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={!canPayOnline}
        onClick={selectOnline}
        className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
          tab === 'online'
            ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
            : 'bg-white text-ink-700 ring-1 ring-line hover:bg-cream-50'
        } ${!canPayOnline ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <CreditCard className={`size-3.5 ${tab === 'online' ? 'text-white' : 'text-teal-600'}`} aria-hidden />
        {t('reservations.insurancePaymentTabOnline')}
      </button>
      {receiptEnabled ? (
        <button
          type="button"
          onClick={() => onChange('receipt')}
          className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
            tab === 'receipt'
              ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
              : 'bg-white text-ink-700 ring-1 ring-line hover:bg-cream-50'
          }`}
        >
          <Receipt className={`size-3.5 ${tab === 'receipt' ? 'text-white' : 'text-teal-600'}`} aria-hidden />
          {t('reservations.insurancePaymentTabReceipt')}
        </button>
      ) : null}
    </nav>
  )
}

function InsuranceBankAccountInfo({ account }: { account: PublicBankAccount }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
      <p className="text-sm leading-7 text-ink-700">{t('reservations.insuranceReceiptHint')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <FactTile
          icon={Landmark}
          label={t('reservations.insuranceReceiptBankName')}
          value={account.bankName}
          tone="teal"
        />
        <FactTile
          icon={Wallet}
          label={t('reservations.insuranceReceiptAccountNumber')}
          value={<CopyableDigits value={account.accountNumber} />}
          tone="mint"
        />
        {account.cardNumber ? (
          <FactTile
            icon={CreditCard}
            label={t('reservations.insuranceReceiptCardNumber')}
            value={<CopyableDigits value={account.cardNumber} />}
            tone="teal"
          />
        ) : null}
        <FactTile
          icon={FileText}
          label={t('reservations.insuranceReceiptIban')}
          value={<CopyableDigits value={account.iban} />}
          tone="mint"
        />
      </div>
    </div>
  )
}

function InsuranceReceiptForm({
  receiptDate,
  receiptTrackingNo,
  receiptBankName,
  onReceiptDateChange,
  onReceiptTrackingNoChange,
  onReceiptBankNameChange,
  onSubmit,
  submitting,
  disabled,
  submitLabel,
}: {
  receiptDate: string
  receiptTrackingNo: string
  receiptBankName: string
  onReceiptDateChange: (value: string) => void
  onReceiptTrackingNoChange: (value: string) => void
  onReceiptBankNameChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
  submitting: boolean
  disabled?: boolean
  submitLabel?: string
}) {
  const { t } = useTranslation()
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line bg-white p-4">
      <SectionTitle icon={Receipt}>{t('reservations.insuranceReceiptDetails')}</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-3">
        <FormField icon={Landmark} label={t('reservations.insuranceReceiptBankName')} htmlFor="insuranceReceiptBankName">
          <input
            id="insuranceReceiptBankName"
            className={fieldClassName}
            value={receiptBankName}
            onChange={(event) => onReceiptBankNameChange(event.target.value)}
            maxLength={120}
            required
          />
        </FormField>
        <FormField icon={FileText} label={t('reservations.insuranceReceiptTrackingNo')} htmlFor="insuranceReceiptTrackingNo">
          <input
            id="insuranceReceiptTrackingNo"
            className={fieldClassName}
            value={receiptTrackingNo}
            onChange={(event) => onReceiptTrackingNoChange(event.target.value)}
            maxLength={100}
            required
          />
        </FormField>
        <FormField icon={CalendarDays} label={t('reservations.insuranceReceiptDate')} htmlFor="insuranceReceiptDate">
          <PersianDateField
            id="insuranceReceiptDate"
            value={receiptDate}
            onChange={onReceiptDateChange}
            required
          />
        </FormField>
      </div>
      <Button type="submit" disabled={submitting || disabled}>
        <Check className="size-4" aria-hidden />
        {submitLabel ?? t('reservations.insuranceReceiptSubmit')}
      </Button>
    </form>
  )
}

function InsuranceReceiptDetails({
  member,
  locale,
  compact,
  className = '',
}: {
  member: ReservationMember
  locale: string
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  if (member.insurancePaidMethod !== 'BANK_RECEIPT') return null
  const items = [
    {
      label: t('reservations.insuranceReceiptDate'),
      value: member.insuranceReceiptDate ? <DateText value={member.insuranceReceiptDate} /> : '—',
    },
    {
      label: t('reservations.insuranceReceiptTrackingNo'),
      value: member.insurancePaymentRef ? <CopyableDigits value={member.insurancePaymentRef} /> : '—',
    },
    {
      label: t('reservations.insuranceReceiptBankName'),
      value: member.insuranceReceiptBankName ?? '—',
    },
  ]
  if (compact) {
    return (
      <div className={`space-y-1 text-xs text-ink-600 ${className}`}>
        {items.map((item) => (
          <p key={item.label}>
            <span className="text-ink-400">{item.label}:</span> {item.value}
          </p>
        ))}
      </div>
    )
  }
  return (
    <div className={`grid gap-2 sm:grid-cols-3 ${className}`}>
      {items.map((item) => (
        <FactTile key={item.label} icon={FileText} label={item.label} value={item.value} tone="ink" />
      ))}
    </div>
  )
}

function AdminInsuranceReview({
  reservationId,
  member,
  onChanged,
  compact,
  className = '',
}: {
  reservationId: string
  member: ReservationMember
  onChanged: () => void
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const review = useMutation({
    mutationFn: async (status: 'APPROVED' | 'REJECTED') => {
      const { data } = await api.patch<Reservation>(
        `/reservations/${reservationId}/members/${member.id}/insurance`,
        { status, note: status === 'REJECTED' ? note.trim() : undefined },
      )
      return data
    },
    onSuccess: (data) => {
      toast.success(
        data.status === 'COMPLETED'
          ? t('reservations.insuranceCompleted')
          : t('common.saved'),
      )
      setNote('')
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  return (
    <div className={`space-y-2 ${className}`}>
      {!compact ? (
        <FormField icon={FileText} label={t('reservations.reviewNotes')} htmlFor={`insurance-note-${member.id}`}>
          <textarea
            id={`insurance-note-${member.id}`}
            className={fieldClassName}
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('reservations.reviewNotesPlaceholder')}
          />
        </FormField>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="soft"
          disabled={review.isPending}
          onClick={() => review.mutate('APPROVED')}
        >
          <Check className="size-4" aria-hidden />
          {t('reservations.insuranceApproveReceipt')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={review.isPending}
          onClick={() => {
            if (!note.trim()) {
              toast.error(t('reservations.rejectionReason'))
              return
            }
            review.mutate('REJECTED')
          }}
        >
          <X className="size-4 text-red-600" aria-hidden />
          {t('reservations.insuranceRejectReceipt')}
        </Button>
      </div>
    </div>
  )
}
