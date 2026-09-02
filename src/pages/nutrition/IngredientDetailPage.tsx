import { AlignLeft, Coins, Scale, UtensilsCrossed, Warehouse, Wheat } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatGroupedNumber, formatGroupedQuantity, formatNumber } from '../../lib/datetime'
import { displayStockQty, displayStockUnit } from '../../lib/nutrition-units'
import type { Ingredient } from '../../types/app'

export function IngredientDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['ingredient', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Ingredient>(`/ingredients/${id}`)
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
        title={t('ingredients.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Wheat} />}
      />
      <FormCard icon={Wheat} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={Wheat} label={t('ingredients.name')} value={item.name} tone="teal" />
            <FormFactTile
              icon={Scale}
              label={t('ingredients.unit')}
              value={t(`ingredientUnits.${item.unit}`)}
              tone="mint"
            />
            <FormFactTile
              icon={Coins}
              label={t('ingredients.pricePerUnit')}
              value={`${formatGroupedNumber(item.pricePerUnit, locale)} ${t('ingredients.toman')}`}
              tone="ink"
            />
            <FormFactTile
              icon={Warehouse}
              label={t('ingredients.stockQty')}
              value={`${formatGroupedQuantity(displayStockQty(item.stockQty, item.unit), locale)} ${t(`ingredientUnits.${displayStockUnit(item.unit)}`)}`}
              tone="teal"
            />
            <FormFactTile
              icon={UtensilsCrossed}
              label={t('ingredients.foodsCount')}
              value={formatNumber(item.foodsCount, locale)}
              tone="mint"
            />
            {item.description ? (
              <FormFactTile
                icon={AlignLeft}
                label={t('ingredients.description')}
                value={<span className="whitespace-pre-wrap">{item.description}</span>}
                tone="ink"
                className="sm:col-span-2"
              />
            ) : null}
          </div>
          <DetailActions
            editTo={`/logistics/ingredients/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('ingredients.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('ingredients.confirmDelete'),
                successMessage: t('ingredients.deleted'),
                path: `/ingredients/${item.id}`,
                queryKey: ['ingredients'],
                onDeleted: () => navigate('/logistics/ingredients'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
