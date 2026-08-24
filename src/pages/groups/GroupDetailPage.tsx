import { UsersRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isAdmin } from '../../lib/roles'
import { useAuth } from '../../auth/AuthProvider'
import type { Group } from '../../types/app'

export function GroupDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { confirmDelete } = useConfirmDelete()
  const fromMine = useLocation().pathname.startsWith('/my-groups')
  const listPath = fromMine ? '/my-groups' : '/groups'
  const query = useQuery({
    queryKey: ['group', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Group>(`/groups/${id}`)
      return data
    },
  })

  const group = query.data
  if (!group) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('groups.details')}
        subtitle={<EntityNameSubtitle name={group.name} icon={UsersRound} />}
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.name')}</dt>
            <dd>{group.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('geo.country')}</dt>
            <dd>
              {group.city?.province?.country
                ? nameOf(group.city.province.country)
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('geo.province')}</dt>
            <dd>{group.city?.province ? nameOf(group.city.province) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.city')}</dt>
            <dd>{group.city ? nameOf(group.city) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.manager')}</dt>
            <dd>{group.manager?.fullName ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.maleCount')}</dt>
            <dd>{formatNumber(group.maleCount, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.femaleCount')}</dt>
            <dd>{formatNumber(group.femaleCount, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.totalCount')}</dt>
            <dd>{formatNumber(group.totalCount, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.eitaa')}</dt>
            <dd dir="ltr">{group.eitaa || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.bale')}</dt>
            <dd dir="ltr">{group.bale || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.telegram')}</dt>
            <dd dir="ltr">{group.telegram || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('groups.instagram')}</dt>
            <dd dir="ltr">{group.instagram || '—'}</dd>
          </div>
        </dl>
        <DetailActions
          editTo={`${listPath}/${group.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={isAdmin(user) ? t('groups.delete') : undefined}
          onDelete={
            isAdmin(user)
              ? () =>
                  confirmDelete({
                    message: t('groups.confirmDelete'),
                    successMessage: t('groups.deleted'),
                    path: `/groups/${group.id}`,
                    queryKey: ['groups'],
                    onDeleted: () => navigate(listPath),
                  })
              : undefined
          }
        />
      </article>
    </div>
  )
}
