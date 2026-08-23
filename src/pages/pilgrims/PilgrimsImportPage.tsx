import { Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import {
  AppForm,
  FormActions,
  FormField,
  PageHeader,
  cardClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'

type IssueImportRow = {
  rowNumber: number
  firstName: string
  lastName: string
  gender: string
  phone: string
  nationalId: string
  birthDate: string
  city: string
  reasons: string[]
}

type ImportPreview = {
  total: number
  invalid: number
  invalidRows: IssueImportRow[]
  adjusted: number
  adjustedRows: IssueImportRow[]
}

type ImportResult = {
  total: number
  created: number
  updated: number
  invalid: number
  invalidRows: IssueImportRow[]
  adjusted: number
  adjustedRows: IssueImportRow[]
}

function cellValue(value: string) {
  return value.trim() ? value : '—'
}

function IssueTable({
  title,
  hint,
  rows,
  reasonClassName,
  formatRow,
  reasonLabel,
  headers,
}: {
  title: string
  hint: string
  rows: IssueImportRow[]
  reasonClassName: string
  formatRow: (value: number) => string
  reasonLabel: (code: string) => string
  headers: {
    rowNumber: string
    firstName: string
    lastName: string
    gender: string
    phone: string
    nationalId: string
    birthDate: string
    city: string
    problem: string
  }
}) {
  if (!rows.length) return null
  return (
    <div className={`${cardClassName} mt-6 overflow-hidden`}>
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium text-ink-900">{title}</h2>
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{headers.rowNumber}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.firstName}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.lastName}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.gender}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.phone}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.nationalId}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.birthDate}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.city}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.problem}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber} className="border-t border-line">
                <td className="px-4 py-3">{formatRow(row.rowNumber)}</td>
                <td className="px-4 py-3">{cellValue(row.firstName)}</td>
                <td className="px-4 py-3">{cellValue(row.lastName)}</td>
                <td className="px-4 py-3">{cellValue(row.gender)}</td>
                <td className="px-4 py-3">{cellValue(row.phone)}</td>
                <td className="px-4 py-3">{cellValue(row.nationalId)}</td>
                <td className="px-4 py-3">{cellValue(row.birthDate)}</td>
                <td className="px-4 py-3">{cellValue(row.city)}</td>
                <td className={`px-4 py-3 ${reasonClassName}`}>
                  {row.reasons.map(reasonLabel).join('، ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PilgrimsImportPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dropKey, setDropKey] = useState(0)

  function clearFile() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setDropKey((value) => value + 1)
  }

  async function onFile(next: File) {
    setFile(next)
    setPreview(null)
    setResult(null)
    setLoadingPreview(true)
    try {
      const body = new FormData()
      body.append('file', next)
      const { data } = await api.post<ImportPreview>('/pilgrims/import/preview', body, {
        timeout: 10 * 60 * 1000,
      })
      setPreview(data)
      if (data.total === 0) {
        toast.error(t('pilgrims.importNoRows'))
      }
    } catch (error) {
      clearFile()
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setLoadingPreview(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || !preview || preview.total === 0 || submitting) return
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post<ImportResult>('/pilgrims/import', body, {
        timeout: 30 * 60 * 1000,
      })
      setResult(data)
      await queryClient.invalidateQueries({ queryKey: ['pilgrims'] })
      toast.success(t('pilgrims.importDone'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Boolean(file && preview && preview.total > 0 && !loadingPreview)
  const n = (value: number) => formatNumber(value, i18n.language)
  const invalidRows = result?.invalidRows ?? preview?.invalidRows ?? []
  const adjustedRows = result?.adjustedRows ?? preview?.adjustedRows ?? []
  const adjustedCount = result?.adjusted ?? preview?.adjusted ?? 0
  const invalidCount = result?.invalid ?? preview?.invalid ?? 0

  function reasonLabel(code: string) {
    const key = `pilgrims.importReasons.${code}`
    const translated = t(key)
    return translated === key ? code : translated
  }

  const tableHeaders = {
    rowNumber: t('pilgrims.importRowNumber'),
    firstName: t('users.firstName'),
    lastName: t('users.lastName'),
    gender: t('users.gender'),
    phone: t('users.phone'),
    nationalId: t('users.nationalId'),
    birthDate: t('pilgrims.birthDate'),
    city: t('geo.city'),
    problem: t('pilgrims.importProblem'),
  }

  let summaryExtra: ReactNode = null
  if (preview && !result) {
    summaryExtra = (
      <>
        {invalidCount > 0 ? (
          <p className="mt-1 text-ink-500">
            {t('pilgrims.importInvalidCount', { count: n(invalidCount) })}
          </p>
        ) : null}
        {adjustedCount > 0 ? (
          <p className="mt-1 text-amber-800">
            {t('pilgrims.importAdjustedCount', { count: n(adjustedCount) })}
          </p>
        ) : null}
      </>
    )
  }

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('pilgrims.import')} subtitle={t('pilgrims.importSubtitle')} />

      <AppForm onSubmit={onSubmit} className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <FormField icon={Upload} label={t('pilgrims.importFile')} htmlFor="pilgrims-import-file">
          <FileDropField
            key={dropKey}
            id="pilgrims-import-file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            allowCamera={false}
            maxBytes={64 * 1024 * 1024}
            uploading={loadingPreview}
            onFile={(next) => void onFile(next)}
            onClear={clearFile}
          />
        </FormField>

        <p className="text-sm text-ink-500">{t('pilgrims.importColumnsHint')}</p>

        {preview ? (
          <div className={`${cardClassName} px-4 py-3 text-sm text-ink-800`}>
            <p>
              {t('pilgrims.importPreviewCount', {
                count: n(preview.total),
              })}
            </p>
            {summaryExtra}
          </div>
        ) : null}

        {result ? (
          <div className={`${cardClassName} flex flex-col gap-2 px-4 py-4 text-sm text-ink-800`}>
            <p className="font-medium text-ink-900">{t('pilgrims.importResultTitle')}</p>
            <p>
              {t('pilgrims.importResultTotal', {
                count: n(result.total),
              })}
            </p>
            <p>
              {t('pilgrims.importResultCreated', {
                count: n(result.created),
              })}
            </p>
            <p>
              {t('pilgrims.importResultUpdated', {
                count: n(result.updated),
              })}
            </p>
            {result.invalid > 0 ? (
              <p className="text-ink-500">
                {t('pilgrims.importInvalidCount', {
                  count: n(result.invalid),
                })}
              </p>
            ) : null}
            {result.adjusted > 0 ? (
              <p className="text-amber-800">
                {t('pilgrims.importAdjustedCount', {
                  count: n(result.adjusted),
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <FormActions
            submitLabel={t('pilgrims.importSubmit')}
            cancelLabel={t('common.cancel')}
            submitting={submitting || !canSubmit}
            onCancel={() => navigate('/pilgrims')}
          />
        )}
      </AppForm>

      <IssueTable
        title={t('pilgrims.importAdjustedTitle')}
        hint={t('pilgrims.importAdjustedHint')}
        rows={adjustedRows}
        reasonClassName="text-amber-800"
        formatRow={n}
        reasonLabel={reasonLabel}
        headers={{ ...tableHeaders, problem: t('pilgrims.importAdjustment') }}
      />

      <IssueTable
        title={t('pilgrims.importInvalidTitle')}
        hint={t('pilgrims.importInvalidHint')}
        rows={invalidRows}
        reasonClassName="text-red-700"
        formatRow={n}
        reasonLabel={reasonLabel}
        headers={tableHeaders}
      />
    </div>
  )
}
