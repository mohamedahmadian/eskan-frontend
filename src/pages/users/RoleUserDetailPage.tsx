import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { DetailActions, PageHeader, cardClassName, userFormShellClassName } from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { languages, type AppLanguage } from '../../i18n'
import { api, getImageUrl } from '../../lib/api'
import { formatRoles } from '../../lib/roles'
import { useGeoName } from '../../lib/geo'
import type { ManagedUser } from '../../types/app'
import { HeadquartersAreasCard } from '../headquarters-representatives/HeadquartersAreasCard'
import { DetailRow } from '../geo/GeoShared'
import type { RoleUserScope } from './user-scopes'

function ImagePreview({ id, alt }: { id?: string | null; alt: string }) {
  if (!id) {
    return <span>—</span>
  }
  return <img src={getImageUrl(id)} alt={alt} className="h-28 w-28 rounded-2xl object-cover" />
}

export function RoleUserDetailPage({ scope }: { scope: RoleUserScope }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: actor } = useAuth()
  const geoName = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const keys = scope.i18nPrefix
  const query = useQuery({
    queryKey: [scope.queryKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`${scope.apiBase}/${id}`)
      return data
    },
  })

  const user = query.data
  if (!user) {
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  const isSelf = actor?.id === user.id
  const locale = user.locale as AppLanguage
  const religionLabel = user.religion
    ? user.religion === 'OTHER' && user.religionOther
      ? `${t(`religions.${user.religion}`)} (${user.religionOther})`
      : t(`religions.${user.religion}`)
    : '—'

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

      <article className={`p-6 ${cardClassName}`}>
        <h2 className="mb-4 text-base font-semibold text-ink-900">{t('users.tabs.account')}</h2>
        <dl className="grid gap-1 text-sm">
          <DetailRow label={t('users.username')} value={user.username} />
          <DetailRow label={t('users.roles')} value={formatRoles(user.roles, t)} />
          <DetailRow label={t('users.status')} value={t(`userStatuses.${user.status}`)} />
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

      <article className={`mt-4 p-6 ${cardClassName}`}>
        <h2 className="mb-4 text-base font-semibold text-ink-900">{t('users.tabs.personal')}</h2>
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

      <article className={`mt-4 p-6 ${cardClassName}`}>
        <h2 className="mb-4 text-base font-semibold text-ink-900">{t('users.tabs.location')}</h2>
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

      <article className={`mt-4 p-6 ${cardClassName}`}>
        <h2 className="mb-4 text-base font-semibold text-ink-900">{t('users.tabs.documents')}</h2>
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

      <article className={`mt-4 p-6 ${cardClassName}`}>
        <h2 className="mb-4 text-base font-semibold text-ink-900">{t('users.tabs.contact')}</h2>
        <dl className="grid gap-1 text-sm">
          <DetailRow label={t('users.email')} value={user.email ?? '—'} />
          <DetailRow label={t('users.telegram')} value={user.telegram ?? '—'} />
          <DetailRow label={t('users.bale')} value={user.bale ?? '—'} />
          <DetailRow label={t('users.eitaa')} value={user.eitaa ?? '—'} />
          <DetailRow label={t('users.whatsapp')} value={user.whatsapp ?? '—'} />
          <DetailRow label={t('users.otherSocial')} value={user.otherSocial ?? '—'} />
          <DetailRow
            label={t('users.vehiclePlates')}
            value={user.vehiclePlates.length ? user.vehiclePlates.join('، ') : '—'}
          />
          <DetailRow label={t('users.notes')} value={user.notes ?? '—'} />
        </dl>
      </article>

      {scope.showAccommodations ? (
        <article className={`mt-4 p-6 ${cardClassName}`}>
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            {t('accommodationManagers.accommodations')}
          </h2>
          {user.accommodations?.length ? (
            <ul className="space-y-2 text-sm">
              {user.accommodations.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-b border-line py-2">
                  <Link
                    className="text-teal-700 hover:underline"
                    to={`/accommodations/${item.accommodation.id}`}
                  >
                    {item.accommodation.name}
                  </Link>
                  {item.isPrimary ? (
                    <span className="text-xs text-teal-700">{t('accommodations.primaryManager')}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">{t('accommodationManagers.noAccommodations')}</p>
          )}
        </article>
      ) : null}

      {scope.showHeadquartersAreas ? (
        <HeadquartersAreasCard user={user} queryKey={scope.queryKey} apiBase={scope.apiBase} />
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
  )
}
