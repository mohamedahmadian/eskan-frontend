import {
  CalendarRange,
  Coins,
  Landmark,
  Megaphone,
  ToggleRight,
  Users,
  Wallet,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getImageUrl } from '../../lib/api'
import { formatGroupedNumber } from '../../lib/datetime'
import type { ParticipationCampaign } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function CampaignDetailPage() {
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
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
              <span>{t('participations.purchasedShares')}</span>
              <span className="font-semibold text-teal-700">
                {n(item.purchasedShares)} / {n(item.totalShares)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-cream-100">
              <div
                className="h-full rounded-full bg-gradient-to-e from-teal-500 to-mint-500"
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>
          </div>
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
              <Link to={`/participations/campaigns/${item.id}/participants`}>
                <Button type="button" variant="soft">
                  <Users className="size-4" aria-hidden />
                  {t('participationCampaigns.manageParticipants')}
                </Button>
              </Link>
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
