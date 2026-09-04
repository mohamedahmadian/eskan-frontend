import { FileBadge2, HandCoins, Package, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TableCard } from '../../components/ui/ListControls'
import { Button, PageHeader, listShellClassName } from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'

type DataWipeEntityCode =
  | 'reservations'
  | 'contributions-cash'
  | 'contributions-in-kind'

type DataWipeEntity = {
  code: DataWipeEntityCode
  recordCount: number
}

const entityIcons = {
  reservations: FileBadge2,
  'contributions-cash': HandCoins,
  'contributions-in-kind': Package,
} as const

export function DataManagementPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [wipingCode, setWipingCode] = useState<DataWipeEntityCode | null>(null)

  const query = useQuery({
    queryKey: ['data-management'],
    queryFn: async () => {
      const { data } = await api.get<{ items: DataWipeEntity[] }>('/data-management')
      return data
    },
  })

  const rows = query.data?.items ?? []

  function entityName(code: DataWipeEntityCode) {
    return t(`dataManagement.entities.${code}`)
  }

  function wipeEntity(row: DataWipeEntity) {
    const name = entityName(row.code)
    confirmToast({
      title: t('dataManagement.confirmWipe', {
        name,
        count: formatNumber(row.recordCount, locale),
      }),
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        setWipingCode(row.code)
        try {
          const { data } = await api.delete<{ deleted: number }>(
            `/data-management/${row.code}`,
          )
          toast.success(
            t('dataManagement.wiped', {
              name,
              count: formatNumber(data.deleted, locale),
            }),
          )
          void queryClient.invalidateQueries({ queryKey: ['data-management'] })
          void queryClient.invalidateQueries({ queryKey: ['reservations'] })
          void queryClient.invalidateQueries({ queryKey: ['contributions'] })
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        } finally {
          setWipingCode(null)
        }
      },
    })
  }

  return (
    <div className={listShellClassName}>
      <PageHeader
        title={t('menus.dataManagement')}
        subtitle={t('dataManagement.subtitle')}
      />
      <TableCard
        loading={query.isLoading}
        empty={t('dataManagement.empty')}
        hasRows={rows.length > 0}
        rowClick={false}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">
                {t('dataManagement.entity')}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {t('dataManagement.description')}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {t('dataManagement.recordCount')}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const Icon = entityIcons[row.code]
              const busy = wipingCode === row.code
              return (
                <tr key={row.code} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-ink-900">
                      <Icon className="size-4 shrink-0 text-teal-600" aria-hidden />
                      {entityName(row.code)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {t(`dataManagement.descriptions.${row.code}`)}
                  </td>
                  <td className="px-4 py-3 text-ink-800">
                    {formatNumber(row.recordCount, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="danger"
                      disabled={busy || row.recordCount === 0}
                      onClick={() => wipeEntity(row)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {t('dataManagement.wipe')}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  )
}
