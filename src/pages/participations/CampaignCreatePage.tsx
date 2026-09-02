import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { BankAccount, CryptoWallet } from '../../types/app'
import { CampaignForm } from './CampaignForm'

export function CampaignCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  if (!banks.data || !wallets.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('participationCampaigns.create')}
        subtitle={t('participationCampaigns.createSubtitle')}
      />
      <CampaignForm
        bankAccounts={banks.data}
        cryptoWallets={wallets.data}
        onSubmit={async (payload) => {
          await api.post('/participation-campaigns', payload)
          toast.success(t('participationCampaigns.created'))
          navigate('/participations/campaigns')
        }}
      />
    </div>
  )
}
