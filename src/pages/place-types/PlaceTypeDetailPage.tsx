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
import type { PlaceType } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'
import { PlaceTypeIcon } from './PlaceTypeForm'

export function PlaceTypeDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['place-type', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<PlaceType>(`/place-types/${id}`)
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
        title={t('placeTypes.details')}
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
            <FormFactTile icon={Hash} label={t('placeTypes.code')} value={item.code} tone="ink" />
            <FormFactTile
              icon={Shapes}
              label={t('placeTypes.icon')}
              value={
                <span className="inline-flex items-center gap-2">
                  <PlaceTypeIcon name={item.icon} className="size-4 text-teal-600" />
                  {t(`placeTypes.icons.${item.icon}`, { defaultValue: item.icon })}
                </span>
              }
              tone="teal"
            />
            <FormFactTile
              icon={Hash}
              label={t('placeTypes.placeCount')}
              value={formatNumber(item._count?.places ?? 0, locale)}
              tone="mint"
            />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="ink"
            />
          </div>
          <DetailActions
            editTo={`/base-info/places/types/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('placeTypes.delete')}
            extra={
              <Link to={`/base-info/places?placeTypeId=${item.id}`}>
                <Button type="button" variant="soft">
                  <Tags className="size-4" aria-hidden />
                  {t('placeTypes.managePlaces')}
                </Button>
              </Link>
            }
            onDelete={() =>
              confirmDelete({
                message: t('placeTypes.confirmDelete'),
                successMessage: t('placeTypes.deleted'),
                path: `/place-types/${item.id}`,
                queryKey: ['place-types'],
                onDeleted: () => navigate('/base-info/places/types'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
