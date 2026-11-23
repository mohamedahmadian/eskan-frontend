import { KeyRound, ListChecks, Search, Shield } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import {
  AppForm,
  FormActions,
  FormField,
  fieldClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import { formatNumber, toLatinDigits } from '../../lib/datetime'
import { preferEnglishKeyboard } from '../../lib/identity'
import { getNavIcon } from '../../lib/icons'
import { roleLabel } from '../../lib/roles'
import type { NavModuleCatalog, RoleAccess } from '../../types/app'

export type RoleAccessPayload = {
  code?: string
  name?: string
  menuIds: string[]
}

export function RoleAccessForm({
  initial,
  modules,
  onSubmit,
}: {
  initial?: RoleAccess
  modules: NavModuleCatalog[]
  onSubmit: (payload: RoleAccessPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState(initial?.code ?? '')
  const [name, setName] = useState(initial ? roleLabel(initial, t) : '')
  const catalogMenuIds = useMemo(
    () => new Set(modules.flatMap((mod) => mod.menus.map((item) => item.id))),
    [modules],
  )
  const [menuIds, setMenuIds] = useState<string[]>(() => {
    const lockedIds = initial?.lockedMenuIds ?? []
    return [
      ...new Set([
        ...(initial?.menuIds ?? []).filter((id) => catalogMenuIds.has(id)),
        ...lockedIds,
      ]),
    ]
  })
  const [menuQuery, setMenuQuery] = useState('')
  const locked = useMemo(
    () => new Set(initial?.lockedMenuIds ?? []),
    [initial?.lockedMenuIds],
  )
  const selected = useMemo(() => new Set(menuIds), [menuIds])
  const isSystem = Boolean(initial?.isSystem)
  const visibleModules = useMemo(() => {
    const needle = toLatinDigits(menuQuery).trim().toLowerCase()
    if (!needle) return modules
    return modules
      .map((mod) => {
        const moduleLabel = t(mod.nameKey).toLowerCase()
        const moduleHit =
          moduleLabel.includes(needle) ||
          mod.code.toLowerCase().includes(needle)
        const menus = moduleHit
          ? mod.menus
          : mod.menus.filter((menu) => {
              const label = t(menu.nameKey).toLowerCase()
              return (
                label.includes(needle) ||
                menu.code.toLowerCase().includes(needle) ||
                menu.path.toLowerCase().includes(needle)
              )
            })
        return { ...mod, menus }
      })
      .filter((mod) => mod.menus.length > 0)
  }, [menuQuery, modules, t])

  function toggleMenu(id: string, on: boolean) {
    if (locked.has(id)) return
    setMenuIds((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return [...next]
    })
  }

  function toggleModule(mod: NavModuleCatalog, on: boolean) {
    setMenuIds((current) => {
      const next = new Set(current)
      for (const menu of mod.menus) {
        if (locked.has(menu.id)) continue
        if (on) next.add(menu.id)
        else next.delete(menu.id)
      }
      return [...next]
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        ...(initial ? {} : { code: code.trim().toUpperCase() }),
        ...(isSystem ? {} : { name: name.trim() }),
        menuIds: [...new Set([...menuIds, ...locked])].filter(
          (id) => catalogMenuIds.has(id) || locked.has(id),
        ),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Shield}
      title={initial ? roleLabel(initial, t) : t('roleAccess.create')}
      subtitle={initial ? undefined : t('roleAccess.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={KeyRound} label={t('roleAccess.code')} htmlFor="code">
          <input
            id="code"
            className={`${fieldClassName} digit-field`}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onFocus={(e) => preferEnglishKeyboard(e.currentTarget)}
            required={!initial}
            readOnly={Boolean(initial)}
            minLength={2}
            maxLength={32}
            pattern="[A-Z][A-Z0-9_]*"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </FormField>
        <FormField icon={Shield} label={t('roleAccess.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required={!isSystem}
            readOnly={isSystem}
            minLength={2}
            maxLength={80}
          />
        </FormField>
        <p className="rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-ink-700">
          {t('roleAccess.menusHint')}
        </p>
        <FormField icon={Search} label={t('roleAccess.searchMenus')} htmlFor="menuQuery">
          <input
            id="menuQuery"
            className={fieldClassName}
            value={menuQuery}
            onChange={(event) => setMenuQuery(event.target.value)}
            placeholder={t('roleAccess.searchMenusPlaceholder')}
            autoComplete="off"
          />
        </FormField>
        <div className="space-y-6">
          {visibleModules.length ? (
            visibleModules.map((mod) => {
              const ModuleIcon = getNavIcon(mod.icon)
              const unlocked = mod.menus.filter((item) => !locked.has(item.id))
              const checkedCount = mod.menus.filter((item) => selected.has(item.id)).length
              const allOn = unlocked.length > 0 && unlocked.every((item) => selected.has(item.id))
              return (
                <div key={mod.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormSectionTitle icon={ModuleIcon} className="mb-0">
                      {t(mod.nameKey)}
                    </FormSectionTitle>
                    {unlocked.length ? (
                      <CheckboxField
                        checked={allOn}
                        onChange={(on) => toggleModule(mod, on)}
                        label={t('roleAccess.selectModule')}
                      />
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {mod.menus.map((menu) => {
                      const MenuIcon = getNavIcon(menu.icon)
                      const isLocked = locked.has(menu.id)
                      return (
                        <CheckboxField
                          key={menu.id}
                          checked={selected.has(menu.id) || isLocked}
                          disabled={isLocked}
                          onChange={(on) => toggleMenu(menu.id, on)}
                          label={
                            <span className="flex min-w-0 items-center gap-2">
                              <MenuIcon className="size-4 shrink-0 text-teal-600" aria-hidden />
                              <span className="min-w-0">{t(menu.nameKey)}</span>
                            </span>
                          }
                        />
                      )
                    })}
                  </div>
                  <p className="sr-only">
                    {t('roleAccess.selectedInModule', { count: checkedCount })}
                  </p>
                </div>
              )
            })
          ) : (
            <FormEmptyHint>{t('roleAccess.noMenuResults')}</FormEmptyHint>
          )}
        </div>
        <FormField icon={ListChecks} label={t('roleAccess.selectedCount')}>
          <p className="text-sm text-ink-700">
            {t('roleAccess.selectedCountValue', {
              count: formatNumber(selected.size, locale),
            })}
          </p>
        </FormField>
        <FormActions
          submitLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
