import { Building } from 'lucide-react'
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
import type { OrgUnit } from '../../types/app'
import { OrgUnitForm } from './OrgUnitForm'

export function OrgUnitEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['org-unit', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<OrgUnit>(`/org-units/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('orgUnits.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Building} />}
      />
      <OrgUnitForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/org-units/${id}`, payload)
          toast.success(t('orgUnits.updated'))
          navigate(`/headquarters/units/${id}`)
        }}
      />
    </div>
  )
}
