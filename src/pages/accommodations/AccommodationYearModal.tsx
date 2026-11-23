import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppModal } from '../../components/ui/AppModal'
import { FormCard } from '../../components/ui/FormLayout'

export function AccommodationYearModal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  className = 'max-w-lg',
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <AppModal
      onClose={onClose}
      ariaLabel={title}
      className={`flex max-h-[90vh] w-full flex-col ${className}`}
    >
      <FormCard
        icon={icon}
        title={title}
        subtitle={subtitle}
        className="flex min-h-0 flex-1 flex-col [&>header]:shrink-0"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </FormCard>
    </AppModal>
  )
}
