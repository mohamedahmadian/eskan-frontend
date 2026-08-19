import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-ink-500">
        {t('common.loading')}
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
