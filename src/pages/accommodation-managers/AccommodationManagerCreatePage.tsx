import { RoleUserCreatePage } from '../users/RoleUserCreatePage'
import { userScopes } from '../users/user-scopes'

export function AccommodationManagerCreatePage() {
  return <RoleUserCreatePage scope={userScopes.accommodationManager} />
}
