import { Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { NavModuleCatalog } from '../../types/app'
import { RoleAccessForm } from './RoleAccessForm'

export function RoleAccessCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const catalog = useQuery({
    queryKey: ['roles', 'menu-catalog'],
    queryFn: async () => {
      const { data } = await api.get<NavModuleCatalog[]>('/roles-catalog')
      return data
    },
  })

  if (!catalog.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Shield}
        title={t('roleAccess.create')}
        subtitle={t('roleAccess.createSubtitle')}
      />
      <RoleAccessForm
        modules={catalog.data}
        onSubmit={async (payload) => {
          await api.post('/roles', {
            code: payload.code,
            name: payload.name,
            menuIds: payload.menuIds,
          })
          toast.success(t('roleAccess.created'))
          navigate('/system-management/roles')
        }}
      />
    </div>
  )
}
