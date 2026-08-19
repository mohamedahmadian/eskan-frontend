import { RoleUserEditPage } from '../users/RoleUserEditPage'
import { userScopes } from '../users/user-scopes'

export function HeadquartersRepresentativeEditPage() {
  return <RoleUserEditPage scope={userScopes.headquartersRepresentative} />
}
