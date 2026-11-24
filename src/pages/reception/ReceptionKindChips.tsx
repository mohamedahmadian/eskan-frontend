import { useTranslation } from 'react-i18next'
import type { ReceptionKind, ReceptionMatch } from '../../types/app'

const roleClass: Record<string, string> = {
  ADMIN: 'bg-teal-50 text-teal-800 ring-teal-100',
  PILGRIM: 'bg-teal-50 text-teal-800 ring-teal-100',
  CARAVAN_MANAGER: 'bg-mint-50 text-mint-800 ring-mint-100',
  GROUP_MANAGER: 'bg-mint-50 text-mint-800 ring-mint-100',
  ACCOMMODATION_MANAGER: 'bg-cream-100 text-ink-700 ring-line',
  HEADQUARTERS_REPRESENTATIVE: 'bg-teal-50 text-teal-800 ring-teal-100',
  LICENSE_ISSUER: 'bg-mint-50 text-mint-800 ring-mint-100',
  UNIT_MANAGER: 'bg-cream-100 text-ink-700 ring-line',
  GOVERNMENT_ORG_OFFICER: 'bg-cream-100 text-ink-700 ring-line',
  HONORARY_SERVANT: 'bg-mint-50 text-mint-800 ring-mint-100',
  TRANSLATOR: 'bg-teal-50 text-teal-800 ring-teal-100',
  STATION_MANAGER: 'bg-teal-50 text-teal-800 ring-teal-100',
}

const chipClass =
  'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1'
const fallbackClass = 'bg-cream-100 text-ink-500 ring-line'

type RoleChip = { key: string; label: string; className: string }

function usePersonRoleChips(roles: ReceptionMatch['roles']): RoleChip[] {
  const { t } = useTranslation()
  const chips: RoleChip[] = []
  const seen = new Set<string>()

  for (const role of roles) {
    if (seen.has(role.code)) continue
    seen.add(role.code)
    chips.push({
      key: role.code,
      label: t(role.nameKey),
      className: roleClass[role.code] ?? fallbackClass,
    })
  }

  return chips
}

export function ReceptionKindChips({
  roles = [],
}: {
  kinds?: ReceptionKind[]
  roles?: ReceptionMatch['roles']
  hasHonoraryService?: boolean
}) {
  const chips = usePersonRoleChips(roles)
  if (!chips.length) return null
  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span key={chip.key} className={`${chipClass} ${chip.className}`}>
          {chip.label}
        </span>
      ))}
    </span>
  )
}

export function ReceptionMatchRoles({
  roles,
}: {
  roles: ReceptionMatch['roles']
  kinds?: ReceptionKind[]
  hasHonoraryService?: boolean
}) {
  const chips = usePersonRoleChips(roles)
  if (!chips.length) return null
  return (
    <span className="flex max-w-[11rem] flex-col items-end gap-1">
      {chips.map((chip) => (
        <span key={chip.key} className={`${chipClass} ${chip.className}`}>
          {chip.label}
        </span>
      ))}
    </span>
  )
}
