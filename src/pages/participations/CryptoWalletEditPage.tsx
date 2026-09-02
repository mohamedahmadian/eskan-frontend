import { Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { CryptoWallet } from '../../types/app'
import { CryptoWalletForm } from './CryptoWalletForm'

export function CryptoWalletEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['crypto-wallet', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<CryptoWallet>(`/crypto-wallets/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('cryptoWallets.edit')}
        subtitle={<EntityNameSubtitle name={item.data.label} icon={Wallet} />}
      />
      <CryptoWalletForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/crypto-wallets/${id}`, payload)
          toast.success(t('cryptoWallets.updated'))
          navigate(`/participations/crypto-wallets/${id}`)
        }}
      />
    </div>
  )
}
