import {
  CalendarRange,
  HeartPulse,
  Hospital,
  Pill,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { PageHeader, listShellClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'

const sections: Record<string, { icon: LucideIcon; titleKey: string }> = {
  '/healthcare/bases': { icon: Hospital, titleKey: 'menus.treatmentBases' },
  '/healthcare/servants': { icon: Stethoscope, titleKey: 'menus.healthServants' },
  '/healthcare/services': { icon: HeartPulse, titleKey: 'menus.medicalServices' },
  '/healthcare/visits': { icon: CalendarRange, titleKey: 'menus.visitManagement' },
  '/healthcare/warehouse': { icon: Pill, titleKey: 'menus.pharmacyWarehouse' },
}

export function HealthcareSectionPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const section = sections[pathname] ?? sections['/healthcare/bases']
  const Icon = section.icon

  return (
    <div className={listShellClassName}>
      <PageHeader icon={Icon} title={t(section.titleKey)} subtitle={t('healthcare.subtitle')} />
      <FormEmptyHint>{t('healthcare.empty')}</FormEmptyHint>
    </div>
  )
}
