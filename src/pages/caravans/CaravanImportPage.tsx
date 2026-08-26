import { Tent, Upload } from 'lucide-react'
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
  formShellClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'

type IssueImportRow = {
  rowNumber: number
  caravanName: string
  firstName: string
  lastName: string
  nationalId: string
  phone: string
  city: string
  birthDate: string
  year: string
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
  managersCreated: number
  managersReused: number
  caravansCreated: number
  caravansReused: number
  yearsAdded: number
  yearsSkipped: number
  invalid: number
  invalidRows: IssueImportRow[]
  adjusted: number
  adjustedRows: IssueImportRow[]
}

function cellValue(value: string, locale?: string) {
  const trimmed = value.trim()
  if (!trimmed) return '—'
  return locale ? localizeDigits(trimmed, locale) : trimmed
}

function IssueTable({
  title,
  hint,
  rows,
  reasonClassName,
  formatRow,
  reasonLabel,
  headers,
  locale,
}: {
  title: string
  hint: string
  rows: IssueImportRow[]
  reasonClassName: string
  formatRow: (value: number) => string
  reasonLabel: (code: string) => string
  locale: string
  headers: {
    rowNumber: string
    caravanName: string
    firstName: string
    lastName: string
    nationalId: string
    phone: string
    city: string
    birthDate: string
    year: string
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
              <th className="px-4 py-3 text-start font-medium">{headers.caravanName}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.firstName}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.lastName}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.nationalId}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.phone}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.city}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.birthDate}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.year}</th>
              <th className="px-4 py-3 text-start font-medium">{headers.problem}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber} className="border-t border-line">
                <td className="px-4 py-3">{formatRow(row.rowNumber)}</td>
                <td className="px-4 py-3">{cellValue(row.caravanName)}</td>
                <td className="px-4 py-3">{cellValue(row.firstName)}</td>
                <td className="px-4 py-3">{cellValue(row.lastName)}</td>
                <td className="px-4 py-3">{cellValue(row.nationalId, locale)}</td>
                <td className="px-4 py-3">{cellValue(row.phone, locale)}</td>
                <td className="px-4 py-3">{cellValue(row.city)}</td>
                <td className="px-4 py-3">{cellValue(row.birthDate)}</td>
                <td className="px-4 py-3">{cellValue(row.year, locale)}</td>
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

export function CaravanImportPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
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
      const { data } = await api.post<ImportPreview>('/caravans/import/preview', body, {
        timeout: 10 * 60 * 1000,
      })
      setPreview(data)
      if (data.total === 0) {
        toast.error(t('caravans.importNoRows'))
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
      const { data } = await api.post<ImportResult>('/caravans/import', body, {
        timeout: 30 * 60 * 1000,
      })
      setResult(data)
      await queryClient.invalidateQueries({ queryKey: ['caravans'] })
      toast.success(t('caravans.importDone'))
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
    const key = `caravans.importReasons.${code}`
    const translated = t(key)
    return translated === key ? code : translated
  }

  const tableHeaders = {
    rowNumber: t('caravans.importRowNumber'),
    caravanName: t('caravans.name'),
    firstName: t('users.firstName'),
    lastName: t('users.lastName'),
    nationalId: t('users.nationalId'),
    phone: t('users.phone'),
    city: t('geo.city'),
    birthDate: t('users.birthDate'),
    year: t('caravans.importYear'),
    problem: t('caravans.importProblem'),
  }

  let summaryExtra: ReactNode = null
  if (preview && !result) {
    summaryExtra = (
      <>
        {invalidCount > 0 ? (
          <p className="mt-1 text-ink-500">
            {t('caravans.importInvalidCount', { count: n(invalidCount) })}
          </p>
        ) : null}
        {adjustedCount > 0 ? (
          <p className="mt-1 text-amber-800">
            {t('caravans.importAdjustedCount', { count: n(adjustedCount) })}
          </p>
        ) : null}
      </>
    )
  }

  return (
    <div className={listShellClassName}>
      <PageHeader title={t('caravans.import')} subtitle={t('caravans.importSubtitle')} />

      <div className={formShellClassName}>
        <FormCard
          icon={Tent}
          title={t('caravans.import')}
          subtitle={t('caravans.importSubtitle')}
        >
          <AppForm onSubmit={onSubmit} className={formCardBodyClassName}>
            <FormField icon={Upload} label={t('caravans.importFile')} htmlFor="caravans-import-file">
              <FileDropField
                key={dropKey}
                id="caravans-import-file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                allowCamera={false}
                maxBytes={64 * 1024 * 1024}
                uploading={loadingPreview}
                onFile={(next) => void onFile(next)}
                onClear={clearFile}
              />
            </FormField>

            <p className="text-sm text-ink-500">{t('caravans.importColumnsHint')}</p>

            {preview ? (
              <div className={`${cardClassName} px-4 py-3 text-sm text-ink-800`}>
                <p>
                  {t('caravans.importPreviewCount', {
                    count: n(preview.total),
                  })}
                </p>
                {summaryExtra}
              </div>
            ) : null}

            {result ? (
              <div className={`${cardClassName} flex flex-col gap-2 px-4 py-4 text-sm text-ink-800`}>
                <p className="font-medium text-ink-900">{t('caravans.importResultTitle')}</p>
                <p>{t('caravans.importResultTotal', { count: n(result.total) })}</p>
                <p>{t('caravans.importResultManagersCreated', { count: n(result.managersCreated) })}</p>
                <p>{t('caravans.importResultManagersReused', { count: n(result.managersReused) })}</p>
                <p>{t('caravans.importResultCaravansCreated', { count: n(result.caravansCreated) })}</p>
                <p>{t('caravans.importResultCaravansReused', { count: n(result.caravansReused) })}</p>
                <p>{t('caravans.importResultYearsAdded', { count: n(result.yearsAdded) })}</p>
                {result.yearsSkipped > 0 ? (
                  <p>{t('caravans.importResultYearsSkipped', { count: n(result.yearsSkipped) })}</p>
                ) : null}
                {result.invalid > 0 ? (
                  <p className="text-ink-500">
                    {t('caravans.importInvalidCount', { count: n(result.invalid) })}
                  </p>
                ) : null}
                {result.adjusted > 0 ? (
                  <p className="text-amber-800">
                    {t('caravans.importAdjustedCount', { count: n(result.adjusted) })}
                  </p>
                ) : null}
              </div>
            ) : (
              <FormActions
                submitLabel={t('caravans.importSubmit')}
                cancelLabel={t('common.cancel')}
                submitting={submitting || !canSubmit}
                onCancel={() => navigate('/caravans')}
              />
            )}
          </AppForm>
        </FormCard>
      </div>

      <IssueTable
        title={t('caravans.importAdjustedTitle')}
        hint={t('caravans.importAdjustedHint')}
        rows={adjustedRows}
        reasonClassName="text-amber-800"
        formatRow={n}
        reasonLabel={reasonLabel}
        locale={locale}
        headers={{ ...tableHeaders, problem: t('caravans.importAdjustment') }}
      />

      <IssueTable
        title={t('caravans.importInvalidTitle')}
        hint={t('caravans.importInvalidHint')}
        rows={invalidRows}
        reasonClassName="text-red-700"
        formatRow={n}
        reasonLabel={reasonLabel}
        locale={locale}
        headers={tableHeaders}
      />
    </div>
  )
}
