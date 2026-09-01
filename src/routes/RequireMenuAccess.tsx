import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import {
  canAccessMyAccommodations,
  canAccessMyCaravans,
  canAccessMyEvaluations,
  canAccessMyGroups,
  canAccessMyReservations,
} from '../lib/roles'

export function hasMenuAccess(path: string, modules: { menus: { path: string }[] }[]) {
  return modules.some((mod) =>
    mod.menus.some(
      (item) =>
        path === item.path || (item.path !== '/' && path.startsWith(`${item.path}/`)),
    ),
  )
}

export function hasModuleAccess(
  code: string,
  modules: { code?: string }[],
) {
  return modules.some((mod) => mod.code === code)
}

export function RequireMenuAccess({
  path,
  allowModule,
}: {
  path: string
  allowModule?: string
}) {
  const { user } = useAuth()

  const allowed = Boolean(
    user &&
      (hasMenuAccess(path, user.modules) ||
        (allowModule ? hasModuleAccess(allowModule, user.modules) : false)),
  )

  if (!user || !allowed) {
    return <Navigate to="/" replace />
  }

  if (path === '/my-caravans' && !canAccessMyCaravans(user)) {
    return <Navigate to="/" replace />
  }

  if (path === '/my-groups' && !canAccessMyGroups(user)) {
    return <Navigate to="/" replace />
  }

  if (path === '/my-reservations' && !canAccessMyReservations(user)) {
    return <Navigate to="/" replace />
  }

  if (path === '/my-accommodations' && !canAccessMyAccommodations(user)) {
    return <Navigate to="/" replace />
  }

  if (path === '/my-evaluations' && !canAccessMyEvaluations(user)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
