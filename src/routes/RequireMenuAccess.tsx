import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function hasMenuAccess(path: string, modules: { menus: { path: string }[] }[]) {
  return modules.some((mod) =>
    mod.menus.some(
      (item) =>
        path === item.path || (item.path !== '/' && path.startsWith(`${item.path}/`)),
    ),
  )
}

export function RequireMenuAccess({ path }: { path: string }) {
  const { user } = useAuth()

  if (!user || !hasMenuAccess(path, user.modules)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
