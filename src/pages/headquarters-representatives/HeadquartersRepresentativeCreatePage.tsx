import { RoleUserCreatePage } from '../users/RoleUserCreatePage'
import { userScopes } from '../users/user-scopes'

export function HeadquartersRepresentativeCreatePage() {
  return <RoleUserCreatePage scope={userScopes.headquartersRepresentative} />
}
