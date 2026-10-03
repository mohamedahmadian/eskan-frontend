import { Navigate, useParams } from 'react-router-dom'
import { publicProfilePath } from '../lib/public-profile'

/** Printed cards still carry QR codes pointing to the old `/p/:id` path. */
export function LegacyProfileRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? publicProfilePath(id) : '/'} replace />
}
