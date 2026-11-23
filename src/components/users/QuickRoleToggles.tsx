import {
  Building,
  Building2,
  FileBadge2,
  HandHeart,
  Landmark,
  MapPinned,
  Network,
  Shield,
  Tent,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { CheckboxField } from '../ui/CheckboxField'
import { FormSectionTitle } from '../ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { isAdmin, unwrapRoleList } from '../../lib/roles'
import type { RoleOption } from '../../types/app'

export const quickRoleCodes = [
  'CARAVAN_MANAGER',
  'ACCOMMODATION_MANAGER',
  'HONORARY_SERVANT',
] as const

const roleIcons: Record<string, LucideIcon> = {
  ADMIN: Shield,
  PILGRIM: UserRound,
  CARAVAN_MANAGER: Tent,
  GROUP_MANAGER: Users,
  ACCOMMODATION_MANAGER: Building2,
  HEADQUARTERS_REPRESENTATIVE: Landmark,
  LICENSE_ISSUER: FileBadge2,
  UNIT_MANAGER: Network,
  GOVERNMENT_ORG_OFFICER: Building,
  HONORARY_SERVANT: HandHeart,
  STATION_MANAGER: MapPinned,
}

export function isQuickRoleCode(code: string) {
  return (quickRoleCodes as readonly string[]).includes(code)
}

export function QuickRoleToggles({
  userId,
  roleCodes,
  lockedCodes = [],
  roles: rolesProp,
  onChanged,
}: {
  userId: string
  roleCodes: string[]
  lockedCodes?: string[]
  roles?: RoleOption[]
  onChanged?: (roles: RoleOption[]) => void
}) {
  const { t } = useTranslation()
  const { user, refresh } = useAuth()
  const signature = [...roleCodes].sort().join('|')
  const [optimistic, setOptimistic] = useState<string[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const codes = optimistic ?? roleCodes
  const catalogQuery = useQuery({
    queryKey: ['roles', 'lookup'],
    enabled: rolesProp == null,
    queryFn: async () => {
      const { data } = await api.get('/roles')
      return unwrapRoleList(data)
    },
  })
  const items = useMemo(() => {
    const byId = new Map<string, RoleOption>()
    for (const role of rolesProp ?? catalogQuery.data ?? []) {
      byId.set(role.id, role)
    }
    return [...byId.values()]
  }, [catalogQuery.data, rolesProp])

  useEffect(() => {
    setOptimistic(null)
  }, [signature])

  if (!isAdmin(user) || items.length === 0) return null

  async function toggle(code: string, enabled: boolean) {
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
      const label = t(items.find((item) => item.code === code)?.nameKey ?? code)
      toast.success(t(enabled ? 'users.quickRoleGranted' : 'users.quickRoleRevoked', { role: label }))
      onChanged?.(data.roles)
      if (user?.id === userId) void refresh()
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
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const locked = lockedCodes.includes(item.code)
          const checked = codes.includes(item.code) || locked
          const Icon = roleIcons[item.code] ?? Shield
          return (
            <CheckboxField
              key={item.id}
              checked={checked}
              disabled={pending !== null || locked}
              onChange={(on) => {
                if (on !== checked) void toggle(item.code, on)
              }}
              label={
                <span className="inline-flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-teal-600" aria-hidden />
                  {t(item.nameKey)}
                </span>
              }
            />
          )
        })}
      </div>
    </div>
  )
}
