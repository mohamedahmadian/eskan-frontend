import { RoleUsersListPage } from '../users/RoleUsersListPage'
import { userScopes } from '../users/user-scopes'

export function PilgrimsListPage() {
  return <RoleUsersListPage scope={userScopes.pilgrim} />
}
