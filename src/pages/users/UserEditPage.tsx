import { RoleUserEditPage } from './RoleUserEditPage'
import { userScopes } from './user-scopes'

export function UserEditPage() {
  return <RoleUserEditPage scope={userScopes.all} />
}
