import { HeartHandshake } from 'lucide-react'
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
import type { HonoraryServiceType } from '../../types/app'
import { HonoraryServiceTypeForm } from './HonoraryServiceTypeForm'

export function HonoraryServiceTypeEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['honorary-service-type', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HonoraryServiceType>(`/honorary-service-types/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('honoraryServiceTypes.edit')}
        subtitle={<EntityNameSubtitle name={query.data.name} icon={HeartHandshake} />}
      />
      <HonoraryServiceTypeForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/honorary-service-types/${id}`, payload)
          toast.success(t('honoraryServiceTypes.updated'))
          navigate(`/honorary-service-types/${id}`)
        }}
      />
    </div>
  )
}
