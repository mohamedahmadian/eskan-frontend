import { AccommodationIntroduceWizardPage } from '../accommodations/AccommodationIntroduceWizardPage'
import { LandingShell } from './LandingShell'

export function PublicAccommodationIntroducePage() {
  return (
    <LandingShell>
      <div className="px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <AccommodationIntroduceWizardPage variant="public" />
      </div>
    </LandingShell>
  )
}
