import { History } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import {
  Button,
  LoadingState,
  DetailActions,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getImageUrl } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Caravan } from '../../types/app'
import { caravanContactRoles } from './caravanContacts'

export function CaravanDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })

  const caravan = query.data
  if (!caravan) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('caravans.details')}
        subtitle={t('caravans.detailsSubtitle')}
        action={
          <Link to="/caravans" className="text-sm text-teal-700 hover:underline">
            {t('caravans.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.name')}</dt>
            <dd>{caravan.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('geo.country')}</dt>
            <dd>
              {caravan.city?.province?.country
                ? nameOf(caravan.city.province.country)
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('geo.province')}</dt>
            <dd>{caravan.city?.province ? nameOf(caravan.city.province) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.city')}</dt>
            <dd>{caravan.city ? nameOf(caravan.city) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.maleCount')}</dt>
            <dd>{formatNumber(caravan.maleCount, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.femaleCount')}</dt>
            <dd>{formatNumber(caravan.femaleCount, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.totalCount')}</dt>
            <dd>{formatNumber(caravan.totalCount, locale)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.licenseNumber')}</dt>
            <dd>{caravan.licenseNumber || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.licenseImage')}</dt>
            <dd>
              {caravan.licenseImageId ? (
                <a
                  href={getImageUrl(caravan.licenseImageId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:underline"
                >
                  {t('common.view')}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.manager')}</dt>
            <dd>{caravan.manager?.fullName ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('users.nationalId')}</dt>
            <dd dir="ltr">{caravan.manager?.nationalId ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('users.phone')}</dt>
            <dd dir="ltr">{caravan.manager?.phone ?? '—'}</dd>
          </div>
          {caravanContactRoles.map((role) => {
            const contact = caravan.contacts?.find((item) => item.role === role)
            return (
              <div key={role} className="border-b border-line py-3">
                <div className="mb-2 text-sm font-medium text-teal-800">
                  {t(`caravans.contactRoles.${role}`)}
                </div>
                {contact ? (
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">{t('users.firstName')}</dt>
                      <dd>{contact.user.firstName}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">{t('users.lastName')}</dt>
                      <dd>{contact.user.lastName}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">{t('users.nationalId')}</dt>
                      <dd dir="ltr">{contact.user.nationalId ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">{t('users.phone')}</dt>
                      <dd dir="ltr">{contact.user.phone ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-500">{t('pilgrims.birthDate')}</dt>
                      <dd>
                        <DateText value={contact.user.birthDate ?? null} />
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-ink-400">{t('caravans.contactEmpty')}</p>
                )}
              </div>
            )
          })}
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.eitaa')}</dt>
            <dd dir="ltr">{caravan.eitaa || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.bale')}</dt>
            <dd dir="ltr">{caravan.bale || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.telegram')}</dt>
            <dd dir="ltr">{caravan.telegram || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.instagram')}</dt>
            <dd dir="ltr">{caravan.instagram || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.officeAddress')}</dt>
            <dd className="text-end whitespace-pre-wrap">{caravan.officeAddress || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.officePhone')}</dt>
            <dd dir="ltr">{caravan.officePhone || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.foundedYear')}</dt>
            <dd>
              {caravan.foundedYear != null
                ? formatNumber(caravan.foundedYear, locale)
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.description')}</dt>
            <dd className="text-end whitespace-pre-wrap">{caravan.description || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-ink-500">{t('caravans.status')}</dt>
            <dd>{caravan.isActive ? t('geo.active') : t('geo.inactive')}</dd>
          </div>
        </dl>
        <DetailActions
          editTo={`/caravans/${caravan.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('caravans.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('caravans.confirmDelete'),
              successMessage: t('caravans.deleted'),
              path: `/caravans/${caravan.id}`,
              queryKey: ['caravans'],
              onDeleted: () => navigate('/caravans'),
            })
          }
          extra={
            <Link to={`/caravans/${caravan.id}/pilgrimage-history`}>
              <Button type="button" variant="gold">
                <History className="size-4" aria-hidden />
                {t('caravanPilgrimageHistory.manage')}
              </Button>
            </Link>
          }
        />
      </article>
    </div>
  )
}
