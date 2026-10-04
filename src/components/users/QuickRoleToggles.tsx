import { Building2, HandHeart, Shield, Tent, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { CheckboxField } from '../ui/CheckboxField'
import { FormSectionTitle } from '../ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { isAdmin } from '../../lib/roles'
import type { RoleOption } from '../../types/app'

export const quickRoleCodes = [
  'CARAVAN_MANAGER',
  'ACCOMMODATION_MANAGER',
  'HONORARY_SERVANT',
] as const

const quickRoleItems: {
  code: (typeof quickRoleCodes)[number]
  labelKey: string
  icon: LucideIcon
}[] = [
  { code: 'CARAVAN_MANAGER', labelKey: 'roles.caravanManager', icon: Tent },
  { code: 'ACCOMMODATION_MANAGER', labelKey: 'roles.accommodationManager', icon: Building2 },
  { code: 'HONORARY_SERVANT', labelKey: 'roles.honoraryServant', icon: HandHeart },
]

export function isQuickRoleCode(code: string) {
  return (quickRoleCodes as readonly string[]).includes(code)
}

export function QuickRoleToggles({
  userId,
  roleCodes,
  lockedCodes = [],
  onChanged,
}: {
  userId: string
  roleCodes: string[]
  lockedCodes?: string[]
  onChanged?: (roles: RoleOption[]) => void
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const signature = [...roleCodes].sort().join('|')
  const [optimistic, setOptimistic] = useState<string[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const codes = optimistic ?? roleCodes

  useEffect(() => {
    setOptimistic(null)
  }, [signature])

  if (!isAdmin(user)) return null

  async function toggle(code: (typeof quickRoleCodes)[number], enabled: boolean) {
    if (pending || lockedCodes.includes(code)) return
    const next = enabled
      ? [...new Set([...codes, code])]
      : codes.filter((item) => item !== code)
    setOptimistic(next)
    setPending(code)
    try {
      const { data } = await api.patch<{ roles: RoleOption[] }>(`/users/${userId}/roles/${code}`, {
        enabled,
      })
      const label = t(quickRoleItems.find((item) => item.code === code)?.labelKey ?? code)
      toast.success(t(enabled ? 'users.quickRoleGranted' : 'users.quickRoleRevoked', { role: label }))
      onChanged?.(data.roles)
    } catch (error) {
      setOptimistic(null)
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-2">
      <FormSectionTitle icon={Shield}>{t('users.quickRoles')}</FormSectionTitle>
      <p className="text-xs leading-5 text-ink-500">{t('users.quickRolesHint')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {quickRoleItems.map((item) => {
          const locked = lockedCodes.includes(item.code)
          const checked = codes.includes(item.code) || locked
          const Icon = item.icon
          return (
            <CheckboxField
              key={item.code}
              checked={checked}
              disabled={pending !== null || locked}
              onChange={(on) => {
                if (on !== checked) void toggle(item.code, on)
              }}
              label={
                <span className="inline-flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-teal-600" aria-hidden />
                  {t(item.labelKey)}
                </span>
              }
            />
          )
        })}
      </div>
    </div>
  )
}
