import { ListOrdered, Map as MapIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { confirmToast } from '../../components/ui/confirmToast'
import { DateText } from '../../components/ui/DateText'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { LocationSource, UserLocationHistoryList } from '../../types/app'
import type { RoleUserScope } from '../users/user-scopes'
import { useLocationHistoryOverlays } from './locationHistoryMap'

const sources: LocationSource[] = ['MANUAL', 'APP', 'STATION']

export function LocationHistoryPage({
  apiPath,
  queryKey,
  titleKey = 'location.history',
  canDelete = false,
}: {
  apiPath: string
  queryKey: unknown[]
  titleKey?: string
  canDelete?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const queryClient = useQueryClient()
  const { confirmDelete } = useConfirmDelete()
  const [tab, setTab] = useState<'map' | 'table'>('map')
  const { q, page, term, setTerm, applySearch, setPage, searchParams, setParams } =
    useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const source = (searchParams.get('source') ?? '') as LocationSource | ''
  const query = useQuery({
    queryKey: [...queryKey, q, page, sortBy, sortDir, source],
    enabled: Boolean(apiPath),
    queryFn: async () => {
      const { data } = await api.get<UserLocationHistoryList>(apiPath, {
        params: {
          q: q || undefined,
          page,
          source: source || undefined,
          ...sortParams,
        },
      })
      return data
    },
  })

  const rows = query.data?.items ?? []
  const mapPoints = query.data?.mapPoints ?? []
  const overlays = useLocationHistoryOverlays(mapPoints)
  const empty = q || source ? t('location.historyNoResults') : t('location.historyEmpty')
  const total = query.data?.total ?? 0

  function deleteOne(id: string) {
    confirmDelete({
      message: t('location.confirmDeleteHistory'),
      successMessage: t('location.historyDeleted'),
      path: `${apiPath}/${id}`,
      queryKey: ['account'],
      onDeleted: () => {
        if (rows.length === 1 && page > 1) {
          setPage(page - 1)
        }
      },
    })
  }

  function deleteAll() {
    confirmToast({
      title: t('location.confirmDeleteAllHistory'),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(apiPath)
          toast.success(t('location.allHistoryDeleted'))
          if (page > 1) {
            setPage(1)
          }
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
          return
        }
        void queryClient.invalidateQueries({ queryKey: ['account'] })
      },
    })
  }

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t(titleKey)}
        subtitle={t('location.historySubtitle')}
        action={
          canDelete && total > 0 ? (
            <Button type="button" variant="danger" onClick={deleteAll}>
              <Trash2 className="size-4" aria-hidden />
              {t('location.deleteAllHistory')}
            </Button>
          ) : undefined
        }
      />
      <SearchBar
        term={term}
        onTermChange={setTerm}
        onSubmit={() => applySearch()}
        label={t('location.historySearch')}
        placeholder={t('location.historySearchPlaceholder')}
        filtersActive={Boolean(source)}
        extra={
          <FormField icon={MapIcon} label={t('location.historySource')} htmlFor="location-source">
            <SearchSelect
              id="location-source"
              value={source}
              placeholder={t('location.allSources')}
              onChange={(next) => setParams({ source: next || undefined }, { resetPage: true })}
              options={[
                { value: '', label: t('location.allSources') },
                ...sources.map((item) => ({
                  value: item,
                  label: t(`location.sources.${item}`),
                })),
              ]}
            />
          </FormField>
        }
      />

      <nav className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-1.5">
        {(
          [
            { id: 'map' as const, icon: MapIcon, label: t('location.tabMap') },
            { id: 'table' as const, icon: ListOrdered, label: t('location.tabTable') },
          ]
        ).map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                  : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
              }`}
            >
              <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
              {item.label}
            </button>
          )
        })}
      </nav>

      {tab === 'map' ? (
        mapPoints.length ? (
          <OsmMapPicker
            variant="always"
            readOnly
            latitude=""
            longitude=""
            overlays={overlays}
            onChange={() => undefined}
            heightClass="h-80 sm:h-[28rem]"
          />
        ) : (
          <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_10px_30px_rgba(20,40,40,0.05)]">
            <div className="p-5 sm:p-6">
              <FormEmptyHint>{query.isLoading ? t('common.loading') : empty}</FormEmptyHint>
            </div>
          </div>
        )
      ) : (
        <>
          <TableCard
            loading={query.isLoading}
            empty={empty}
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
                    column="source"
                    label={t('location.historySource')}
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
                  <th className="px-4 py-3 text-start font-medium">{t('location.historyCoords')}</th>
                  <SortableTh
                    column="notes"
                    label={t('location.notes')}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                  {canDelete ? (
                    <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3">{formatNumber(item.seq, locale)}</td>
                    <td className="px-4 py-3">
                      <DateText value={item.createdAt} withTime />
                    </td>
                    <td className="px-4 py-3">
                      {t(`location.sources.${item.source ?? 'MANUAL'}`)}
                    </td>
                    <td className="px-4 py-3">{item.province ? geoName(item.province) : '—'}</td>
                    <td className="px-4 py-3">{item.city ? geoName(item.city) : '—'}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {item.latitude != null && item.longitude != null
                        ? `${formatNumber(item.latitude, locale)} ، ${formatNumber(item.longitude, locale)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">{item.notes || '—'}</td>
                    {canDelete ? (
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          icon
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label={t('common.delete')}
                          title={t('common.delete')}
                          onClick={() => deleteOne(item.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </td>
                    ) : null}
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
        </>
      )}
    </div>
  )
}

export function MyLocationHistoryPage() {
  return (
    <LocationHistoryPage
      apiPath="/account/location-history"
      queryKey={['account', 'location-history']}
      titleKey="menus.myLocationHistory"
      canDelete
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
