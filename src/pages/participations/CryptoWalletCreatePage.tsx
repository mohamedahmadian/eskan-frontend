import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { CryptoWalletForm } from './CryptoWalletForm'

export function CryptoWalletCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('cryptoWallets.create')} subtitle={t('cryptoWallets.createSubtitle')} />
      <CryptoWalletForm
        onSubmit={async (payload) => {
          await api.post('/crypto-wallets', payload)
          toast.success(t('cryptoWallets.created'))
          navigate('/participations/crypto-wallets')
        }}
      />
    </div>
  )
}
