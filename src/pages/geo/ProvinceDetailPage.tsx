import { HandHeart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { LoadingState, Button, DetailActions, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { formatNumber } from '../../lib/datetime'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import type { Province } from '../../types/app'
import { DetailRow, GeoHas, GeoLocationRows, GeoStatus, RepresentativeValue } from './GeoShared'

export function ProvinceDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['province', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Province>(`/provinces/${id}`)
      return data
    },
  })

  const province = query.data
  if (!province) {
    return <LoadingState />
  }

  const canManageBenefactors = hasMenuAccess('/base-info/benefactors', user?.modules ?? [])

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('provinces.details')} subtitle={t('provinces.detailsSubtitle')} />
      <div className="space-y-4">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <dl className="grid gap-3 text-sm">
            <DetailRow label={t('geo.nameFa')} value={province.nameFa} />
            <DetailRow label={t('geo.nameEn')} value={province.nameEn} />
            <DetailRow label={t('geo.code')} value={province.code} />
            <DetailRow label={t('geo.country')} value={name(province.country)} />
            <DetailRow label={t('geo.cityCount')} value={formatNumber(province._count?.cities ?? 0, locale)} />
            <GeoLocationRows
              neshanAddress={province.neshanAddress}
              latitude={province.latitude}
              longitude={province.longitude}
            />
            <DetailRow label={t('geo.hasRailway')} value={<GeoHas value={province.hasRailway} />} />
            <DetailRow label={t('geo.hasAirport')} value={<GeoHas value={province.hasAirport} />} />
            <DetailRow label={t('geo.isActive')} value={<GeoStatus active={province.isActive} />} />
            <DetailRow
              label={t('geo.representative')}
              value={<RepresentativeValue representative={province.representative} />}
            />
          </dl>
          <DetailActions
            editTo={`/base-info/provinces/${province.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('provinces.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('provinces.confirmDelete'),
                successMessage: t('provinces.deleted'),
                path: `/provinces/${province.id}`,
                queryKey: ['provinces'],
                onDeleted: () => navigate('/base-info/provinces'),
              })
            }
            extra={
              <Link
                to={`/base-info/cities?countryId=${province.countryId}&provinceId=${province.id}`}
              >
                <Button type="button" variant="ghost">
                  {t('menus.cities')}
                </Button>
              </Link>
            }
          />
        </article>
        {canManageBenefactors ? (
          <article className={`p-6 ${cardClassName}`}>
            <h2 className="text-base font-semibold text-ink-900">{t('provinces.relatedSection')}</h2>
            <p className="mt-1 text-sm text-ink-500">{t('provinces.relatedSectionSubtitle')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to={`/base-info/benefactors?provinceId=${province.id}`}>
                <Button type="button" variant="ghost">
                  <HandHeart className="size-4" aria-hidden />
                  {t('provinces.manageBenefactors')}
                </Button>
              </Link>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}
