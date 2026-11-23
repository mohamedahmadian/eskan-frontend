import { Hash, Languages, Shapes, Tags, ToggleRight, Type } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { AccommodationType } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'
import { AccommodationTypeIcon } from './AccommodationTypeForm'

export function AccommodationTypeDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['accommodation-type', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<AccommodationType>(`/accommodation-types/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Tags}
        title={t('accommodationType.details')}
        subtitle={<EntityNameSubtitle name={name(item)} icon={Tags} />}
      />
      <FormCard icon={Tags} title={name(item)}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Type}
              label={t('geo.nameFa')}
              value={item.nameFa}
              tone="teal"
            />
            <FormFactTile
              icon={Languages}
              label={t('geo.nameEn')}
              value={item.nameEn}
              tone="mint"
            />
            <FormFactTile icon={Hash} label={t('accommodationType.code')} value={item.code} tone="ink" />
            <FormFactTile
              icon={Shapes}
              label={t('accommodationType.icon')}
              value={
                <span className="inline-flex items-center gap-2">
                  <AccommodationTypeIcon name={item.icon} className="size-4 text-teal-600" />
                  {t(`accommodationType.icons.${item.icon}`, { defaultValue: item.icon })}
                </span>
              }
              tone="teal"
            />
            <FormFactTile
              icon={Hash}
              label={t('accommodationType.accommodationCount')}
              value={formatNumber(item._count?.accommodations ?? 0, locale)}
              tone="mint"
            />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="teal"
            />
          </div>
          <DetailActions
            editTo={`/accommodation-types/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('accommodationType.delete')}
            extra={
              <Link to={`/accommodations?typeId=${item.id}`}>
                <Button type="button" variant="soft">
                  <Tags className="size-4" aria-hidden />
                  {t('accommodationType.manageAccommodations')}
                </Button>
              </Link>
            }
            onDelete={() =>
              confirmDelete({
                message: t('accommodationType.confirmDelete'),
                successMessage: t('accommodationType.deleted'),
                path: `/accommodation-types/${item.id}`,
                queryKey: ['accommodation-types'],
                onDeleted: () => navigate('/accommodation-types'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
