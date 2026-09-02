import { AlignLeft, Coins, UtensilsCrossed, Wheat } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { Food } from '../../types/app'

export function FoodDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['food', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Food>(`/foods/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('foods.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={UtensilsCrossed} />}
      />
      <FormCard icon={UtensilsCrossed} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={UtensilsCrossed} label={t('foods.name')} value={item.name} tone="teal" />
            <FormFactTile
              icon={Coins}
              label={t('foods.costPrice')}
              value={`${formatGroupedNumber(item.costPrice, locale)} ${t('foods.toman')}`}
              tone="mint"
            />
            <FormFactTile
              icon={Coins}
              label={t('foods.finalPrice')}
              value={`${formatGroupedNumber(item.finalPrice, locale)} ${t('foods.toman')}`}
              tone="ink"
            />
            {item.description ? (
              <FormFactTile
                icon={AlignLeft}
                label={t('foods.description')}
                value={<span className="whitespace-pre-wrap">{item.description}</span>}
                tone="teal"
                className="sm:col-span-2"
              />
            ) : null}
          </div>
          <FormSectionTitle icon={Wheat}>{t('foods.ingredients')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {item.ingredients.map((line) => (
              <FormFactTile
                key={line.id}
                icon={Wheat}
                label={line.ingredient.name}
                value={`${formatNumber(line.quantity, locale)} ${t(`ingredientUnits.${line.unit}`)} — ${formatGroupedNumber(line.cost, locale)} ${t('foods.toman')}`}
                tone="mint"
              />
            ))}
          </div>
          <DetailActions
            editTo={`/logistics/foods/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('foods.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('foods.confirmDelete'),
                successMessage: t('foods.deleted'),
                path: `/foods/${item.id}`,
                queryKey: ['foods'],
                onDeleted: () => navigate('/logistics/foods'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
