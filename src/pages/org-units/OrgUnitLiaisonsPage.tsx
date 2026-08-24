import { Building, Check, Tent, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import {
  Button,
  EntityNameSubtitle,
  FormActions,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import type { OrgUnit } from '../../types/app'
import { accommodationContactRoles } from '../accommodations/accommodationContacts'
import { caravanContactRoles } from '../caravans/caravanContacts'

type LiaisonsResponse = {
  accommodationRoles: string[]
  caravanRoles: string[]
}

function RolePickerSection({
  icon: Icon,
  title,
  hint,
  roles,
  labelPrefix,
  selected,
  onChange,
}: {
  icon: typeof Users
  title: string
  hint: string
  roles: readonly string[]
  labelPrefix: string
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const { t } = useTranslation()
  const allSelected = roles.length > 0 && roles.every((role) => selected.has(role))

  function toggleOne(role: string, on: boolean) {
    const next = new Set(selected)
    if (on) next.add(role)
    else next.delete(role)
    onChange(next)
  }

  function toggleAll(on: boolean) {
    onChange(on ? new Set(roles) : new Set())
  }

  return (
    <section className="space-y-3">
      <FormSectionTitle icon={Icon}>{title}</FormSectionTitle>
      <p className="text-sm text-ink-600">{hint}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="soft" onClick={() => toggleAll(true)}>
          <Check className="size-4" aria-hidden />
          {t('orgUnits.selectAll')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => toggleAll(false)}
          disabled={selected.size === 0}
        >
          {t('orgUnits.clearAll')}
        </Button>
        <div className="ms-auto">
          <CheckboxField
            checked={allSelected}
            onChange={toggleAll}
            label={t('orgUnits.selectAll')}
          />
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {roles.map((role) => (
          <li key={role}>
            <CheckboxField
              checked={selected.has(role)}
              onChange={(on) => toggleOne(role, on)}
              label={t(`${labelPrefix}.${role}`)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function OrgUnitLiaisonsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [accommodationSelected, setAccommodationSelected] = useState<Set<string>>(
    new Set(),
  )
  const [caravanSelected, setCaravanSelected] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  const unit = useQuery({
    queryKey: ['org-unit', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<OrgUnit>(`/org-units/${id}`)
      return data
    },
  })

  const liaisons = useQuery({
    queryKey: ['org-unit', id, 'liaisons'],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<LiaisonsResponse>(`/org-units/${id}/liaisons`)
      return data
    },
  })

  useEffect(() => {
    if (!liaisons.data || hydrated) return
    setAccommodationSelected(new Set(liaisons.data.accommodationRoles))
    setCaravanSelected(new Set(liaisons.data.caravanRoles))
    setHydrated(true)
  }, [liaisons.data, hydrated])

  const save = useMutation({
    mutationFn: async () => {
      await api.put(`/org-units/${id}/liaisons`, {
        accommodationRoles: [...accommodationSelected],
        caravanRoles: [...caravanSelected],
      })
    },
    onSuccess: async () => {
      toast.success(t('orgUnits.liaisonsSaved'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['org-unit', id] }),
        queryClient.invalidateQueries({ queryKey: ['org-units'] }),
        queryClient.invalidateQueries({ queryKey: ['org-unit', id, 'liaisons'] }),
      ])
      navigate(`/headquarters/units/${id}`)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const ready = useMemo(
    () => Boolean(unit.data && liaisons.data && hydrated),
    [unit.data, liaisons.data, hydrated],
  )

  if (!ready || !unit.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('orgUnits.manageLiaisons')}
        subtitle={<EntityNameSubtitle name={unit.data.name} icon={Building} />}
        backTo={`/headquarters/units/${unit.data.id}`}
      />
      <FormCard
        icon={Users}
        title={t('orgUnits.manageLiaisons')}
        subtitle={t('orgUnits.manageLiaisonsSubtitle')}
      >
        <form
          className={`${formCardBodyClassName} space-y-8`}
          onSubmit={(event) => {
            event.preventDefault()
            save.mutate()
          }}
        >
          <RolePickerSection
            icon={Building}
            title={t('orgUnits.accommodationLiaisonsSection')}
            hint={t('orgUnits.accommodationLiaisonsHint')}
            roles={accommodationContactRoles}
            labelPrefix="accommodations.contactRoles"
            selected={accommodationSelected}
            onChange={setAccommodationSelected}
          />
          <RolePickerSection
            icon={Tent}
            title={t('orgUnits.caravanLiaisonsSection')}
            hint={t('orgUnits.caravanLiaisonsHint')}
            roles={caravanContactRoles}
            labelPrefix="caravans.contactRoles"
            selected={caravanSelected}
            onChange={setCaravanSelected}
          />
          <FormActions
            submitLabel={t('orgUnits.saveLiaisons')}
            cancelLabel={t('orgUnits.cancel')}
            submitting={save.isPending}
            onCancel={() => navigate(`/headquarters/units/${unit.data.id}`)}
          />
        </form>
      </FormCard>
    </div>
  )
}
