import { Megaphone } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { BankAccount, CryptoWallet, ParticipationCampaign } from '../../types/app'
import { CampaignForm } from './CampaignForm'

export function CampaignEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['participation-campaign', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign>(`/participation-campaigns/${id}`)
      return data
    },
  })
  const banks = useQuery({
    queryKey: ['bank-accounts', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<BankAccount[]>('/bank-accounts')
      return data
    },
  })
  const wallets = useQuery({
    queryKey: ['crypto-wallets', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<CryptoWallet[]>('/crypto-wallets')
      return data
    },
  })

  if (!item.data || !banks.data || !wallets.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('participationCampaigns.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Megaphone} />}
      />
      <CampaignForm
        initial={item.data}
        bankAccounts={banks.data}
        cryptoWallets={wallets.data}
        onSubmit={async (payload) => {
          await api.patch(`/participation-campaigns/${id}`, payload)
          toast.success(t('participationCampaigns.updated'))
          navigate(`/participations/campaigns/${id}`)
        }}
      />
    </div>
  )
}
