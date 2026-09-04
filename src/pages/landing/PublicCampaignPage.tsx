import {
  ArrowRight,
  CalendarRange,
  Coins,
  CreditCard,
  Hash,
  HeartHandshake,
  Landmark,
  LogIn,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { DateText } from '../../components/ui/DateText'
import { LoadingState } from '../../components/ui/Form'
import { FormEmptyHint, FormFactTile } from '../../components/ui/FormLayout'
import { api, getImageUrl } from '../../lib/api'
import { withNext } from '../../lib/auth-redirect'
import { formatGroupedNumber } from '../../lib/datetime'
import type { PublicCampaign } from '../../types/app'
import { CampaignProgressBar, campaignProgressPercent } from '../participations/CampaignCard'
import { LandingShell } from './LandingShell'

export function PublicCampaignPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['public', 'participation-campaigns', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<PublicCampaign>(`/participation-campaigns/public/${id}`)
      return data
    },
  })

  const item = query.data
  const n = (value: number) => formatGroupedNumber(value, locale)
  const money = (value: number) => `${n(value)} ${t('participations.toman')}`
  const next = id ? `/participations/${id}` : '/participations'

  return (
    <LandingShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
        <Link
          to="/participations/campaigns"
          className="inline-flex items-center gap-2 rounded-2xl text-sm font-medium text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t('common.back')}
        </Link>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? (
          <FormEmptyHint>{t('landing.participations.notFound')}</FormEmptyHint>
        ) : null}
        {item ? (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_12px_32px_rgba(20,40,40,0.06)]">
            <div className="relative h-52 bg-gradient-to-e from-teal-500 via-mint-500 to-teal-400 sm:h-60">
              {item.imageId ? (
                <img src={getImageUrl(item.imageId)} alt="" className="size-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_42%)]" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-900/55 to-transparent" />
              <h1 className="absolute inset-x-5 bottom-4 text-2xl font-semibold text-white drop-shadow sm:text-3xl">
                {item.name}
              </h1>
            </div>
            <div className="space-y-6 p-5 sm:p-8">
              <p className="inline-flex flex-wrap items-center gap-2 text-sm text-ink-500">
                <CalendarRange className="size-4 text-teal-600" aria-hidden />
                <DateText value={item.startDate} />
                <span aria-hidden>—</span>
                <DateText value={item.endDate} />
              </p>
              {item.description ? (
                <p className="whitespace-pre-wrap text-sm leading-8 text-ink-700">{item.description}</p>
              ) : null}

              <CampaignProgressBar
                percent={campaignProgressPercent(item.purchasedShares, item.totalShares, item.progressPercent)}
                label={t('participations.progress')}
                value={`${n(item.progressPercent)}٪`}
              />

              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={Coins}
                  label={t('participations.totalAmount')}
                  value={money(item.totalAmount)}
                  tone="teal"
                />
                <FormFactTile
                  icon={Coins}
                  label={t('participations.sharePrice')}
                  value={money(item.sharePrice)}
                  tone="mint"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                <FormFactTile
                  icon={Users}
                  label={t('participations.participants')}
                  value={n(item.participantCount)}
                  tone="ink"
                />
                <FormFactTile
                  icon={HeartHandshake}
                  label={t('participations.purchasedShares')}
                  value={n(item.purchasedShares)}
                  tone="teal"
                />
                <FormFactTile
                  icon={WalletCards}
                  label={t('participations.collectedAmount')}
                  value={money(item.purchasedShares * item.sharePrice)}
                  tone="mint"
                />
              </div>

              <section className="space-y-5 rounded-3xl border border-teal-100 bg-gradient-to-b from-teal-50/80 to-white p-5 sm:p-6">
                <h2 className="text-base font-semibold text-ink-900">
                  {t('landing.participations.payDirect')}
                </h2>
                {item.bankAccount ? (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-ink-600">
                      {t('landing.participations.bankSection')}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      <FormFactTile
                        icon={Landmark}
                        label={t('bankAccounts.bankName')}
                        value={item.bankAccount.bankName}
                        tone="teal"
                      />
                      <FormFactTile
                        icon={Hash}
                        label={t('bankAccounts.accountNumber')}
                        copyValue={item.bankAccount.accountNumber}
                        tone="mint"
                      />
                      <FormFactTile
                        icon={CreditCard}
                        label={t('bankAccounts.cardNumber')}
                        copyValue={item.bankAccount.cardNumber}
                        tone="ink"
                      />
                      <FormFactTile
                        icon={WalletCards}
                        label={t('bankAccounts.iban')}
                        copyValue={item.bankAccount.iban}
                        tone="teal"
                      />
                    </div>
                  </div>
                ) : null}
                {item.cryptoWallet ? (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-ink-600">
                      {t('landing.participations.cryptoSection')}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      <FormFactTile
                        icon={Wallet}
                        label={t('cryptoWallets.label')}
                        value={`${item.cryptoWallet.label} (${t(`cryptoCurrencies.${item.cryptoWallet.currency}`, { defaultValue: item.cryptoWallet.currency })})`}
                        tone="mint"
                      />
                      <FormFactTile
                        icon={Wallet}
                        label={t('cryptoWallets.address')}
                        copyValue={item.cryptoWallet.address}
                        tone="teal"
                      />
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-3xl border border-line bg-cream-50/70 p-5 sm:p-6">
                <h2 className="text-center text-base font-semibold text-ink-900">
                  {t('landing.participations.joinSystem')}
                </h2>
                <p className="mt-2 text-center text-sm leading-7 text-ink-600">
                  {t('landing.participations.joinSystemHint')}
                </p>
                {user ? (
                  <div className="mt-4 flex justify-center">
                    <Link
                      to="/"
                      className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                    >
                      <LogIn className="size-4" aria-hidden />
                      {t('landing.goToPanel')}
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Link
                      to={withNext('/register', next)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-mint-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-mint-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                    >
                      <UserPlus className="size-4" aria-hidden />
                      {t('landing.participations.joinRegister')}
                    </Link>
                    <Link
                      to={withNext('/login', next)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                    >
                      <LogIn className="size-4" aria-hidden />
                      {t('landing.participations.joinLogin')}
                    </Link>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : null}
      </article>
    </LandingShell>
  )
}
