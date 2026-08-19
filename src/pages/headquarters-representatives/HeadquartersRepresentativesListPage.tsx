import { RoleUsersListPage } from '../users/RoleUsersListPage'
import { userScopes } from '../users/user-scopes'

export function HeadquartersRepresentativesListPage() {
  return <RoleUsersListPage scope={userScopes.headquartersRepresentative} />
}
