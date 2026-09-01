import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { HonoraryServant } from '../../types/app'
import { HonoraryServantForm } from './HonoraryServantForm'

export function HonoraryApplyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { refresh } = useAuth()

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('honoraryServants.create')}
        subtitle={t('honoraryServants.applySubtitle')}
        backTo="/honorary-history"
      />
      <HonoraryServantForm
        self
        onSubmit={async (payload) => {
          const { userId: _userId, ...body } = payload
          const { data } = await api.post<HonoraryServant>('/honorary-servants/mine', body)
          await refresh()
          toast.success(t('honoraryServants.created'))
          navigate(`/honorary-history/${data.id}`)
        }}
      />
    </div>
  )
}
