import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import {
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { PageHeader, listShellClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { UserLocationHistoryList } from '../../types/app'
import type { RoleUserScope } from '../users/user-scopes'
import { useLocationHistoryOverlays } from './locationHistoryMap'

export function LocationHistoryPage({
  apiPath,
  queryKey,
  titleKey = 'location.history',
}: {
  apiPath: string
  queryKey: unknown[]
  titleKey?: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const query = useQuery({
    queryKey: [...queryKey, q, page, sortBy, sortDir],
    enabled: Boolean(apiPath),
    queryFn: async () => {
      const { data } = await api.get<UserLocationHistoryList>(apiPath, {
        params: { q: q || undefined, page, ...sortParams },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const mapPoints = query.data?.mapPoints ?? []
  const overlays = useLocationHistoryOverlays(mapPoints)

  return (
    <div className={listShellClassName}>
      <PageHeader title={t(titleKey)} subtitle={t('location.historySubtitle')} />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('location.historySearch')}
        placeholder={t('location.historySearchPlaceholder')}
      />
      {mapPoints.length ? (
        <div className="mb-4">
          <OsmMapPicker
            variant="always"
            readOnly
            latitude=""
            longitude=""
            overlays={overlays}
            onChange={() => undefined}
            heightClass="h-72 sm:h-96"
          />
        </div>
      ) : query.isLoading || query.data?.total ? null : (
        <div className="mb-4 overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]">
          <div className="p-5 sm:p-6">
            <FormEmptyHint>
              {q ? t('location.historyNoResults') : t('location.historyEmpty')}
            </FormEmptyHint>
          </div>
        </div>
      )}
      <TableCard
        loading={query.isLoading}
        empty={q ? t('location.historyNoResults') : t('location.historyEmpty')}
        hasRows={rows.length > 0}
        rowClick={false}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="seq"
                label={t('location.historySeq')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="createdAt"
                label={t('location.historyRecordedAt')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="province"
                label={t('geo.province')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="city"
                label={t('geo.city')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="notes"
                label={t('location.notes')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{formatNumber(item.seq, locale)}</td>
                <td className="px-4 py-3">
                  <DateText value={item.createdAt} withTime />
                </td>
                <td className="px-4 py-3">{item.province ? geoName(item.province) : '—'}</td>
                <td className="px-4 py-3">{item.city ? geoName(item.city) : '—'}</td>
                <td className="px-4 py-3">{item.notes || '—'}</td>
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

export function MyLocationHistoryPage() {
  return (
    <LocationHistoryPage
      apiPath="/account/location-history"
      queryKey={['account', 'location-history']}
      titleKey="menus.myLocationHistory"
    />
  )
}

export function RoleUserLocationHistoryPage({ scope }: { scope: RoleUserScope }) {
  const { id } = useParams()
  if (!id) return null
  return (
    <LocationHistoryPage
      apiPath={`${scope.apiBase}/${id}/location-history`}
      queryKey={[scope.queryKey, id, 'location-history']}
    />
  )
}
