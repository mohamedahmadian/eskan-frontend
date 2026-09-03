import { useAuth } from '../auth/AuthProvider'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { LoadingState } from '../components/ui/LoadingState'
import { LandingPage } from '../pages/LandingPage'
import { OverviewPage } from '../pages/OverviewPage'

export function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState variant="fullscreen" />
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <DashboardLayout>
      <OverviewPage />
    </DashboardLayout>
  )
}
