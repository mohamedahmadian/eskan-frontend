import { Tags } from 'lucide-react'
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
import { useGeoName } from '../../lib/geo'
import type { AccommodationType } from '../../types/app'
import { AccommodationTypeForm } from './AccommodationTypeForm'

export function AccommodationTypeEditPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['accommodation-type', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<AccommodationType>(`/accommodation-types/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Tags}
        title={t('accommodationType.edit')}
        subtitle={<EntityNameSubtitle name={name(query.data)} icon={Tags} />}
      />
      <AccommodationTypeForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/accommodation-types/${id}`, payload)
          toast.success(t('accommodationType.updated'))
          navigate(`/accommodation-types/${id}`)
        }}
      />
    </div>
  )
}
