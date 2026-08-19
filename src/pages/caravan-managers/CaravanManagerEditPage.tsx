import { RoleUserEditPage } from '../users/RoleUserEditPage'
import { userScopes } from '../users/user-scopes'

export function CaravanManagerEditPage() {
  return <RoleUserEditPage scope={userScopes.caravanManager} />
}
