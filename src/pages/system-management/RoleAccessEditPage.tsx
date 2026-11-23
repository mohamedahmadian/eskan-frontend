import { Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { roleLabel } from '../../lib/roles'
import type { NavModuleCatalog, RoleAccess } from '../../types/app'
import { RoleAccessForm } from './RoleAccessForm'

export function RoleAccessEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const item = useQuery({
    queryKey: ['role', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RoleAccess>(`/roles/${id}`)
      return data
    },
  })
  const catalog = useQuery({
    queryKey: ['roles', 'menu-catalog'],
    queryFn: async () => {
      const { data } = await api.get<NavModuleCatalog[]>('/roles-catalog')
      return data
    },
  })

  if (!item.data || !catalog.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Shield}
        title={t('roleAccess.edit')}
        subtitle={<EntityNameSubtitle name={roleLabel(item.data, t)} icon={Shield} />}
      />
      <RoleAccessForm
        initial={item.data}
        modules={catalog.data}
        onSubmit={async (payload) => {
          await api.patch(`/roles/${id}`, {
            menuIds: payload.menuIds,
            ...(payload.name ? { name: payload.name } : {}),
          })
          toast.success(t('roleAccess.updated'))
          await refresh()
          navigate(`/system-management/roles/${id}`)
        }}
      />
    </div>
  )
}
