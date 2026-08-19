import { RoleUserEditPage } from '../users/RoleUserEditPage'
import { userScopes } from '../users/user-scopes'

export function PilgrimEditPage() {
  return <RoleUserEditPage scope={userScopes.pilgrim} />
}
