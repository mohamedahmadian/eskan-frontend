import { RoleUserDetailPage } from '../users/RoleUserDetailPage'
import { userScopes } from '../users/user-scopes'

export function PilgrimDetailPage() {
  return <RoleUserDetailPage scope={userScopes.pilgrim} />
}
