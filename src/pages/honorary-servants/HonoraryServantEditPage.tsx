import { HandHeart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { HonoraryServant } from '../../types/app'
import { HonoraryServantForm } from './HonoraryServantForm'

export function HonoraryServantEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['honorary-servant', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HonoraryServant>(`/honorary-servants/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('honoraryServants.edit')}
        subtitle={<EntityNameSubtitle name={query.data.user.fullName} icon={HandHeart} />}
      />
      <HonoraryServantForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/honorary-servants/${id}`, payload)
          toast.success(t('honoraryServants.updated'))
          navigate(`/honorary-servants/${id}`)
        }}
      />
    </div>
  )
}
