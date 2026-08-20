import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LoadingState } from '../components/ui/LoadingState'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState variant="fullscreen" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
