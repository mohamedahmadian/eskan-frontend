import { useTranslation } from 'react-i18next'
import type { ReceptionKind, ReceptionMatch } from '../../types/app'

const kindClass: Record<ReceptionKind, string> = {
  pilgrim: 'bg-teal-50 text-teal-800 ring-teal-100',
  caravanManager: 'bg-mint-50 text-mint-800 ring-mint-100',
  accommodationManager: 'bg-cream-100 text-ink-700 ring-line',
}

const kindKey: Record<ReceptionKind, string> = {
  pilgrim: 'reception.kindPilgrim',
  caravanManager: 'reception.kindCaravanManager',
  accommodationManager: 'reception.kindAccommodationManager',
}

const roleClass: Record<string, string> = {
  ADMIN: 'bg-teal-50 text-teal-800 ring-teal-100',
  PILGRIM: 'bg-teal-50 text-teal-800 ring-teal-100',
  CARAVAN_MANAGER: 'bg-mint-50 text-mint-800 ring-mint-100',
  GROUP_MANAGER: 'bg-mint-50 text-mint-800 ring-mint-100',
  ACCOMMODATION_MANAGER: 'bg-cream-100 text-ink-700 ring-line',
  HEADQUARTERS_REPRESENTATIVE: 'bg-teal-50 text-teal-800 ring-teal-100',
  LICENSE_ISSUER: 'bg-mint-50 text-mint-800 ring-mint-100',
  UNIT_MANAGER: 'bg-cream-100 text-ink-700 ring-line',
}

const chipClass =
  'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1'
const fallbackClass = 'bg-cream-100 text-ink-500 ring-line'

export function ReceptionKindChips({ kinds }: { kinds: ReceptionKind[] }) {
  const { t } = useTranslation()
  if (!kinds.length) {
    return (
      <span className={`${chipClass} ${fallbackClass}`}>{t('reception.kindOther')}</span>
    )
  }
  return (
    <span className="flex flex-wrap gap-1">
      {kinds.map((kind) => (
        <span key={kind} className={`${chipClass} ${kindClass[kind]}`}>
          {t(kindKey[kind])}
        </span>
      ))}
    </span>
  )
}

export function ReceptionMatchRoles({
  roles,
  kinds,
}: {
  roles: ReceptionMatch['roles']
  kinds: ReceptionKind[]
}) {
  const { t } = useTranslation()
  if (roles.length) {
    return (
      <span className="flex max-w-[9.5rem] flex-col items-end gap-1">
        {roles.map((role) => (
          <span
            key={role.code}
            className={`${chipClass} ${roleClass[role.code] ?? fallbackClass}`}
          >
            {t(role.nameKey)}
          </span>
        ))}
      </span>
    )
  }
  if (kinds.length) {
    return (
      <span className="flex max-w-[9.5rem] flex-col items-end gap-1">
        {kinds.map((kind) => (
          <span key={kind} className={`${chipClass} ${kindClass[kind]}`}>
            {t(kindKey[kind])}
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className="flex justify-end">
      <span className={`${chipClass} ${fallbackClass}`}>{t('reception.kindOther')}</span>
    </span>
  )
}
