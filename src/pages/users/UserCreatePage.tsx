import { RoleUserCreatePage } from './RoleUserCreatePage'
import { userScopes } from './user-scopes'

export function UserCreatePage() {
  return <RoleUserCreatePage scope={userScopes.all} />
}
