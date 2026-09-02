import { AlignLeft, CalendarRange, CookingPot, MapPin, Navigation, Phone, UserRound } from 'lucide-react'
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
import type { Restaurant } from '../../types/app'

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function NeshanValue({ value }: { value: string }) {
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
        className="break-all text-teal-700 hover:underline"
      >
        {value}
      </a>
    )
  }
  return <span dir="ltr">{value}</span>
}

export function RestaurantDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['restaurant', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Restaurant>(`/restaurants/${id}`)
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
        title={t('restaurants.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={CookingPot} />}
      />
      <FormCard icon={CookingPot} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={CookingPot}
              label={t('restaurants.name')}
              value={item.name}
              tone="teal"
            />
            <FormFactTile
              icon={UserRound}
              label={t('restaurants.managerName')}
              value={item.managerName || '—'}
              empty={!item.managerName}
              tone="mint"
            />
            <FormFactTile
              icon={Phone}
              label={t('restaurants.managerPhone')}
              copyValue={item.managerPhone}
              empty={!item.managerPhone}
              tone="ink"
            />
            {hasText(item.address) ? (
              <FormFactTile
                icon={MapPin}
                label={t('restaurants.address')}
                value={<span className="whitespace-pre-wrap">{item.address}</span>}
                tone="teal"
                className="sm:col-span-2"
              />
            ) : (
              <FormFactTile
                icon={MapPin}
                label={t('restaurants.address')}
                value="—"
                empty
                tone="teal"
                className="sm:col-span-2"
              />
            )}
            {hasText(item.neshanAddress) ? (
              <FormFactTile
                icon={Navigation}
                label={t('restaurants.neshanAddress')}
                value={<NeshanValue value={item.neshanAddress ?? ''} />}
                tone="mint"
                className="sm:col-span-2"
              />
            ) : (
              <FormFactTile
                icon={Navigation}
                label={t('restaurants.neshanAddress')}
                value="—"
                empty
                tone="mint"
                className="sm:col-span-2"
              />
            )}
            {hasText(item.description) ? (
              <FormFactTile
                icon={AlignLeft}
                label={t('restaurants.description')}
                value={<span className="whitespace-pre-wrap">{item.description}</span>}
                tone="ink"
                className="sm:col-span-2"
              />
            ) : (
              <FormFactTile
                icon={AlignLeft}
                label={t('restaurants.description')}
                value="—"
                empty
                tone="ink"
                className="sm:col-span-2"
              />
            )}
          </div>
          <DetailActions
            editTo={`/logistics/restaurants/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('restaurants.delete')}
            extra={
              <Link to={`/logistics/restaurant-meal-plans?restaurantId=${item.id}`}>
                <Button type="button" variant="soft">
                  <CalendarRange className="size-4" aria-hidden />
                  {t('restaurantMealPlans.manage')}
                </Button>
              </Link>
            }
            onDelete={() =>
              confirmDelete({
                message: t('restaurants.confirmDelete'),
                successMessage: t('restaurants.deleted'),
                path: `/restaurants/${item.id}`,
                queryKey: ['restaurants'],
                onDeleted: () => navigate('/logistics/restaurants'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
