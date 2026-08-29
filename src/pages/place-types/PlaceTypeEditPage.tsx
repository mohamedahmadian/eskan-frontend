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
import type { PlaceType } from '../../types/app'
import { PlaceTypeForm } from './PlaceTypeForm'

export function PlaceTypeEditPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['place-type', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<PlaceType>(`/place-types/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('placeTypes.edit')}
        subtitle={<EntityNameSubtitle name={name(query.data)} icon={Tags} />}
      />
      <PlaceTypeForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/place-types/${id}`, payload)
          toast.success(t('placeTypes.updated'))
          navigate(`/base-info/places/types/${id}`)
        }}
      />
    </div>
  )
}
