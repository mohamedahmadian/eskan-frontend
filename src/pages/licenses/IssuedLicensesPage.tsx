import { Ban, CalendarDays, CheckCircle2, Filter, Plus, Tent, UserRound } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  EntityRowActions,
  FilterPair,
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, FormField, PageHeader, listShellClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { confirmToast } from '../../components/ui/confirmToast'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatDate, formatTime } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import {
  issuedLicenseStatuses,
  type Caravan,
  type IssuedLicense,
  type ManagedUser,
  type Paginated,
} from '../../types/app'
import { IssuedLicenseStatusBadge } from './license-ui'

export function IssuedLicensesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const canApprove = isAdmin(user)
  const queryClient = useQueryClient()
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy: urlSortBy, sortDir: urlSortDir, onSort } = useListSort(
    searchParams,
    setParams,
  )
  // پیش‌فرض: تاریخ صدور نزولی (تا وقتی کاربر مرتب‌سازی دیگری انتخاب نکرده)
  const sortBy = urlSortBy || 'issuedAt'
  const sortDir =
    urlSortBy && (urlSortDir === 'asc' || urlSortDir === 'desc')
      ? urlSortDir
      : 'desc'
  const sortParams = { sortBy, sortDir }
  const status = searchParams.get('status') ?? ''
  const caravanId = searchParams.get('caravanId') ?? ''
  const managerUserId = searchParams.get('managerUserId') ?? ''
  const issuedAt = searchParams.get('issuedAt') ?? ''

  const managers = useQuery({
    queryKey: ['caravan-managers', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/caravan-managers')
      return data
    },
  })

  const caravans = useQuery({
    queryKey: ['caravans', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Caravan>>('/caravans', {
        params: { pageSize: 100 },
      })
      return data.items
    },
  })

  const query = useQuery({
    queryKey: [
      'issued-licenses',
      'list',
      q,
      status,
      caravanId,
      managerUserId,
      issuedAt,
      page,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<Paginated<IssuedLicense>>('/issued-licenses', {
        params: {
          page,
          ...(q ? { q } : {}),
          ...(status ? { status } : {}),
          ...(caravanId ? { caravanId } : {}),
          ...(managerUserId ? { managerUserId } : {}),
          ...(issuedAt ? { issuedAt } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  function approve(item: IssuedLicense) {
    confirmToast({
      title: t('licenses.confirmApprove'),
      confirmLabel: t('licenses.yesApprove'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await api.post(`/issued-licenses/${item.id}/approve`)
          await queryClient.invalidateQueries({ queryKey: ['issued-licenses'] })
          toast.success(t('licenses.approved'))
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  function revoke(item: IssuedLicense) {
    confirmToast({
      title: t('licenses.confirmRevoke'),
      confirmLabel: t('licenses.yesRevoke'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.post(`/issued-licenses/${item.id}/revoke`)
          await queryClient.invalidateQueries({ queryKey: ['issued-licenses'] })
          toast.success(t('licenses.revoked'))
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  const rows = query.data?.items ?? []
  const filtersActive = Boolean(status || caravanId || managerUserId || issuedAt)
  const emptyMessage = q || filtersActive ? t('licenses.noResults') : t('licenses.empty')

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.issuedLicenses')}
        subtitle={t('licenses.issuedSubtitle')}
        action={
          <Link to="/licenses/new">
            <Button>
              <Plus className="size-4" />
              {t('menus.issueLicense')}
            </Button>
          </Link>
        }
      />
      <SearchBar
        inputId="issued-license-search"
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t('common.search')}
        placeholder={t('licenses.searchPlaceholder')}
        filtersActive={filtersActive}
        extra={
          <>
            <FilterPair>
              <FormField icon={Tent} label={t('licenses.caravan')} htmlFor="license-caravan">
                <SearchSelect
                  id="license-caravan"
                  value={caravanId}
                  placeholder={t('licenses.allCaravans')}
                  onChange={(next) =>
                    setParams({ caravanId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('licenses.allCaravans') },
                    ...(caravans.data ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    })),
                  ]}
                />
              </FormField>
              <FormField
                icon={UserRound}
                label={t('caravans.manager')}
                htmlFor="license-manager"
              >
                <SearchSelect
                  id="license-manager"
                  value={managerUserId}
                  placeholder={t('licenses.allManagers')}
                  onChange={(next) =>
                    setParams({ managerUserId: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('licenses.allManagers') },
                    ...(managers.data ?? []).map((manager) => ({
                      value: manager.id,
                      label: manager.fullName,
                    })),
                  ]}
                />
              </FormField>
            </FilterPair>
            <FilterPair>
              <FormField
                icon={CalendarDays}
                label={t('licenses.issuedAt')}
                htmlFor="license-issued-at"
              >
                <PersianDateField
                  id="license-issued-at"
                  value={issuedAt || undefined}
                  onChange={(next) =>
                    setParams({ issuedAt: next || undefined }, { resetPage: true })
                  }
                />
              </FormField>
              <FormField icon={Filter} label={t('users.status')} htmlFor="license-status">
                <SearchSelect
                  id="license-status"
                  value={status}
                  placeholder={t('licenses.allStatuses')}
                  onChange={(next) =>
                    setParams({ status: next || undefined }, { resetPage: true })
                  }
                  options={[
                    { value: '', label: t('licenses.allStatuses') },
                    ...Object.values(issuedLicenseStatuses).map((value) => ({
                      value,
                      label: t(`licenses.statuses.${value}`),
                    })),
                  ]}
                />
              </FormField>
            </FilterPair>
          </>
        }
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="issuedAt"
                label={t('licenses.issuedAt')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="manager"
                label={t('caravans.manager')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="caravan"
                label={t('caravans.name')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="status"
                label={t('users.status')}
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
                  <span className="inline-flex items-baseline gap-2 whitespace-nowrap" dir="ltr">
                    <span>{formatDate(item.issuedAt, locale)}</span>
                    <span>{formatTime(item.createdAt, locale)}</span>
                  </span>
                </td>
                <td className="px-4 py-3">{item.manager.fullName}</td>
                <td className="px-4 py-3">{item.caravan.name}</td>
                <td className="px-4 py-3">
                  <IssuedLicenseStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <EntityRowActions
                    viewTo={`/licenses/issued/${item.id}`}
                    extra={
                      <>
                        {canApprove && item.status === 'ISSUED' ? (
                          <Button
                            type="button"
                            variant="soft"
                            onClick={() => approve(item)}
                          >
                            <CheckCircle2 className="size-4" aria-hidden />
                            {t('licenses.approve')}
                          </Button>
                        ) : null}
                        {item.status !== 'REVOKED' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => revoke(item)}
                          >
                            <Ban className="size-4" aria-hidden />
                            {t('licenses.revoke')}
                          </Button>
                        ) : null}
                      </>
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
