import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { LoadingState, DetailActions, PageHeader, cardClassName, userFormShellClassName } from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { TableCard } from '../../components/ui/ListControls'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { languages, type AppLanguage } from '../../i18n'
import { api, getImageUrl } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatRoles } from '../../lib/roles'
import { useGeoName } from '../../lib/geo'
import type { ManagedUser } from '../../types/app'
import { HeadquartersAreasCard } from '../headquarters-representatives/HeadquartersAreasCard'
import { DetailRow } from '../geo/GeoShared'
import type { RoleUserScope } from './user-scopes'

const baseTabs = ['personal', 'account', 'location', 'documents', 'social', 'other'] as const
type UserDetailTab = (typeof baseTabs)[number] | 'accommodations' | 'areas'

function ImagePreview({ id, alt }: { id?: string | null; alt: string }) {
  if (!id) {
    return <span>—</span>
  }
  return <img src={getImageUrl(id)} alt={alt} className="h-28 w-28 rounded-2xl object-cover" />
}

export function RoleUserDetailPage({ scope }: { scope: RoleUserScope }) {
  const { t, i18n } = useTranslation()
  const uiLocale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: actor } = useAuth()
  const geoName = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const keys = scope.i18nPrefix
  const [tab, setTab] = useState<UserDetailTab>('personal')
  const query = useQuery({
    queryKey: [scope.queryKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`${scope.apiBase}/${id}`)
      return data
    },
  })

  const tabs = useMemo(() => {
    const items: UserDetailTab[] = [...baseTabs]
    if (scope.showAccommodations) items.push('accommodations')
    if (scope.showHeadquartersAreas) items.push('areas')
    return items
  }, [scope.showAccommodations, scope.showHeadquartersAreas])

  const user = query.data
  if (!user) {
    return <LoadingState />
  }

  const isSelf = actor?.id === user.id
  const locale = user.locale as AppLanguage
  const religionLabel = user.religion
    ? user.religion === 'OTHER' && user.religionOther
      ? `${t(`religions.${user.religion}`)} (${user.religionOther})`
      : t(`religions.${user.religion}`)
    : '—'

  function panelClass(id: UserDetailTab) {
    return `p-6 ${cardClassName} ${tab === id ? '' : 'hidden'}`
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t(`${keys}.details`)}
        subtitle={t(`${keys}.detailsSubtitle`)}
        action={
          <Link to={scope.listPath} className="text-sm text-teal-700 hover:underline">
            {t(`${keys}.backToList`)}
          </Link>
        }
      />

      <div className="space-y-4">
        <nav className={`flex flex-wrap gap-2 p-3 ${cardClassName}`}>
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                tab === item
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
              }`}
            >
              {t(`users.tabs.${item}`)}
            </button>
          ))}
        </nav>

        <article className={panelClass('personal')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('users.firstName')} value={user.firstName} />
            <DetailRow label={t('users.lastName')} value={user.lastName} />
            <DetailRow
              label={t('users.gender')}
              value={user.gender ? t(`userGenders.${user.gender}`) : '—'}
            />
            <DetailRow label={t('users.nationalId')} value={user.nationalId ?? '—'} />
            <DetailRow label={t('users.phone')} value={user.phone ?? '—'} />
            <DetailRow label={t('users.religion')} value={religionLabel} />
          </dl>
        </article>

        <article className={panelClass('account')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('users.username')} value={user.username} />
            {scope.hideRoles ? null : (
              <DetailRow label={t('users.roles')} value={formatRoles(user.roles, t)} />
            )}
            <DetailRow
              label={t('users.locale')}
              value={languages[locale] ? t(`languages.${locale}`) : user.locale}
            />
            <DetailRow
              label={t('users.createdAt')}
              value={<DateText value={user.createdAt} withTime />}
            />
            <DetailRow
              label={t('users.updatedAt')}
              value={<DateText value={user.updatedAt} withTime />}
            />
          </dl>
        </article>

        <article className={panelClass('location')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('geo.country')} value={user.country ? geoName(user.country) : '—'} />
            <DetailRow
              label={t('geo.province')}
              value={user.province ? geoName(user.province) : '—'}
            />
            <DetailRow label={t('geo.city')} value={user.city ? geoName(user.city) : '—'} />
            <DetailRow label={t('users.address')} value={user.address ?? '—'} />
          </dl>
        </article>

        <article className={panelClass('documents')}>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-2 text-ink-500">{t('users.photo')}</p>
              <ImagePreview id={user.photoId} alt="" />
            </div>
            <div>
              <p className="mb-2 text-ink-500">{t('users.nationalCardPhoto')}</p>
              <ImagePreview id={user.nationalCardPhotoId} alt="" />
            </div>
            <div>
              <p className="mb-2 text-ink-500">{t('users.passportPhoto')}</p>
              <ImagePreview id={user.passportPhotoId} alt="" />
            </div>
          </dl>
        </article>

        <article className={panelClass('social')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('users.telegram')} value={user.telegram ?? '—'} />
            <DetailRow label={t('users.bale')} value={user.bale ?? '—'} />
            <DetailRow label={t('users.eitaa')} value={user.eitaa ?? '—'} />
            <DetailRow label={t('users.whatsapp')} value={user.whatsapp ?? '—'} />
            <DetailRow label={t('users.otherSocial')} value={user.otherSocial ?? '—'} />
          </dl>
        </article>

        <article className={panelClass('other')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('users.email')} value={user.email ?? '—'} />
            <DetailRow
              label={t('users.vehiclePlates')}
              value={user.vehiclePlates.length ? user.vehiclePlates.join('، ') : '—'}
            />
            <DetailRow label={t('users.notes')} value={user.notes ?? '—'} />
            <DetailRow label={t('users.status')} value={t(`userStatuses.${user.status}`)} />
          </dl>
        </article>

        {scope.showAccommodations ? (
          <div className={tab === 'accommodations' ? '' : 'hidden'}>
            <TableCard
              empty={t('accommodationManagers.noAccommodations')}
              hasRows={Boolean(user.accommodations?.length)}
            >
              <table className="w-full text-sm">
                <thead className="bg-cream-50 text-ink-700">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('accommodationManagers.year')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">{t('accommodations.name')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(user.accommodations ?? [])]
                    .sort((a, b) => (b.year !== a.year ? b.year - a.year : 0))
                    .map((item) => (
                      <tr key={item.id} className="border-t border-line">
                        <td className="px-4 py-3">{formatNumber(item.year, uiLocale)}</td>
                        <td className="px-4 py-3">
                          <Link
                            className="text-teal-700 hover:underline"
                            to={`/accommodations/${item.accommodation.id}`}
                          >
                            {item.accommodation.name}
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </TableCard>
          </div>
        ) : null}

        {scope.showHeadquartersAreas ? (
          <div className={tab === 'areas' ? '' : 'hidden'}>
            <HeadquartersAreasCard user={user} queryKey={scope.queryKey} apiBase={scope.apiBase} />
          </div>
        ) : null}

        <DetailActions
          editTo={`${scope.listPath}/${user.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={isSelf ? undefined : t(`${keys}.delete`)}
          onDelete={
            isSelf
              ? undefined
              : () =>
                  confirmDelete({
                    message: t(`${keys}.confirmDelete`),
                    successMessage: t(`${keys}.deleted`),
                    path: `${scope.apiBase}/${user.id}`,
                    queryKey: [scope.queryKey],
                    onDeleted: () => navigate(scope.listPath),
                  })
          }
        />
      </div>
    </div>
  )
}
