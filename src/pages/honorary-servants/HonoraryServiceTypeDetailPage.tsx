import { AlignLeft, HeartHandshake, Type } from 'lucide-react'
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
import type { HonoraryServiceType } from '../../types/app'

export function HonoraryServiceTypeDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['honorary-service-type', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HonoraryServiceType>(`/honorary-service-types/${id}`)
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
        title={t('honoraryServiceTypes.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={HeartHandshake} />}
      />
      <FormCard icon={HeartHandshake} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-1 sm:gap-3">
            <FormFactTile
              icon={Type}
              label={t('honoraryServiceTypes.name')}
              value={item.name}
              tone="teal"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('honoraryServiceTypes.description')}
              value={item.description}
              tone="mint"
            />
          </div>
          <DetailActions
            editTo={`/honorary-service-types/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('honoraryServiceTypes.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('honoraryServiceTypes.confirmDelete'),
                successMessage: t('honoraryServiceTypes.deleted'),
                path: `/honorary-service-types/${item.id}`,
                queryKey: ['honorary-service-types'],
                onDeleted: () => navigate('/honorary-service-types'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
