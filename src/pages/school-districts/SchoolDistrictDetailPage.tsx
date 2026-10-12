import { AlignLeft, School, Type } from 'lucide-react'
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
import type { SchoolDistrict } from '../../types/app'

export function SchoolDistrictDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['school-district', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SchoolDistrict>(`/school-districts/${id}`)
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
        icon={School}
        title={t('schoolDistricts.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={School} />}
      />
      <FormCard icon={School} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Type}
              label={t('schoolDistricts.name')}
              value={item.name}
              tone="teal"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('schoolDistricts.description')}
              value={item.description?.trim() || '—'}
              empty={!item.description?.trim()}
              tone="mint"
              className="sm:col-span-2"
            />
          </div>
          <DetailActions
            editTo={`/accommodation-base-info/schools/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('schoolDistricts.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('schoolDistricts.confirmDelete'),
                successMessage: t('schoolDistricts.deleted'),
                path: `/school-districts/${item.id}`,
                queryKey: ['school-districts'],
                onDeleted: () => navigate('/accommodation-base-info'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
