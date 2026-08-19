import { RoleUsersListPage } from './RoleUsersListPage'
import { userScopes } from './user-scopes'

export function UsersListPage() {
  return <RoleUsersListPage scope={userScopes.all} />
}
