import { RoleUserDetailPage } from '../users/RoleUserDetailPage'
import { userScopes } from '../users/user-scopes'

export function AccommodationManagerDetailPage() {
  return <RoleUserDetailPage scope={userScopes.accommodationManager} />
}
