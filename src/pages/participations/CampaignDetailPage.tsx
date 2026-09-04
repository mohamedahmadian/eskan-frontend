import {
  CalendarRange,
  Coins,
  CreditCard,
  HandCoins,
  Hash,
  Landmark,
  Megaphone,
  ToggleRight,
  Users,
  Wallet,
  WalletCards,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { FormCard, FormEmptyHint, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getImageUrl } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import type { ParticipationCampaign, PublicCampaign } from '../../types/app'
import { CampaignProgressBar, campaignProgressPercent } from './CampaignCard'
import { GeoStatus } from '../geo/GeoShared'

export function CampaignDetailPage() {
  const { user } = useAuth()
  if (!isAdmin(user)) {
    return <PilgrimCampaignDetail />
  }
  return <AdminCampaignDetail />
}

function PilgrimCampaignDetail() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
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

  if (query.isLoading) {
    return <LoadingState />
  }

  if (!item) {
    return (
      <div className={formShellClassName}>
        <PageHeader title={t('participationCampaigns.details')} />
        <FormEmptyHint>{t('landing.participations.notFound')}</FormEmptyHint>
      </div>
    )
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('participationCampaigns.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Megaphone} />}
      />
      <FormCard icon={Megaphone} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          {item.imageId ? (
            <img
              src={getImageUrl(item.imageId)}
              alt=""
              className="h-52 w-full rounded-2xl object-cover"
            />
          ) : null}
          {item.description ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-ink-700">{item.description}</p>
          ) : null}
          <FormSectionTitle icon={Coins}>{t('participations.progress')}</FormSectionTitle>
          <CampaignProgressBar
            percent={campaignProgressPercent(item.purchasedShares, item.totalShares, item.progressPercent)}
            label={t('participations.purchasedShares')}
            value={`${n(item.purchasedShares)} / ${n(item.totalShares)}`}
          />
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={CalendarRange}
              label={t('participationCampaigns.startDate')}
              value={<DateText value={item.startDate} />}
              tone="teal"
            />
            <FormFactTile
              icon={CalendarRange}
              label={t('participationCampaigns.endDate')}
              value={<DateText value={item.endDate} />}
              tone="mint"
            />
            <FormFactTile
              icon={Coins}
              label={t('participations.totalAmount')}
              value={money(item.totalAmount)}
              tone="ink"
            />
            <FormFactTile
              icon={Coins}
              label={t('participations.sharePrice')}
              value={money(item.sharePrice)}
              tone="teal"
            />
            <FormFactTile
              icon={Users}
              label={t('participations.participants')}
              value={n(item.participantCount)}
              tone="mint"
            />
            <FormFactTile
              icon={WalletCards}
              label={t('participations.collectedAmount')}
              value={money(item.purchasedShares * item.sharePrice)}
              tone="ink"
            />
          </div>
          {item.bankAccount || item.cryptoWallet ? (
            <>
              <FormSectionTitle icon={Landmark}>
                {t('landing.participations.payDirect')}
              </FormSectionTitle>
              {item.bankAccount ? (
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
              ) : null}
              {item.cryptoWallet ? (
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
              ) : null}
            </>
          ) : null}
        </div>
      </FormCard>
    </div>
  )
}

function AdminCampaignDetail() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['participation-campaign', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign>(`/participation-campaigns/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const n = (value: number) => formatGroupedNumber(value, locale)
  const money = (value: number) => `${n(value)} ${t('participations.toman')}`

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('participationCampaigns.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Megaphone} />}
      />
      <FormCard icon={Megaphone} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          {item.imageId ? (
            <img
              src={getImageUrl(item.imageId)}
              alt=""
              className="h-52 w-full rounded-2xl object-cover"
            />
          ) : null}
          {item.description ? (
            <p className="text-sm leading-7 text-ink-700">{item.description}</p>
          ) : null}
          <FormSectionTitle icon={Coins}>{t('participations.progress')}</FormSectionTitle>
          <CampaignProgressBar
            percent={campaignProgressPercent(item.purchasedShares, item.totalShares, item.progressPercent)}
            label={t('participations.purchasedShares')}
            value={`${n(item.purchasedShares)} / ${n(item.totalShares)}`}
          />
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={CalendarRange}
              label={t('participationCampaigns.startDate')}
              value={<DateText value={item.startDate} />}
              tone="teal"
            />
            <FormFactTile
              icon={CalendarRange}
              label={t('participationCampaigns.endDate')}
              value={<DateText value={item.endDate} />}
              tone="mint"
            />
            <FormFactTile
              icon={Coins}
              label={t('participations.totalAmount')}
              value={money(item.totalAmount)}
              tone="ink"
            />
            <FormFactTile
              icon={Coins}
              label={t('participations.sharePrice')}
              value={money(item.sharePrice)}
              tone="teal"
            />
            <FormFactTile
              icon={Users}
              label={t('participations.participants')}
              value={n(item.participantCount)}
              tone="mint"
            />
            <FormFactTile
              icon={Coins}
              label={t('participations.remainingShares')}
              value={n(item.remainingShares)}
              tone="ink"
            />
            <FormFactTile
              icon={WalletCards}
              label={t('participations.purchasedShares')}
              value={n(item.purchasedShares)}
              tone="teal"
            />
            <FormFactTile
              icon={Hash}
              label={t('participations.totalShares')}
              value={n(item.totalShares)}
              tone="mint"
            />
            <FormFactTile
              icon={Landmark}
              label={t('participationCampaigns.bankAccount')}
              value={
                item.bankAccount
                  ? `${item.bankAccount.bankName} — ${item.bankAccount.accountNumber}`
                  : t('participationCampaigns.none')
              }
              tone="teal"
            />
            <FormFactTile
              icon={Wallet}
              label={t('participationCampaigns.cryptoWallet')}
              value={
                item.cryptoWallet
                  ? `${item.cryptoWallet.label} (${item.cryptoWallet.currency})`
                  : t('participationCampaigns.none')
              }
              tone="mint"
            />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="ink"
            />
          </div>
          <DetailActions
            editTo={`/participations/campaigns/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('participationCampaigns.delete')}
            extra={
              <>
                <Link to={`/participations/campaigns/${item.id}/participants`}>
                  <Button type="button" variant="soft">
                    <Users className="size-4" aria-hidden />
                    {t('participationCampaigns.manageParticipants')}
                  </Button>
                </Link>
                <Link to={`/participations/campaigns/${item.id}/participants/new`}>
                  <Button type="button" variant="soft">
                    <HandCoins className="size-4" aria-hidden />
                    {t('campaignParticipants.create')}
                  </Button>
                </Link>
              </>
            }
            onDelete={() =>
              confirmDelete({
                message: t('participationCampaigns.confirmDelete'),
                successMessage: t('participationCampaigns.deleted'),
                path: `/participation-campaigns/${item.id}`,
                queryKey: ['participation-campaigns'],
                onDeleted: () => navigate('/participations/campaigns'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
