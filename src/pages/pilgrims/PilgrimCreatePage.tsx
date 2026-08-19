import { RoleUserCreatePage } from '../users/RoleUserCreatePage'
import { userScopes } from '../users/user-scopes'

export function PilgrimCreatePage() {
  return <RoleUserCreatePage scope={userScopes.pilgrim} />
}
