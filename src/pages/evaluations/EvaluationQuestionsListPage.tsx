import { Filter, Plus } from 'lucide-react'
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
import {
  EVALUATION_EVALUATOR_TYPES,
  EVALUATION_TARGET_TYPES,
} from '../../lib/evaluations'
import { formatNumber } from '../../lib/datetime'
import type { EvaluationQuestion, Paginated } from '../../types/app'

export function EvaluationQuestionsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const evaluatorType = searchParams.get('evaluatorType') ?? ''
  const targetType = searchParams.get('targetType') ?? ''
  const isActive = searchParams.get('isActive') ?? ''

  const query = useQuery({
    queryKey: [
      'evaluation-questions',
      'list',
      q,
      evaluatorType,
      targetType,
      isActive,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<EvaluationQuestion>>('/evaluation-questions', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(evaluatorType ? { evaluatorType } : {}),
          ...(targetType ? { targetType } : {}),
          ...(isActive ? { isActive } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.evaluationQuestions')}
        subtitle={t('evaluations.questions.subtitle')}
        action={
          <Link to="/evaluations/questions/new">
            <Button>
              <Plus className="size-4" />
              {t('evaluations.questions.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="question-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('common.search')}
        placeholder={t('evaluations.questions.searchPlaceholder')}
        filtersActive={Boolean(evaluatorType || targetType || isActive)}
        extra={
          <FilterPair columns={3}>
            <FormField icon={Filter} label={t('evaluations.evaluatorType')} htmlFor="q-evaluator">
              <SearchSelect
                id="q-evaluator"
                value={evaluatorType}
                placeholder={t('evaluations.allEvaluatorTypes')}
                onChange={(next) =>
                  setParams({ evaluatorType: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allEvaluatorTypes') },
                  ...EVALUATION_EVALUATOR_TYPES.map((type) => ({
                    value: type,
                    label: t(`evaluations.evaluatorTypes.${type}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('evaluations.targetType')} htmlFor="q-target">
              <SearchSelect
                id="q-target"
                value={targetType}
                placeholder={t('evaluations.allTargetTypes')}
                onChange={(next) =>
                  setParams({ targetType: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allTargetTypes') },
                  ...EVALUATION_TARGET_TYPES.map((type) => ({
                    value: type,
                    label: t(`evaluations.targetTypes.${type}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('evaluations.questions.isActive')} htmlFor="q-active">
              <SearchSelect
                id="q-active"
                value={isActive}
                placeholder={t('evaluations.allStatuses')}
                onChange={(next) =>
                  setParams({ isActive: next || undefined }, { resetPage: true })
                }
                options={[
                  { value: '', label: t('evaluations.allStatuses') },
                  { value: 'true', label: t('geo.active') },
                  { value: 'false', label: t('geo.inactive') },
                ]}
              />
            </FormField>
          </FilterPair>
        }
      />
      <TableCard
        loading={query.isLoading}
        empty={
          q || evaluatorType || targetType || isActive
            ? t('common.noResults')
            : t('evaluations.questions.empty')
        }
        hasRows={rows.length > 0}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line text-start text-ink-600">
              <SortableTh
                label={t('evaluations.questions.title')}
                column="title"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.evaluatorType')}
                column="evaluatorType"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.targetType')}
                column="targetType"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.questions.sortOrder')}
                column="sortOrder"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label={t('evaluations.questions.isActive')}
                column="isActive"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-b border-line/70 last:border-0">
                <td className="px-3 py-2.5 font-medium text-ink-900">{item.title}</td>
                <td className="px-3 py-2.5">
                  {t(`evaluations.evaluatorTypes.${item.evaluatorType}`)}
                </td>
                <td className="px-3 py-2.5">
                  {t(`evaluations.targetTypes.${item.targetType}`)}
                </td>
                <td className="px-3 py-2.5">
                  {formatNumber(item.sortOrder, locale)}
                </td>
                <td className="px-3 py-2.5">
                  {item.isActive ? t('geo.active') : t('geo.inactive')}
                </td>
                <td className="px-3 py-2.5">
                  <EntityRowActions
                    viewTo={`/evaluations/questions/${item.id}`}
                    editTo={`/evaluations/questions/${item.id}/edit`}
                    onDelete={() =>
                      confirmDelete({
                        message: t('evaluations.questions.confirmDelete'),
                        successMessage: t('evaluations.questions.deleted'),
                        path: `/evaluation-questions/${item.id}`,
                        queryKey: ['evaluation-questions'],
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={(next) => setParams({ page: String(next) })}
      />
    </div>
  )
}
