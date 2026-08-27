import { LogOut } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DateText } from '../../components/ui/DateText'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { confirmToast } from '../../components/ui/confirmToast'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { Paginated, PlacementDueItem } from '../../types/app'

export function PlacementVacatePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const queryClient = useQueryClient()
  const { q, page, term, setTerm, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)

  const query = useQuery({
    queryKey: ['placements', 'due', q, page, sortParams],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PlacementDueItem>>('/placements/due', {
        params: { page, ...(q ? { q } : {}), ...sortParams },
      })
      return data
    },
  })

  function vacateDue() {
    confirmToast({
      title: t('placements.confirmVacateDue'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          const { data } = await api.post<{ vacated: number }>('/placements/vacate-due')
          toast.success(t('placements.vacatedDueOk', { count: n(data.vacated) }))
          void queryClient.invalidateQueries({ queryKey: ['placements'] })
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const pageSize = query.data?.pageSize ?? 10

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('placements.vacate')}
        subtitle={t('placements.vacateSubtitle')}
        backTo="/placements"
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => setParams({ q: term.trim() || undefined }, { resetPage: true })}
        label={t('common.search')}
        placeholder={t('placements.searchPlaceholder')}
      />
      <TableCard
        loading={query.isLoading}
        empty={q ? t('placements.noResults') : t('placements.emptyDue')}
        hasRows={items.length > 0}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-start">{t('reservations.code')}</th>
              <SortableTh column="party" label={t('placements.party')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="text-start">{t('placements.accommodation')}</th>
              <SortableTh column="gender" label={t('placements.gender')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="headcount" label={t('placements.headcount')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableTh column="stayEndDate" label={t('reservations.stayEndDateShort')} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="text-start">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.reservation.code}</td>
                <td>{row.reservation.partyName}</td>
                <td>{row.accommodation.name}</td>
                <td>{t(`userGenders.${row.gender}`)}</td>
                <td>{n(row.headcount)}</td>
                <td>
                  {row.reservation.stayEndDate ? (
                    <DateText value={row.reservation.stayEndDate} />
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <EntityRowActions viewTo={`/placements/${row.reservation.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        startExtra={
          <Button type="button" variant="soft" onClick={vacateDue}>
            <LogOut className="size-4" aria-hidden />
            {t('placements.vacateDue')}
          </Button>
        }
      />
    </div>
  )
}
