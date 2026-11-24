import { UserRound } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import { OpenUserPanelButton } from '../../components/auth/OpenUserPanelButton'
import { api } from '../../lib/api'
import { isAccommodationManager, isAdmin, isCaravanManager, unwrapRoleList } from '../../lib/roles'
import type { ManagedUser } from '../../types/app'
import { AccommodationAssignmentsCard } from '../accommodation-managers/AccommodationAssignmentsCard'
import { RoleUserCaravansTab } from './RoleUserCaravansTab'
import { RoleUserQuickActions } from './RoleUserQuickActions'
import { UserForm, type UserFormExtraTab } from './UserForm'
import { hasLostLockedRole, type RoleUserScope } from './user-scopes'

export function RoleUserEditPage({ scope }: { scope: RoleUserScope }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: actor } = useAuth()
  const keys = scope.i18nPrefix
  const canAssignRoles = isAdmin(actor)
  const [leftAfterRevoke, setLeftAfterRevoke] = useState(false)
  const userQuery = useQuery({
    queryKey: [scope.queryKey, id],
    enabled: Boolean(id) && !leftAfterRevoke,
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`${scope.apiBase}/${id}`)
      return data
    },
  })
  const roles = useQuery({
    queryKey: ['roles', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get('/roles')
      return unwrapRoleList(data)
    },
  })

  if (!userQuery.data || !roles.data) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        icon={UserRound}
        title={t(`${keys}.edit`)}
        subtitle={<EntityNameSubtitle name={userQuery.data.fullName} icon={UserRound} />}
      />
      <UserForm
        initial={userQuery.data}
        roles={roles.data}
        lockedRoleCodes={scope.lockedRoleCodes}
        allowRevokeLockedRole={scope.allowRevokeLockedRole}
        hideRoles={scope.hideRoles && !canAssignRoles}
        requirePassword={false}
        identityCheckPath={`${scope.apiBase}/identity-check`}
        i18nPrefix={keys}
        onRolesChanged={(nextRoles) => {
          if (!scope.allowRevokeLockedRole || !id) return
          if (!hasLostLockedRole(scope.lockedRoleCodes, nextRoles)) return
          setLeftAfterRevoke(true)
          void queryClient.cancelQueries({ queryKey: [scope.queryKey, id] })
          void queryClient.invalidateQueries({
            queryKey: [scope.queryKey],
            predicate: (query) => query.queryKey[1] !== id,
          })
          navigate(scope.listPath, { replace: true })
        }}
        extraTabs={editExtraTabs(scope, userQuery.data)}
        headerAction={
          <OpenUserPanelButton
            userId={userQuery.data.id}
            status={userQuery.data.status}
          />
        }
        footerActions={
          scope.showPilgrimCard ? undefined : (
            <RoleUserQuickActions
              user={userQuery.data}
              showManagerCard={
                isCaravanManager(userQuery.data) || isAccommodationManager(userQuery.data)
              }
            />
          )
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

function editExtraTabs(scope: RoleUserScope, user: ManagedUser): UserFormExtraTab[] | undefined {
  const extraTabs: UserFormExtraTab[] = []
  if (scope.showCaravans) {
    extraTabs.push({
      id: 'caravans',
      labelKey: 'users.tabs.caravans',
      after: 'personal',
      content: <RoleUserCaravansTab user={user} />,
    })
  }
  if (scope.showAccommodations) {
    extraTabs.push({
      id: 'assignAccommodations',
      labelKey: 'users.tabs.assignAccommodations',
      content: (
        <AccommodationAssignmentsCard
          user={user}
          queryKey={scope.queryKey}
          apiBase={scope.apiBase}
        />
      ),
    })
  }
  return extraTabs.length ? extraTabs : undefined
}
