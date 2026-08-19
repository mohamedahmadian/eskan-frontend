import { RoleUsersListPage } from '../users/RoleUsersListPage'
import { userScopes } from '../users/user-scopes'

export function CaravanManagersListPage() {
  return <RoleUsersListPage scope={userScopes.caravanManager} />
}
