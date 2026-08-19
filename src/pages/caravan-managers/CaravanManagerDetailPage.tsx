import { RoleUserDetailPage } from '../users/RoleUserDetailPage'
import { userScopes } from '../users/user-scopes'

export function CaravanManagerDetailPage() {
  return <RoleUserDetailPage scope={userScopes.caravanManager} />
}
