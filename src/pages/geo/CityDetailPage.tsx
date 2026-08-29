import { HandHeart, Landmark, UtensilsCrossed } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { LoadingState, Button, DetailActions, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import { hasMenuAccess } from '../../routes/RequireMenuAccess'
import type { City } from '../../types/app'
import { DetailRow, GeoHas, GeoLocationRows, GeoStatus, GeoYesNo, RepresentativeValue } from './GeoShared'

export function CityDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['city', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<City>(`/cities/${id}`)
      return data
    },
  })

  const city = query.data
  if (!city) {
    return <LoadingState />
  }

  const canManageFoodSuppliers = hasMenuAccess('/base-info/food-suppliers', user?.modules ?? [])
  const canManageBenefactors = hasMenuAccess('/base-info/benefactors', user?.modules ?? [])
  const canManagePlaces = hasMenuAccess('/base-info/places', user?.modules ?? [])

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('cities.details')} subtitle={t('cities.detailsSubtitle')} />
      <div className="space-y-4">
        <article className={`p-6 ${cardClassName}`}>
          <dl className="grid gap-3 text-sm">
            <DetailRow label={t('geo.nameFa')} value={city.nameFa} />
            <DetailRow label={t('geo.nameEn')} value={city.nameEn} />
            <DetailRow label={t('geo.code')} value={city.code} />
            <DetailRow label={t('geo.province')} value={name(city.province)} />
            <DetailRow label={t('geo.country')} value={name(city.province.country)} />
            <GeoLocationRows
              neshanAddress={city.neshanAddress}
              latitude={city.latitude}
              longitude={city.longitude}
            />
            <DetailRow
              label={t('geo.isProvinceCapital')}
              value={<GeoYesNo value={city.isProvinceCapital} />}
            />
            <DetailRow label={t('geo.hasRailway')} value={<GeoHas value={city.hasRailway} />} />
            <DetailRow label={t('geo.hasAirport')} value={<GeoHas value={city.hasAirport} />} />
            <DetailRow label={t('geo.isActive')} value={<GeoStatus active={city.isActive} />} />
            <DetailRow
              label={t('geo.representative')}
              value={
                <RepresentativeValue
                  representative={
                    city.province.representative
                      ? (city.representative ?? city.province.representative)
                      : null
                  }
                  inherited={!city.representative && Boolean(city.province.representative)}
                />
              }
            />
          </dl>
          <DetailActions
            editTo={`/base-info/cities/${city.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('cities.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('cities.confirmDelete'),
                successMessage: t('cities.deleted'),
                path: `/cities/${city.id}`,
                queryKey: ['cities'],
                onDeleted: () => navigate('/base-info/cities'),
              })
            }
          />
        </article>
        <article className={`p-6 ${cardClassName}`}>
          <h2 className="text-base font-semibold text-ink-900">{t('cities.relatedSection')}</h2>
          <p className="mt-1 text-sm text-ink-500">{t('cities.relatedSectionSubtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {canManageFoodSuppliers ? (
              <Link
                to={`/base-info/food-suppliers?provinceId=${city.provinceId}&cityId=${city.id}`}
              >
                <Button type="button" variant="ghost">
                  <UtensilsCrossed className="size-4" aria-hidden />
                  {t('cities.manageFoodSuppliers')}
                </Button>
              </Link>
            ) : null}
            {canManageBenefactors ? (
              <Link
                to={`/base-info/benefactors?provinceId=${city.provinceId}&cityId=${city.id}`}
              >
                <Button type="button" variant="ghost">
                  <HandHeart className="size-4" aria-hidden />
                  {t('cities.manageBenefactors')}
                </Button>
              </Link>
            ) : null}
            {canManagePlaces ? (
              <Link
                to={`/base-info/places?provinceId=${city.provinceId}&cityId=${city.id}`}
              >
                <Button type="button" variant="ghost">
                  <Landmark className="size-4" aria-hidden />
                  {t('cities.managePlaces')}
                </Button>
              </Link>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  )
}
