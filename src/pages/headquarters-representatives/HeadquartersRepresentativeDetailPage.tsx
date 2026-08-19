import { RoleUserDetailPage } from '../users/RoleUserDetailPage'
import { userScopes } from '../users/user-scopes'

export function HeadquartersRepresentativeDetailPage() {
  return <RoleUserDetailPage scope={userScopes.headquartersRepresentative} />
}
