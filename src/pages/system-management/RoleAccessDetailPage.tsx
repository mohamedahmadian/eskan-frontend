import { KeyRound, ListChecks, Shield, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { getNavIcon } from '../../lib/icons'
import { roleLabel } from '../../lib/roles'
import type { NavModuleCatalog, RoleAccess } from '../../types/app'

export function RoleAccessDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()

  const roleQuery = useQuery({
    queryKey: ['role', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<RoleAccess>(`/roles/${id}`)
      return data
    },
  })
  const catalogQuery = useQuery({
    queryKey: ['roles', 'menu-catalog'],
    queryFn: async () => {
      const { data } = await api.get<NavModuleCatalog[]>('/roles-catalog')
      return data
    },
  })

  const item = roleQuery.data
  const modules = catalogQuery.data
  if (!item || !modules) {
    return <LoadingState />
  }

  const selected = new Set(item.menuIds)
  const assignedModules = modules
    .map((mod) => ({
      ...mod,
      menus: mod.menus.filter((menu) => selected.has(menu.id)),
    }))
    .filter((mod) => mod.menus.length > 0)
  const name = roleLabel(item, t)

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Shield}
        title={t('roleAccess.details')}
        subtitle={<EntityNameSubtitle name={name} icon={Shield} />}
      />
      <FormCard icon={Shield} title={name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={Shield} label={t('roleAccess.name')} value={name} tone="teal" />
            <FormFactTile
              icon={KeyRound}
              label={t('roleAccess.code')}
              value={<span className="digit-field" dir="ltr">{item.code}</span>}
              tone="mint"
            />
            <FormFactTile
              icon={ListChecks}
              label={t('roleAccess.menuCount')}
              value={formatNumber(item.menuCount, locale)}
              tone="teal"
            />
            <FormFactTile
              icon={Users}
              label={t('roleAccess.userCount')}
              value={formatNumber(item.userCount, locale)}
              tone="mint"
            />
            <FormFactTile
              icon={Shield}
              label={t('roleAccess.kind')}
              value={item.isSystem ? t('roleAccess.systemRole') : t('roleAccess.customRole')}
              tone="ink"
            />
          </div>
          <FormSectionTitle icon={ListChecks}>{t('roleAccess.menus')}</FormSectionTitle>
          {assignedModules.length ? (
            <div className="space-y-5">
              {assignedModules.map((mod) => {
                const ModuleIcon = getNavIcon(mod.icon)
                return (
                  <div key={mod.id} className="space-y-2">
                    <FormSectionTitle icon={ModuleIcon}>{t(mod.nameKey)}</FormSectionTitle>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      {mod.menus.map((menu) => {
                        const MenuIcon = getNavIcon(menu.icon)
                        return (
                          <FormFactTile
                            key={menu.id}
                            icon={MenuIcon}
                            label={t(menu.nameKey)}
                            value={t('roleAccess.allowed')}
                            tone="teal"
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <FormEmptyHint>{t('roleAccess.noMenus')}</FormEmptyHint>
          )}
          <DetailActions
            editTo={`/system-management/roles/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={item.isSystem ? undefined : t('roleAccess.delete')}
            onDelete={
              item.isSystem
                ? undefined
                : () =>
                    confirmDelete({
                      message: t('roleAccess.confirmDelete'),
                      successMessage: t('roleAccess.deleted'),
                      path: `/roles/${item.id}`,
                      queryKey: ['roles'],
                      onDeleted: () => navigate('/system-management/roles'),
                    })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
