import { School } from 'lucide-react'
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
import type { SchoolDistrict } from '../../types/app'
import { SchoolDistrictForm } from './SchoolDistrictForm'

export function SchoolDistrictEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['school-district', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SchoolDistrict>(`/school-districts/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={School}
        title={t('schoolDistricts.edit')}
        subtitle={<EntityNameSubtitle name={query.data.name} icon={School} />}
      />
      <SchoolDistrictForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/school-districts/${id}`, payload)
          toast.success(t('schoolDistricts.updated'))
          navigate(`/accommodation-base-info/schools/${id}`)
        }}
      />
    </div>
  )
}
