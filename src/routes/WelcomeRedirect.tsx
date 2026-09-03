import { Navigate, useLocation } from 'react-router-dom'

export function WelcomeRedirect() {
  const { pathname, search, hash } = useLocation()
  const nextPath = pathname.replace(/^\/welcome\/?/, '/') || '/'
  return <Navigate to={`${nextPath}${search}${hash}`} replace />
}
