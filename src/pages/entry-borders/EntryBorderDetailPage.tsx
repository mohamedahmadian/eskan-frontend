import { AlignLeft, Fence, Flag, MapPin, MapPinned, Route, ToggleRight, Type } from 'lucide-react'
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
import {
  FormCard,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { EntryBorder } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function EntryBorderDetailPage() {
  const { t } = useTranslation()
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['entry-border', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<EntryBorder>(`/entry-borders/${id}`)
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
        title={t('entryBorders.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Fence} />}
      />
      <FormCard icon={Fence} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={Fence}>{t('entryBorders.info')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={Type}
              label={t('entryBorders.name')}
              value={item.name}
              tone="teal"
            />
            <FormFactTile
              icon={Flag}
              label={t('entryBorders.neighboringCountry')}
              value={name(item.neighboringCountry)}
              tone="mint"
            />
            <FormFactTile
              icon={MapPinned}
              label={t('geo.province')}
              value={name(item.province)}
              tone="teal"
            />
            <FormFactTile
              icon={MapPin}
              label={t('geo.city')}
              value={name(item.city)}
              tone="mint"
            />
            <FormFactTile
              icon={Fence}
              label={t('entryBorders.borderType')}
              value={t(`entryBorders.types.${item.borderType}`)}
              tone="teal"
            />
            <FormFactTile
              icon={ToggleRight}
              label={t('geo.isActive')}
              value={<GeoStatus active={item.isActive} />}
              tone="mint"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('entryBorders.description')}
              value={item.description || '—'}
              tone="ink"
              className="sm:col-span-2"
            />
          </div>
          <DetailActions
            editTo={`/base-info/entry-borders/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('entryBorders.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('entryBorders.confirmDelete'),
                successMessage: t('entryBorders.deleted'),
                path: `/entry-borders/${item.id}`,
                queryKey: ['entry-borders'],
                onDeleted: () => navigate('/base-info/entry-borders'),
              })
            }
            extra={
              <Link to={`/base-info/walking-routes?entryBorderId=${item.id}`}>
                <Button type="button" variant="soft">
                  <Route className="size-4" aria-hidden />
                  {t('entryBorders.manageWalkingRoutes')}
                </Button>
              </Link>
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
