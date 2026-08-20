import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoadingState, Button, DetailActions, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { formatNumber } from '../../lib/datetime'
import { api } from '../../lib/api'
import type { Country } from '../../types/app'
import { DetailRow, GeoStatus } from './GeoShared'

export function CountryDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['country', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Country>(`/countries/${id}`)
      return data
    },
  })

  const country = query.data
  if (!country) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('countries.details')}
        subtitle={t('countries.detailsSubtitle')}
        action={
          <Link to="/base-info/countries" className="text-sm text-teal-700 hover:underline">
            {t('countries.backToList')}
          </Link>
        }
      />
      <article className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('geo.nameFa')} value={country.nameFa} />
          <DetailRow label={t('geo.nameEn')} value={country.nameEn} />
          <DetailRow label={t('geo.iso2')} value={country.iso2} />
          <DetailRow label={t('geo.iso3')} value={country.iso3 ?? '—'} />
          <DetailRow label={t('geo.phoneCode')} value={country.phoneCode ?? '—'} />
          <DetailRow label={t('geo.provinceCount')} value={formatNumber(country._count?.provinces ?? 0, locale)} />
          <DetailRow label={t('geo.isActive')} value={<GeoStatus active={country.isActive} />} />
        </dl>
        <DetailActions
          editTo={`/base-info/countries/${country.id}/edit`}
          editLabel={t('common.edit')}
          deleteLabel={t('countries.delete')}
          onDelete={() =>
            confirmDelete({
              message: t('countries.confirmDelete'),
              successMessage: t('countries.deleted'),
              path: `/countries/${country.id}`,
              queryKey: ['countries'],
              onDeleted: () => navigate('/base-info/countries'),
            })
          }
          extra={
            <Link to={`/base-info/provinces?countryId=${country.id}`}>
              <Button type="button" variant="ghost">
                {t('menus.provinces')}
              </Button>
            </Link>
          }
        />
      </article>
    </div>
  )
}
