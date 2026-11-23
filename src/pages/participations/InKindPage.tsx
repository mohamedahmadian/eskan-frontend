import { Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { FormCard } from '../../components/ui/FormLayout'
import { InKindContent } from './InKindContent'

export function InKindPage() {
  const { t } = useTranslation()

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Gift}
        title={t('menus.participationsInKind')}
        subtitle={t('landing.participations.inKindPageHint')}
      />
      <FormCard icon={Gift} title={t('landing.participations.inKindPageTitle')}>
        <div className="space-y-6 p-5 sm:p-6">
          <InKindContent />
        </div>
      </FormCard>
    </div>
  )
}
