import { Coins, Network, Tag, ToggleRight, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { CryptoWallet } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function CryptoWalletDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['crypto-wallet', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<CryptoWallet>(`/crypto-wallets/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('cryptoWallets.details')}
        subtitle={<EntityNameSubtitle name={item.label} icon={Wallet} />}
      />
      <FormCard icon={Wallet} title={item.label}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={Tag} label={t('cryptoWallets.label')} value={item.label} tone="teal" />
            <FormFactTile
              icon={Coins}
              label={t('cryptoWallets.currency')}
              value={t(`cryptoCurrencies.${item.currency}`, { defaultValue: item.currency })}
              tone="mint"
            />
            <FormFactTile icon={Network} label={t('cryptoWallets.network')} value={item.network || '—'} tone="ink" />
            <FormFactTile
              icon={Wallet}
              label={t('cryptoWallets.address')}
              copyValue={item.address}
              value={item.address}
              tone="teal"
            />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="mint"
            />
          </div>
          <DetailActions
            editTo={`/participations/crypto-wallets/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('cryptoWallets.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('cryptoWallets.confirmDelete'),
                successMessage: t('cryptoWallets.deleted'),
                path: `/crypto-wallets/${item.id}`,
                queryKey: ['crypto-wallets'],
                onDeleted: () => navigate('/participations/crypto-wallets'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
