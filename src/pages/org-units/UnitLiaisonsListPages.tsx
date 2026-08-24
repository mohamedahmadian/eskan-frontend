import { Send } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  PaginationBar,
  SearchBar,
  SortableTh,
  TableCard,
} from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import type { OrgUnitLiaisonPerson, Paginated } from '../../types/app'

function UnitLiaisonsListPage({
  kind,
}: {
  kind: 'accommodation' | 'caravan'
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { q, page, term, setTerm, setPage, setParams, searchParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)

  const i18nKey =
    kind === 'accommodation' ? 'unitAccommodationLiaisons' : 'unitCaravanLiaisons'
  const menuKey =
    kind === 'accommodation'
      ? 'menus.unitAccommodationLiaisons'
      : 'menus.unitCaravanLiaisons'
  const endpoint =
    kind === 'accommodation'
      ? '/org-units/my-accommodation-liaisons'
      : '/org-units/my-caravan-liaisons'
  const roleLabelPrefix =
    kind === 'accommodation' ? 'accommodations.contactRoles' : 'caravans.contactRoles'
  const queryKey = ['org-units', `my-${kind}-liaisons`, q, page, sortBy, sortDir]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<Paginated<OrgUnitLiaisonPerson>>(endpoint, {
        params: {
          page,
          ...(q ? { q } : {}),
          ...sortParams,
        },
      })
      return data
    },
  })

  const inviteSms = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        queued: true
        recipientCount: number
        unitsSent: number
      }>('/org-units/my-liaisons/invite-channels', { kind })
      return data
    },
    onSuccess: (data) => {
      toast.success(
        t('orgUnits.inviteSmsQueued', {
          count: formatNumber(data.recipientCount, locale),
        }),
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    },
  })

  function onSearch() {
    setParams({ q: term.trim() || undefined }, { resetPage: true })
  }

  function confirmInviteSms() {
    confirmToast({
      title: t(`${i18nKey}.confirmInviteSms`),
      confirmLabel: t('orgUnits.sendInviteSms'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        await inviteSms.mutateAsync()
      },
    })
  }

  const rows = query.data?.items ?? []
  const emptyMessage = q ? t(`${i18nKey}.noResults`) : t(`${i18nKey}.empty`)

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t(menuKey)}
        subtitle={t(`${i18nKey}.subtitle`)}
        action={
          <Button
            type="button"
            variant="soft"
            disabled={!rows.length || inviteSms.isPending}
            onClick={confirmInviteSms}
          >
            <Send className="size-4" aria-hidden />
            {t('orgUnits.sendInviteSms')}
          </Button>
        }
      />
      <SearchBar
        inputId={`${kind}-liaison-search`}
        term={term}
        onTermChange={setTerm}
        onSubmit={onSearch}
        label={t(`${i18nKey}.search`)}
        placeholder={t(`${i18nKey}.searchPlaceholder`)}
      />
      <TableCard loading={query.isLoading} empty={emptyMessage} hasRows={rows.length > 0} rowClick={false}>
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <SortableTh
                column="fullName"
                label={t('users.fullName')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="role"
                label={t(`${i18nKey}.role`)}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t(`${i18nKey}.place`)}</th>
              <SortableTh
                column="nationalId"
                label={t('users.nationalId')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                column="phone"
                label={t('users.phone')}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-start font-medium">{t(`${i18nKey}.unit`)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.fullName}</td>
                <td className="px-4 py-3">{t(`${roleLabelPrefix}.${item.role}`)}</td>
                <td className="px-4 py-3">{item.place?.name || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                  {item.nationalId ? localizeDigits(item.nationalId, locale) : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                  {item.phone ? localizeDigits(item.phone, locale) : '—'}
                </td>
                <td className="px-4 py-3">
                  {item.units?.map((unit) => unit.name).join('، ') || '—'}
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

export function UnitAccommodationLiaisonsPage() {
  return <UnitLiaisonsListPage kind="accommodation" />
}

export function UnitCaravanLiaisonsPage() {
  return <UnitLiaisonsListPage kind="caravan" />
}
