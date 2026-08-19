import { RoleUserDetailPage } from './RoleUserDetailPage'
import { userScopes } from './user-scopes'

export function UserDetailPage() {
  return <RoleUserDetailPage scope={userScopes.all} />
}
