import {
  AlignLeft,
  Landmark,
  MapPin,
  MapPinned,
  Phone,
  Tags,
} from 'lucide-react'
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
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { Place } from '../../types/app'
import { PlaceTypeIcon } from '../place-types/PlaceTypeForm'

export function PlaceDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['place', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Place>(`/places/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const empty = '—'
  const hasCoords = item.latitude != null && item.longitude != null

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('places.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Landmark} />}
      />
      <FormCard icon={Landmark} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Landmark}
              label={t('places.name')}
              value={item.name}
              tone="teal"
            />
            <FormFactTile
              icon={Tags}
              label={t('places.placeType')}
              value={
                <span className="inline-flex items-center gap-2">
                  <PlaceTypeIcon name={item.placeType.icon} className="size-4 text-teal-600" />
                  {name(item.placeType)}
                </span>
              }
              tone="mint"
            />
            <FormFactTile
              icon={MapPinned}
              label={t('geo.province')}
              value={name(item.province)}
              tone="ink"
            />
            <FormFactTile icon={MapPin} label={t('geo.city')} value={name(item.city)} tone="teal" />
            <FormFactTile
              icon={Phone}
              label={t('places.phone')}
              copyValue={item.phone}
              empty={!item.phone}
              tone="mint"
            />
            <FormFactTile
              icon={MapPin}
              label={t('places.address')}
              value={item.address || empty}
              empty={!item.address}
              tone="ink"
              className="sm:col-span-2"
            />
            {hasText(item.neshanAddress) ? (
              <FormFactTile
                icon={MapPinned}
                label={t('geo.neshanAddress')}
                value={item.neshanAddress}
                tone="teal"
                className="sm:col-span-2"
              />
            ) : null}
            {hasText(item.description) ? (
              <FormFactTile
                icon={AlignLeft}
                label={t('places.description')}
                value={<span className="whitespace-pre-wrap">{item.description}</span>}
                empty={!item.description}
                tone="mint"
                className="sm:col-span-2"
              />
            ) : null}
          </div>
          {hasCoords ? (
            <div className="space-y-2">
              <FormSectionTitle icon={MapPinned}>{t('places.location')}</FormSectionTitle>
              <OsmMapPicker
                latitude={String(item.latitude)}
                longitude={String(item.longitude)}
                onChange={() => undefined}
                variant="always"
                readOnly
                heightClass="h-64"
              />
            </div>
          ) : null}
          <DetailActions
            editTo={`/base-info/places/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('places.delete')}
            extra={
              <Link to="/base-info/places/types">
                <Button type="button" variant="soft">
                  <Tags className="size-4" aria-hidden />
                  {t('places.manageTypes')}
                </Button>
              </Link>
            }
            onDelete={() =>
              confirmDelete({
                message: t('places.confirmDelete'),
                successMessage: t('places.deleted'),
                path: `/places/${item.id}`,
                queryKey: ['places'],
                onDeleted: () => navigate('/base-info/places'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}
