import { Filter, Plus, Wheat } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatGroupedNumber, formatGroupedQuantity } from '../../lib/datetime'
import { displayStockQty, displayStockUnit, ingredientUnits } from '../../lib/nutrition-units'
import type { Ingredient, Paginated } from '../../types/app'

export function IngredientsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const unit = searchParams.get('unit') ?? ''

  const query = useQuery({
    queryKey: ['ingredients', 'list', q, unit, page, sortBy, sortDir],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Ingredient>>('/ingredients', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(unit ? { unit } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q || unit ? t('ingredients.noResults') : t('ingredients.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.ingredientManagement')}
        subtitle={t('ingredients.subtitle')}
        action={
          <Link to="/logistics/ingredients/new">
            <Button>
              <Plus className="size-4" />
              {t('ingredients.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="ingredient-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('ingredients.search')}
        placeholder={t('ingredients.searchPlaceholder')}
        filtersActive={Boolean(unit)}
        extra={
          <FilterPair>
            <FormField icon={Filter} label={t('ingredients.unit')} htmlFor="ingredient-unit-filter">
              <SearchSelect
                id="ingredient-unit-filter"
                value={unit}
                placeholder={t('ingredients.allUnits')}
                onChange={(next) => setParams({ unit: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('ingredients.allUnits') },
                  ...ingredientUnits.map((item) => ({
                    value: item,
                    label: t(`ingredientUnits.${item}`),
                  })),
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh column="name" label={t('ingredients.name')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="unit" label={t('ingredients.unit')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh
                column="pricePerUnit"
                label={t('ingredients.pricePerUnit')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="stockQty"
                label={t('ingredients.stockQty')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Wheat className="size-4 text-teal-600" aria-hidden />
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3">{t(`ingredientUnits.${item.unit}`)}</td>
                <td className="px-4 py-3">
                  {formatGroupedNumber(item.pricePerUnit, locale)} {t('ingredients.toman')}
                </td>
                <td className="px-4 py-3">
                  {formatGroupedQuantity(displayStockQty(item.stockQty, item.unit), locale)}{' '}
                  {t(`ingredientUnits.${displayStockUnit(item.unit)}`)}
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/logistics/ingredients/${item.id}`}
                    editTo={`/logistics/ingredients/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('ingredients.confirmDelete'),
                        successMessage: t('ingredients.deleted'),
                        path: `/ingredients/${item.id}`,
                        queryKey: ['ingredients'],
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {query.data ? (
        <PaginationBar
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}
