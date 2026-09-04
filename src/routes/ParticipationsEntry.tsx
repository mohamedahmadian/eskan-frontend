import { useAuth } from '../auth/AuthProvider'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { LoadingState } from '../components/ui/LoadingState'
import { PublicParticipationsPage } from '../pages/landing/PublicParticipationsPage'
import { ParticipationsHomePage } from '../pages/participations/ParticipationsHomePage'

function hasParticipationsHomeMenu(
  modules: { menus: { path: string }[] }[] | undefined,
) {
  return Boolean(
    modules?.some((mod) =>
      mod.menus.some((item) => item.path === '/participations'),
    ),
  )
}

export function ParticipationsEntry() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState variant="fullscreen" />
  }

  if (hasParticipationsHomeMenu(user?.modules)) {
    return (
      <DashboardLayout>
        <ParticipationsHomePage />
      </DashboardLayout>
    )
  }

  return <PublicParticipationsPage />
}
