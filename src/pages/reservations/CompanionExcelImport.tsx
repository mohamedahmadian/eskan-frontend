import { FileSpreadsheet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { confirmToast } from '../../components/ui/confirmToast'
import { FileDropField } from '../../components/ui/FileDropField'
import { Button, cardClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import type { MemberImportPreview, MemberImportPreviewRow } from '../../types/app'

async function downloadBlob(blob: Blob, filename: string, errorLabel: string) {
  if (blob.type.includes('json')) {
    const parsed = JSON.parse(await blob.text()) as { message?: string }
    throw new Error(parsed.message || errorLabel)
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function isSelectable(row: MemberImportPreviewRow) {
  return row.status === 'VALID' && row.userState !== 'ALREADY_MEMBER'
}

export function CompanionExcelImport({
  reservationId,
  onImported,
}: {
  reservationId: string
  onImported: () => void
}) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dropKey, setDropKey] = useState(0)
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<MemberImportPreview | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const selectedRows = useMemo(
    () => preview?.rows.filter((row) => selected.includes(row.nationalId)) ?? [],
    [preview, selected],
  )
  const selectedMale = selectedRows.filter((row) => row.gender === 'MALE').length
  const selectedFemale = selectedRows.filter((row) => row.gender === 'FEMALE').length
  const overflow =
    Boolean(preview) &&
    (selectedMale > (preview?.remainingMale ?? 0) ||
      selectedFemale > (preview?.remainingFemale ?? 0))

  async function previewFile(next: File) {
    setFile(next)
    setChecking(true)
    setPreview(null)
    setSelected([])
    try {
      const body = new FormData()
      body.append('file', next)
      const { data } = await api.post<MemberImportPreview>(
        `/reservations/${reservationId}/members/import/preview`,
        body,
      )
      setPreview(data)
      setSelected(
        data.rows.filter(isSelectable).map((row) => row.nationalId).filter(Boolean),
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
      setFile(null)
      setDropKey((value) => value + 1)
    } finally {
      setChecking(false)
    }
  }

  async function downloadTemplate() {
    try {
      const { data } = await api.get<Blob>(
        `/reservations/${reservationId}/members/import-template`,
        { responseType: 'blob' },
      )
      await downloadBlob(data, 'companions-template.xlsx', t('common.error'))
      toast.success(t('reservations.excelTemplateDownloaded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getApiErrorMessage(error, t('common.error')))
    }
  }

  async function downloadErrors() {
    if (!file) return
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post<Blob>(
        `/reservations/${reservationId}/members/import/errors`,
        body,
        { responseType: 'blob' },
      )
      await downloadBlob(data, 'companion-import-errors.xlsx', t('common.error'))
      toast.success(t('reservations.excelErrorsDownloaded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getApiErrorMessage(error, t('common.error')))
    }
  }

  function confirmImport() {
    if (!file || !selected.length) {
      toast.error(t('reservations.excelNoneSelected'))
      return
    }
    if (overflow) {
      toast.error(t('reservations.excelOverflow'))
      return
    }
    const existing = selectedRows.filter((row) => row.userState === 'EXISTING').length
    const created = selectedRows.filter((row) => row.userState === 'NEW').length
    confirmToast({
      title: `${t('reservations.excelReady', { count: n(selected.length) })}. ${t('reservations.excelExistingCount', { count: n(existing) })}. ${t('reservations.excelNewCount', { count: n(created) })}`,
      confirmLabel: t('reservations.excelConfirmImport', { count: n(selected.length) }),
      cancelLabel: t('common.cancel'),
      onConfirm: () => void runImport(),
    })
  }

  async function runImport() {
    if (!file) return
    setImporting(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('nationalIds', JSON.stringify(selected))
      await api.post(`/reservations/${reservationId}/members/import`, body)
      toast.success(t('reservations.excelImported'))
      await queryClient.invalidateQueries({
        queryKey: ['reservations', reservationId, 'previous-members'],
      })
      setFile(null)
      setPreview(null)
      setSelected([])
      setDropKey((value) => value + 1)
      onImported()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setImporting(false)
    }
  }

  function toggle(row: MemberImportPreviewRow, checked: boolean) {
    if (!isSelectable(row)) return
    setSelected((current) =>
      checked
        ? [...new Set([...current, row.nationalId])]
        : current.filter((item) => item !== row.nationalId),
    )
  }

  return (
    <div className={`${cardClassName} p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-900">{t('reservations.excelImport')}</p>
        <Button type="button" variant="ghost" onClick={() => setOpen((value) => !value)}>
          {open ? t('reservations.previousHide') : t('reservations.excelSelectFile')}
        </Button>
      </div>
      {open ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-ink-600">{t('reservations.excelImportHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="soft" onClick={() => void downloadTemplate()}>
              <FileSpreadsheet className="size-4" aria-hidden />
              {t('reservations.excelDownloadTemplate')}
            </Button>
          </div>
          <FileDropField
            key={dropKey}
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            allowCamera={false}
            maxBytes={2 * 1024 * 1024}
            uploading={checking}
            onFile={(next) => void previewFile(next)}
            onClear={() => {
              setFile(null)
              setPreview(null)
              setSelected([])
            }}
          />
          {checking ? <p className="text-sm text-ink-500">{t('reservations.excelChecking')}</p> : null}
          {preview ? (
            <div className="space-y-3 text-sm">
              <p>{t('reservations.excelTotal', { count: n(preview.total) })}</p>
              <p className="text-teal-700">{t('reservations.excelValid', { count: n(preview.valid) })}</p>
              <p className="text-amber-800">{t('reservations.excelInvalid', { count: n(preview.invalid) })}</p>
              <p className="text-red-700">{t('reservations.excelDuplicate', { count: n(preview.duplicate) })}</p>
              <p>
                {t('reservations.excelGenderSummary', {
                  male: n(preview.maleCount),
                  female: n(preview.femaleCount),
                  total: n(preview.maleCount + preview.femaleCount),
                })}
              </p>
              <p>
                {t('reservations.excelRemaining', {
                  male: n(preview.remainingMale),
                  female: n(preview.remainingFemale),
                })}
              </p>
              {preview.invalid + preview.duplicate > 0 ? (
                <Button type="button" variant="ghost" onClick={() => void downloadErrors()}>
                  {t('reservations.excelDownloadErrors')}
                </Button>
              ) : null}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-3 py-2 text-start">{t('common.actions')}</th>
                      <th className="px-3 py-2 text-start">{t('reservations.excelRow')}</th>
                      <th className="px-3 py-2 text-start">{t('users.nationalId')}</th>
                      <th className="px-3 py-2 text-start">{t('users.firstName')}</th>
                      <th className="px-3 py-2 text-start">{t('users.lastName')}</th>
                      <th className="px-3 py-2 text-start">{t('users.gender')}</th>
                      <th className="px-3 py-2 text-start">{t('reservations.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.nationalId}`} className="border-t border-line">
                        <td className="px-3 py-2">
                          <CheckboxField
                            compact
                            checked={selected.includes(row.nationalId)}
                            disabled={!isSelectable(row)}
                            onChange={(checked) => toggle(row, checked)}
                            label={t('reservations.excelConfirmImport', { count: 1 })}
                          />
                        </td>
                        <td className="px-3 py-2">{n(row.rowNumber)}</td>
                        <td className="px-3 py-2" dir="ltr">
                          {row.nationalId || '—'}
                        </td>
                        <td className="px-3 py-2">{row.firstName || '—'}</td>
                        <td className="px-3 py-2">{row.lastName || '—'}</td>
                        <td className="px-3 py-2">
                          {row.gender ? t(`userGenders.${row.gender}`) : row.genderText || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <RowStatus row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {preview.rows.map((row) => (
                  <div key={`${row.rowNumber}-${row.nationalId}`} className="rounded-2xl border border-line p-3">
                    <CheckboxField
                      checked={selected.includes(row.nationalId)}
                      disabled={!isSelectable(row)}
                      onChange={(checked) => toggle(row, checked)}
                      label={`${row.firstName} ${row.lastName}`.trim() || row.nationalId}
                    />
                    <p className="mt-2" dir="ltr">
                      {row.nationalId}
                    </p>
                    <RowStatus row={row} />
                  </div>
                ))}
              </div>
              {overflow ? <p className="text-sm text-red-700">{t('reservations.excelOverflow')}</p> : null}
              <Button
                type="button"
                disabled={importing || !selected.length || overflow}
                onClick={confirmImport}
              >
                {t('reservations.excelConfirmImport', { count: n(selected.length) })}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function RowStatus({ row }: { row: MemberImportPreviewRow }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const errorText = row.errors
    .map((code) => t(`reservations.importErrors.${code}`))
    .join('، ')
  return (
    <div className="space-y-1 text-xs">
      {row.userState === 'EXISTING' ? (
        <p className="text-teal-700">{t('reservations.excelUserExisting')}</p>
      ) : null}
      {row.userState === 'NEW' && row.status === 'VALID' ? (
        <p className="text-ink-600">{t('reservations.excelUserNew')}</p>
      ) : null}
      {row.userState === 'ALREADY_MEMBER' ? (
        <p className="text-ink-500">{t('reservations.excelUserAlready')}</p>
      ) : null}
      {row.duplicateOfRow ? (
        <p className="text-red-700">
          {t('reservations.excelDuplicateOf', { row: formatNumber(row.duplicateOfRow, locale) })}
        </p>
      ) : null}
      {errorText ? <p className="text-red-700">{errorText}</p> : null}
    </div>
  )
}
