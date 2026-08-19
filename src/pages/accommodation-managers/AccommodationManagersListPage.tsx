import { RoleUsersListPage } from '../users/RoleUsersListPage'
import { userScopes } from '../users/user-scopes'

export function AccommodationManagersListPage() {
  return <RoleUsersListPage scope={userScopes.accommodationManager} />
}
