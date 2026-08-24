import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ManagedUser, RoleOption } from '../../types/app'
import { AccommodationAssignmentsCard } from '../accommodation-managers/AccommodationAssignmentsCard'
import { UserForm } from './UserForm'
import type { RoleUserScope } from './user-scopes'

export function RoleUserEditPage({ scope }: { scope: RoleUserScope }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const keys = scope.i18nPrefix
  const userQuery = useQuery({
    queryKey: [scope.queryKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`${scope.apiBase}/${id}`)
      return data
    },
  })
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get<RoleOption[]>('/roles')
      return data
    },
  })

  if (!userQuery.data || !roles.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t(`${keys}.edit`)} subtitle={t(`${keys}.editSubtitle`)} />
      <UserForm
        initial={userQuery.data}
        roles={roles.data}
        lockedRoleCodes={scope.lockedRoleCodes}
        hideRoles={scope.hideRoles}
        requirePassword={false}
        identityCheckPath={`${scope.apiBase}/identity-check`}
        i18nPrefix={keys}
        extraTabs={
          scope.showAccommodations
            ? [
                {
                  id: 'assignAccommodations',
                  labelKey: 'users.tabs.assignAccommodations',
                  content: (
                    <AccommodationAssignmentsCard
                      user={userQuery.data}
                      queryKey={scope.queryKey}
                      apiBase={scope.apiBase}
                    />
                  ),
                },
              ]
            : undefined
        }
        onSubmit={async (payload) => {
          await api.patch(`${scope.apiBase}/${id}`, payload)
          toast.success(t(`${keys}.updated`))
          navigate(`${scope.listPath}/${id}`)
        }}
      />
    </div>
  )
}
