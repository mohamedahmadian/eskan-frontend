import { RoleUserEditPage } from '../users/RoleUserEditPage'
import { userScopes } from '../users/user-scopes'

export function AccommodationManagerEditPage() {
  return <RoleUserEditPage scope={userScopes.accommodationManager} />
}
