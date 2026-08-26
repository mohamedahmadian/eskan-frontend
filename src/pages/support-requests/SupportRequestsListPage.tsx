import { Building, Download, Filter, HandHeart, Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { DateText } from '../../components/ui/DateText'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import type {
  GovernmentOrganization,
  Paginated,
  SupportRequest,
  SupportRequestStatus,
  SupportRequestType,
} from '../../types/app'
import { supportRequestStatuses, supportRequestTypes } from '../../types/app'
import { SupportRequestStatusBadge } from './SupportRequestStatusBadge'

export function SupportRequestsListPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const admin = isAdmin(user)
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const { confirmDelete } = useConfirmDelete()
  const [exporting, setExporting] = useState(false)
  const type = (searchParams.get('type') ?? '') as SupportRequestType | ''
  const status = (searchParams.get('status') ?? '') as SupportRequestStatus | ''
  const organizationId = searchParams.get('organizationId') ?? ''

  const organizations = useQuery({
    queryKey: ['government-organizations', 'lookup'],
    enabled: admin,
    queryFn: async () => {
      const { data } = await api.get<GovernmentOrganization[]>('/government-organizations')
      return data
    },
  })

  const query = useQuery({
    queryKey: [
      'support-requests',
      'list',
      q,
      type,
      status,
      organizationId,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<SupportRequest>>('/support-requests', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(type ? { type } : {}),
          ...(status ? { status } : {}),
          ...(admin && organizationId ? { organizationId } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  async function downloadExcel() {
    setExporting(true)
    try {
      const { data } = await api.get<Blob>('/support-requests/export', {
        params: {
          ...(term.trim() || q ? { q: term.trim() || q } : {}),
          ...(type ? { type } : {}),
          ...(status ? { status } : {}),
          ...(admin && organizationId ? { organizationId } : {}),
          ...sortParams,
        },
        responseType: 'blob',
      })
      const blob = data instanceof Blob ? data : new Blob([data])
      if (blob.type.includes('json')) {
        const text = await blob.text()
        const parsed = JSON.parse(text) as { message?: string }
        toast.error(parsed.message || t('common.error'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'support-requests.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(t('supportRequests.excelDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setExporting(false)
    }
  }

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(type || status || (admin && organizationId))
  const emptyMessage =
    q || filtersActive ? t('supportRequests.noResults') : t('supportRequests.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.supportRequests')}
        subtitle={t('supportRequests.subtitle')}
        action={
          <Link to="/support-requests/new">
            <Button>
              <Plus className="size-4" />
              {t('supportRequests.create')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="support-request-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('supportRequests.search')}
        placeholder={t('supportRequests.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <FilterPair columns={admin ? 3 : 2}>
            <FormField icon={Package} label={t('supportRequests.type')} htmlFor="support-request-type">
              <SearchSelect
                id="support-request-type"
                value={type}
                placeholder={t('supportRequests.allTypes')}
                onChange={(next) => setParams({ type: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('supportRequests.allTypes') },
                  ...Object.values(supportRequestTypes).map((value) => ({
                    value,
                    label: t(`supportRequests.types.${value}`),
                  })),
                ]}
              />
            </FormField>
            <FormField icon={Filter} label={t('supportRequests.status')} htmlFor="support-request-status">
              <SearchSelect
                id="support-request-status"
                value={status}
                placeholder={t('supportRequests.allStatuses')}
                onChange={(next) => setParams({ status: next || undefined }, { resetPage: true })}
                options={[
                  { value: '', label: t('supportRequests.allStatuses') },
                  ...Object.values(supportRequestStatuses).map((value) => ({
                    value,
                    label: t(`supportRequests.statuses.${value}`),
                  })),
                ]}
              />
            </FormField>
            {admin ? (
              <FormField
                icon={Building}
                label={t('supportRequests.organization')}
                htmlFor="support-request-org"
              >
                <SearchSelect
                  id="support-request-org"
                  value={organizationId}
                  placeholder={t('supportRequests.allOrganizations')}
                  onChange={(next) =>
                    setParams({ organizationId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('supportRequests.allOrganizations') },
                    ...(organizations.data ?? []).map((organization) => ({
                      value: organization.id,
                      label: organization.name,
                    })),
                  ]}
                />
              </FormField>
            ) : null}
          </FilterPair>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="requestedAt"
                label={t('supportRequests.requestedAt')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="organization"
                label={t('supportRequests.organization')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="type"
                label={t('supportRequests.type')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="subject"
                label={t('supportRequests.subject')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="status"
                label={t('supportRequests.status')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="handlingOrganization"
                label={t('supportRequests.handlingOrganization')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const canMutate = admin || item.status === 'PENDING'
              return (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <DateText value={item.requestedAt} />
                  </td>
                  <td className="px-4 py-3">{item.organization.name}</td>
                  <td className="px-4 py-3">{t(`supportRequests.types.${item.type}`)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <HandHeart className="size-4 text-teal-600" aria-hidden />
                      {item.subject}
                      {item.quantity != null ? (
                        <span className="text-ink-500">
                          ({formatNumber(item.quantity, locale)})
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SupportRequestStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">{item.handlingOrganization?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <EntityRowActions
                      viewTo={`/support-requests/${item.id}`}
                      editTo={canMutate ? `/support-requests/${item.id}/edit` : undefined}
                      onDelete={
                        canMutate
                          ? () =>
                              confirmDelete({
                                message: t('supportRequests.confirmDelete'),
                                successMessage: t('supportRequests.deleted'),
                                path: `/support-requests/${item.id}`,
                                queryKey: ['support-requests'],
                              })
                          : undefined
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableCard>
      <PaginationBar
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        startExtra={
          <Button type="button" variant="ghost" onClick={() => void downloadExcel()} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? t('supportRequests.downloadingExcel') : t('supportRequests.downloadExcel')}
          </Button>
        }
      />
    </div>
  )
}
