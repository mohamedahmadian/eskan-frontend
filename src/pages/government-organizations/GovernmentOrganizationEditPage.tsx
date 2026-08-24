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
import type { GovernmentOrganization } from '../../types/app'
import { GovernmentOrganizationForm } from './GovernmentOrganizationForm'

export function GovernmentOrganizationEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useQuery({
    queryKey: ['government-organization', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<GovernmentOrganization>(
        `/government-organizations/${id}`,
      )
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('governmentOrganizations.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Building} />}
      />
      <GovernmentOrganizationForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/government-organizations/${id}`, payload)
          toast.success(t('governmentOrganizations.updated'))
          navigate(`/base-info/government-organizations/${id}`)
        }}
      />
    </div>
  )
}
