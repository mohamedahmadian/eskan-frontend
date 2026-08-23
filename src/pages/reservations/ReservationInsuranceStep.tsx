import {
  Banknote,
  Building2,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Shield,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
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
import { Button, LoadingState, cardClassName } from '../../components/ui/Form'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { ReceptionSettings, Reservation, ReservationMember } from '../../types/app'
import {
  canPayInsurance,
  isInsuranceAccepted,
  summarizeInsurance,
} from './reservation-steps'
import { InsuranceStatusBadge } from './ReservationStatusBadge'

const chartValueLabel = { fill: '#3f3a34', fontSize: 12, fontWeight: 600 }

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
}: {
  reservation: Reservation
  onChanged: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const canSeeMembers = reservation.members !== undefined
  const members = reservation.members ?? []
  const payable = members.filter((item) => canPayInsurance(item.insuranceStatus))
  const groupSelect = reservation.type !== 'INDIVIDUAL'
  const [selected, setSelected] = useState<string[]>([])

  const settings = useQuery({
    queryKey: ['reception-settings', reservation.year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${reservation.year}`)
      return data
    },
  })
  const premium = settings.data?.insurancePremiumAmount ?? 0
  const summary = summarizeInsurance(members, premium)

  const pay = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const { data } = await api.post<Reservation>(
        `/reservations/${reservation.id}/insurance/pay`,
        { memberIds },
      )
      return data
    },
    onSuccess: (data) => {
      toast.success(
        data.status === 'COMPLETED'
          ? t('reservations.insuranceCompleted')
          : t('reservations.insurancePaidOk'),
      )
      setSelected([])
      onChanged()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
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

  function payOne(id: string) {
    pay.mutate([id])
  }

  function paySelected() {
    if (!selected.length) {
      toast.error(t('reservations.insuranceNoneSelected'))
      return
    }
    pay.mutate(selected)
  }

  if (!groupSelect) {
    const member = members[0]
    return (
      <div className="space-y-4">
        {member ? (
          <IndividualPayCard
            member={member}
            amount={moneyText(premium, locale, t)}
            paidAmount={moneyText(member.insurancePaidAmount ?? premium, locale, t)}
            paying={pay.isPending}
            onPay={() => payOne(member.id)}
          />
        ) : null}
        <InsuranceInfoCard settings={settings.data} locale={locale} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <InsuranceStatsCard summary={summary} locale={locale} amountText={moneyText(summary.paidAmount, locale, t)} />
      <InsuranceInfoCard settings={settings.data} locale={locale} />

      <div className={`${cardClassName} overflow-hidden`}>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <th className="px-3 py-2 text-start font-medium" />
                <th className="px-3 py-2 text-start font-medium">{t('reservations.row')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('users.nationalId')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('users.firstName')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('users.lastName')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('users.gender')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('reservations.steps.insurance')}</th>
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
                        onChange={(checked) => toggle(item.id, checked)}
                        label={item.user.fullName}
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{n(index + 1)}</td>
                  <td className="px-3 py-2" dir="ltr">
                    {item.user.nationalId ?? '—'}
                  </td>
                  <td className="px-3 py-2">{item.user.firstName}</td>
                  <td className="px-3 py-2">{item.user.lastName}</td>
                  <td className="px-3 py-2">
                    {item.user.gender ? t(`userGenders.${item.user.gender}`) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <InsuranceStatusBadge status={item.insuranceStatus} />
                    {item.insuranceStatus === 'REJECTED' ? (
                      <p className="mt-1 text-xs text-red-700">
                        {t('reservations.insuranceRejectedHint')}
                        {item.insuranceManualNote
                          ? ` ${t('reservations.rejectionReason')}: ${item.insuranceManualNote}`
                          : ''}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {canPayInsurance(item.insuranceStatus) ? (
                      <Button
                        type="button"
                        variant="soft"
                        disabled={pay.isPending}
                        onClick={() => payOne(item.id)}
                      >
                        {t('reservations.insurancePay')}
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
                    onChange={(checked) => toggle(item.id, checked)}
                    label={item.user.fullName}
                  />
                ) : null}
              </div>
              <p className="text-ink-600" dir="ltr">
                {item.user.nationalId ?? '—'}
              </p>
              <p className="mt-1 text-ink-600">
                {item.user.gender ? t(`userGenders.${item.user.gender}`) : '—'}
              </p>
              <div className="mt-2">
                <InsuranceStatusBadge status={item.insuranceStatus} />
              </div>
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
                  disabled={pay.isPending}
                  onClick={() => payOne(item.id)}
                >
                  {t('reservations.insurancePay')}
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {payable.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-600">
            {t('reservations.insuranceSelectedCount', { count: n(selected.length) })}
          </p>
          <Button type="button" disabled={!selected.length || pay.isPending} onClick={paySelected}>
            {t('reservations.insurancePayMany', { count: n(selected.length) })}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function IndividualPayCard({
  member,
  amount,
  paidAmount,
  paying,
  onPay,
}: {
  member: ReservationMember
  amount: string
  paidAmount: string
  paying: boolean
  onPay: () => void
}) {
  const { t } = useTranslation()
  const accepted = isInsuranceAccepted(member.insuranceStatus)
  const canPay = canPayInsurance(member.insuranceStatus)

  return (
    <section className={`${cardClassName} overflow-hidden p-6 sm:p-8`}>
      <div className="flex flex-col items-center text-center">
        <span
          className={`mb-4 flex size-16 items-center justify-center rounded-3xl shadow-sm ${
            accepted
              ? 'bg-teal-500 text-white shadow-[0_10px_24px_rgba(46,189,182,0.28)]'
              : 'bg-gradient-to-b from-teal-50 to-white text-teal-600 ring-1 ring-teal-100'
          }`}
        >
          {accepted ? <ShieldCheck className="size-8" aria-hidden /> : <Shield className="size-8" aria-hidden />}
        </span>
        <h2 className="text-lg font-semibold text-ink-900">{t('reservations.steps.insurance')}</h2>
        {accepted ? (
          <>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-700">
              {t('reservations.insuranceIndividualPaid')}
            </p>
            <InsurancePaymentFacts
              className="mt-5"
              amount={paidAmount}
              paidAt={member.insurancePaidAt}
              amountLabel={t('reservations.insurancePaidAmount')}
              dateLabel={t('reservations.insurancePaidAt')}
            />
          </>
        ) : (
          <>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-teal-700">{amount}</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-700">
              {t('reservations.insuranceIndividualBody', { amount })}
            </p>
            <p className="mt-1 max-w-md text-sm leading-7 text-ink-500">
              {t('reservations.insuranceIndividualHint')}
            </p>
          </>
        )}
        {member.insuranceStatus === 'REJECTED' ? (
          <p className="mt-3 max-w-md text-sm leading-7 text-red-700">
            {t('reservations.insuranceRejectedHint')}
            {member.insuranceManualNote
              ? ` ${t('reservations.rejectionReason')}: ${member.insuranceManualNote}`
              : ''}
          </p>
        ) : null}
        {canPay ? (
          <Button type="button" className="mt-6" disabled={paying} onClick={onPay}>
            <CreditCard className="size-4" aria-hidden />
            {t('reservations.insurancePayOnline')}
          </Button>
        ) : (
          <div className="mt-4">
            <InsuranceStatusBadge status={member.insuranceStatus} />
          </div>
        )}
      </div>
    </section>
  )
}

function InsurancePaymentFacts({
  amount,
  paidAt,
  amountLabel,
  dateLabel,
  className,
}: {
  amount: string
  paidAt: string | null
  amountLabel: string
  dateLabel: string
  className?: string
}) {
  return (
    <div className={`grid w-full gap-3 sm:grid-cols-2${className ? ` ${className}` : ''}`}>
      <article className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-4 py-4 text-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_18px_rgba(46,189,182,0.28)]">
          <Banknote className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-ink-500">{amountLabel}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-teal-700">{amount}</p>
        </div>
      </article>
      <article className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white px-4 py-4 text-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_18px_rgba(46,189,182,0.28)]">
          <CalendarDays className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-ink-500">{dateLabel}</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">
            {paidAt ? <DateText value={paidAt} withTime /> : '—'}
          </p>
        </div>
      </article>
    </div>
  )
}

function InsuranceStatsCard({
  summary,
  locale,
  amountText,
}: {
  summary: ReturnType<typeof summarizeInsurance>
  locale: string
  amountText: string
}) {
  const { t } = useTranslation()
  const hasPayment = summary.paid + summary.approved > 0 || Boolean(summary.lastPaidAt)
  const tiles: { key: string; label: string; value: number; Icon: LucideIcon; tone: string; iconTone: string }[] = [
    {
      key: 'total',
      label: t('reservations.insuranceTotal'),
      value: summary.total,
      Icon: Users,
      tone: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
      iconTone: 'bg-teal-500 text-white',
    },
    {
      key: 'approved',
      label: t('reservations.insuranceApprovedCount'),
      value: summary.approved,
      Icon: ShieldCheck,
      tone: 'border-emerald-100 bg-gradient-to-b from-emerald-50 to-white',
      iconTone: 'bg-emerald-500 text-white',
    },
    {
      key: 'paid',
      label: t('reservations.insurancePaidCount'),
      value: summary.paid,
      Icon: Wallet,
      tone: 'border-teal-100 bg-gradient-to-b from-[#e7f8f4] to-white',
      iconTone: 'bg-[#2ebdb6] text-white',
    },
    {
      key: 'pending',
      label: t('reservations.insurancePendingCount'),
      value: summary.pending,
      Icon: Clock3,
      tone: 'border-amber-100 bg-gradient-to-b from-amber-50 to-white',
      iconTone: 'bg-amber-500 text-white',
    },
    {
      key: 'rejected',
      label: t('reservations.insuranceRejectedCount'),
      value: summary.rejected,
      Icon: XCircle,
      tone: 'border-red-100 bg-gradient-to-b from-red-50 to-white',
      iconTone: 'bg-red-500 text-white',
    },
  ]
  const chartData = [
    { key: 'approved', name: t('reservations.insuranceApprovedCount'), value: summary.approved, fill: '#059669' },
    { key: 'paid', name: t('reservations.insurancePaidCount'), value: summary.paid, fill: '#2ebdb6' },
    { key: 'pending', name: t('reservations.insurancePendingCount'), value: summary.pending, fill: '#f59e0b' },
    { key: 'rejected', name: t('reservations.insuranceRejectedCount'), value: summary.rejected, fill: '#ef4444' },
  ].filter((item) => item.value > 0)

  return (
    <section className={`${cardClassName} overflow-hidden p-5 sm:p-6`}>
      <header className="mb-5 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_18px_rgba(46,189,182,0.28)]">
          <Shield className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">{t('reservations.insuranceTitle')}</h2>
          <p className="text-xs text-ink-500">
            {t('reservations.insuranceSummary', {
              approved: formatNumber(summary.approved + summary.paid, locale),
              total: formatNumber(summary.total, locale),
            })}
          </p>
        </div>
      </header>
      {hasPayment ? (
        <InsurancePaymentFacts
          amount={amountText}
          paidAt={summary.lastPaidAt}
          amountLabel={t('reservations.insurancePaidSoFar')}
          dateLabel={
            summary.completed
              ? t('reservations.insurancePaymentsCompletedAt')
              : t('reservations.insuranceLastPaidAt')
          }
        />
      ) : null}
      <div className={`${hasPayment ? 'mt-5 ' : ''}grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => (
            <article
              key={tile.key}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${tile.tone}`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${tile.iconTone}`}>
                <tile.Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-500">{tile.label}</p>
                <p className="text-lg font-semibold text-ink-900">{formatNumber(tile.value, locale)}</p>
              </div>
            </article>
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
  )
}

function InsuranceInfoCard({
  settings,
  locale,
}: {
  settings?: ReceptionSettings
  locale: string
}) {
  const { t } = useTranslation()
  const organization = settings?.insuranceOrganization?.trim() || '—'
  const coverage = settings?.insuranceCoverage?.trim() || '—'
  const premium = moneyText(settings?.insurancePremiumAmount ?? 0, locale, t)

  return (
    <section className={`${cardClassName} overflow-hidden p-5 sm:p-6`}>
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-teal-700">
          <Building2 className="size-5" aria-hidden />
        </span>
        <h2 className="text-base font-semibold text-ink-900">{t('reservations.insuranceInfoTitle')}</h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="flex items-start gap-3 rounded-2xl border border-line bg-cream-50/80 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
            <Building2 className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-500">{t('reservations.insuranceOrg')}</p>
            <p className="mt-1 font-medium text-ink-900">{organization}</p>
          </div>
        </article>
        <article className="flex items-start gap-3 rounded-2xl border border-line bg-cream-50/80 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
            <Banknote className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-500">
              {t('reservations.insurancePremium')} · {t('reservations.insurancePerPerson')}
            </p>
            <p className="mt-1 font-medium text-ink-900">{premium}</p>
          </div>
        </article>
      </div>
      <article className="mt-3 flex items-start gap-3 rounded-2xl border border-line bg-gradient-to-l from-white to-teal-50/60 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
          <FileText className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-ink-500">{t('reservations.insuranceCoverage')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-ink-800">{coverage}</p>
        </div>
      </article>
    </section>
  )
}
