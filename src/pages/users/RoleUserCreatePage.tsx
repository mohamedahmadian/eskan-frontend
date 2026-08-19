import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { RoleOption } from '../../types/app'
import { UserForm } from './UserForm'
import type { RoleUserScope } from './user-scopes'

export function RoleUserCreatePage({ scope }: { scope: RoleUserScope }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const keys = scope.i18nPrefix
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get<RoleOption[]>('/roles')
      return data
    },
  })

  if (!roles.data) {
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  const lockedIds = roles.data
    .filter((role) => scope.lockedRoleCodes.includes(role.code))
    .map((role) => role.id)

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t(`${keys}.create`)} subtitle={t(`${keys}.createSubtitle`)} />
      <UserForm
        initial={lockedIds.length ? { locale: 'fa', roleIds: lockedIds } : undefined}
        roles={roles.data}
        lockedRoleCodes={scope.lockedRoleCodes}
        requirePassword
        onSubmit={async (payload) => {
          await api.post(scope.apiBase, payload)
          toast.success(t(`${keys}.created`))
          navigate(scope.listPath)
        }}
      />
    </div>
  )
}
