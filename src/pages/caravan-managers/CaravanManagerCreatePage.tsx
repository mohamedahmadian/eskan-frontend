import { RoleUserCreatePage } from '../users/RoleUserCreatePage'
import { userScopes } from '../users/user-scopes'

export function CaravanManagerCreatePage() {
  return <RoleUserCreatePage scope={userScopes.caravanManager} />
}
