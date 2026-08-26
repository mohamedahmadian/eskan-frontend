import {
  AlignLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Eye,
  FileBadge,
  FileImage,
  IdCard,
  Tent,
  User,
  UserRound,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { Button, FormField, cardClassName } from '../../components/ui/Form'
import { FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatDate } from '../../lib/datetime'
import { IssuedLicenseStatusBadge } from '../licenses/license-ui'
import type {
  Caravan,
  ReservationPermitOption,
  ReservationPermitOptions,
  ReservationPermitSource,
} from '../../types/app'

export type CaravanPermitDraft = {
  source: ReservationPermitSource | ''
  issuedLicenseId: string
  permitImageId: string
}

export function ReservationCaravanLicenseStep({
  caravanId,
  year,
  value,
  onChange,
}: {
  caravanId: string
  year: number
  value: CaravanPermitDraft
  onChange: (patch: Partial<CaravanPermitDraft>) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [uploading, setUploading] = useState(false)
  const [viewing, setViewing] = useState<ReservationPermitOption | null>(null)
  const caravan = useQuery({
    queryKey: ['caravans', caravanId],
    enabled: Boolean(caravanId),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${caravanId}`)
      return data
    },
  })
  const options = useQuery({
    queryKey: ['reservations', 'permit-options', caravanId, year],
    enabled: Boolean(caravanId),
    queryFn: async () => {
      const { data } = await api.get<ReservationPermitOptions>('/reservations/permit-options', {
        params: { caravanId, year },
      })
      return data
    },
  })

  const manager = caravan.data?.manager
  const nationalId = manager?.nationalId
  const licenses = options.data?.items ?? []

  function selectIssued(id: string) {
    onChange({ source: 'ISSUED_LICENSE', issuedLicenseId: id, permitImageId: '' })
  }

  function selectUpload() {
    onChange({ source: 'UPLOAD', issuedLicenseId: '', permitImageId: value.permitImageId })
  }

  async function uploadPermit(file: File) {
    const body = new FormData()
    body.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post<{ id: string }>('/images', body)
      onChange({ source: 'UPLOAD', issuedLicenseId: '', permitImageId: data.id })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 rounded-2xl border border-teal-100 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-3 py-2.5 shadow-[0_6px_16px_rgba(20,40,40,0.04)]">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
          <FileBadge className="size-3.5" aria-hidden />
        </span>
        <p className="text-[11px] leading-5 text-ink-600">{t('reservations.licenseStepHint')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <LicenseFact
          icon={Tent}
          label={t('caravans.name')}
          value={caravan.data?.name || '—'}
        />
        <LicenseFact
          icon={User}
          label={t('caravans.manager')}
          value={manager?.fullName || '—'}
        />
        <LicenseFact
          icon={IdCard}
          label={t('reservations.licenseManagerNationalId')}
          value={<CopyableDigits value={nationalId} />}
        />
      </div>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-ink-900">{t('reservations.permitChooseSource')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SourceCard
            active={value.source === 'ISSUED_LICENSE'}
            icon={BadgeCheck}
            title={t('reservations.permitSourceIssued')}
            hint={t('reservations.permitSourceIssuedHint')}
            onClick={() => {
              if (licenses[0]) selectIssued(licenses[0].id)
              else onChange({ source: 'ISSUED_LICENSE', issuedLicenseId: '', permitImageId: '' })
            }}
          />
          <SourceCard
            active={value.source === 'UPLOAD'}
            icon={FileImage}
            title={t('reservations.permitSourceUpload')}
            hint={t('reservations.permitSourceUploadHint')}
            onClick={selectUpload}
          />
        </div>
      </section>

      {value.source === 'ISSUED_LICENSE' ? (
        <section className="space-y-2">
          {options.isLoading ? (
            <p className="text-sm text-ink-500">{t('common.loading')}</p>
          ) : licenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-5 text-center">
              <p className="text-sm font-medium text-ink-800">{t('reservations.permitNoIssued')}</p>
              <p className="mt-1 text-xs leading-6 text-ink-600">{t('reservations.permitNoIssuedHint')}</p>
            </div>
          ) : (
            licenses.map((item) => (
              <IssuedLicenseCard
                key={item.id}
                item={item}
                locale={locale}
                selected={value.issuedLicenseId === item.id}
                onSelect={() => selectIssued(item.id)}
                onView={() => setViewing(item)}
              />
            ))
          )}
        </section>
      ) : null}

      {value.source === 'UPLOAD' ? (
        <FormField icon={FileImage} label={t('reservations.permitImage')} htmlFor="reservation-permit-image">
          <FileDropField
            id="reservation-permit-image"
            accept="image/*"
            capture="environment"
            uploading={uploading}
            previewUrl={value.permitImageId ? getImageUrl(value.permitImageId) : undefined}
            onFile={(file) => void uploadPermit(file)}
            onClear={() => onChange({ permitImageId: '' })}
          />
        </FormField>
      ) : null}

      {viewing ? (
        <IssuedLicenseViewModal item={viewing} onClose={() => setViewing(null)} />
      ) : null}
    </div>
  )
}

function SourceCard({
  active,
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  active: boolean
  icon: typeof BadgeCheck
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      data-enter-ignore=""
      onClick={onClick}
      className={`rounded-2xl border p-3 text-start transition-[box-shadow,border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
        active
          ? 'border-teal-500 bg-teal-50 shadow-[0_10px_24px_rgba(46,189,182,0.18)]'
          : 'border-line bg-white hover:border-teal-300'
      }`}
    >
      <span
        className={`mb-2 flex size-8 items-center justify-center rounded-xl ${
          active ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600'
        }`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-ink-500">{hint}</p>
    </button>
  )
}

function IssuedLicenseCard({
  item,
  locale,
  selected,
  onSelect,
  onView,
}: {
  item: ReservationPermitOption
  locale: string
  selected: boolean
  onSelect: () => void
  onView: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex w-full items-stretch gap-2 rounded-2xl border p-2 transition-[box-shadow,border-color,background-color] sm:gap-3 sm:p-3 ${
        selected
          ? 'border-teal-500 bg-teal-50 shadow-[0_10px_24px_rgba(46,189,182,0.16)]'
          : 'border-line bg-white hover:border-teal-300'
      }`}
    >
      <button
        type="button"
        data-enter-ignore=""
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
            selected ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600'
          }`}
        >
          <Building2 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-900">
              {item.organization?.name || t('reservations.permitUnknownOrg')}
            </p>
            <IssuedLicenseStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {t('licenses.issuedAt')}: {formatDate(item.issuedAt, locale)}
          </p>
          {item.status === 'ISSUED' ? (
            <p className="mt-1 text-[11px] leading-5 text-amber-800">
              {t('reservations.permitAwaitingHqApproval')}
            </p>
          ) : null}
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-600">{item.description}</p>
          ) : null}
        </div>
      </button>

      <div className="flex shrink-0 items-center self-center pe-1">
        <Button type="button" variant="soft" data-enter-ignore="" onClick={onView}>
          <Eye className="size-4" aria-hidden />
          {t('reservations.permitViewLicense')}
        </Button>
      </div>
    </div>
  )
}

function IssuedLicenseViewModal({
  item,
  onClose,
}: {
  item: ReservationPermitOption
  onClose: () => void
}) {
  const { t } = useTranslation()
  const empty = '—'
  const orgName = item.organization?.name || t('reservations.permitUnknownOrg')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/35"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issued-license-view-title"
        className={`relative z-10 flex max-h-[min(92vh,40rem)] w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="issued-license-view-title"
              className="text-base font-semibold text-ink-900"
            >
              {t('reservations.permitViewLicenseTitle')}
            </h2>
            <p className="mt-1 text-xs leading-6 text-ink-600">
              {t('reservations.permitViewLicenseSubtitle')}
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.close')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={FileBadge}>{t('licenses.licenseInfo')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Building2}
                label={t('reservations.permitUnknownOrg')}
                value={orgName}
                tone="teal"
                className="sm:col-span-2"
              />
              <FormFactTile
                icon={UserRound}
                label={t('reservations.permitIssuer')}
                value={item.issuer?.fullName || empty}
                empty={!item.issuer?.fullName}
                tone="mint"
              />
              <FormFactTile
                icon={CalendarDays}
                label={t('licenses.issuedAt')}
                value={<DateText value={item.issuedAt} />}
                tone="teal"
              />
              <FormFactTile
                icon={BadgeCheck}
                label={t('users.status')}
                value={<IssuedLicenseStatusBadge status={item.status} />}
                tone="mint"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('reservations.permitDescription')}
                value={
                  item.description ? (
                    <span className="whitespace-pre-wrap">{item.description}</span>
                  ) : (
                    empty
                  )
                }
                empty={!item.description}
                tone="ink"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={FileImage}>
              {t('reservations.permitAttachment')}
            </FormSectionTitle>
            {item.fileId ? (
              <div className="space-y-3">
                <a
                  href={getImageUrl(item.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-center rounded-2xl border border-teal-100 bg-cream-50/80 p-3 transition-colors hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                  <img
                    src={getImageUrl(item.fileId)}
                    alt=""
                    className="max-h-56 w-auto max-w-full rounded-xl object-contain bg-white"
                  />
                </a>
                <a
                  href={getImageUrl(item.fileId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-mint-300 px-4 py-2.5 text-sm font-medium text-ink-900 shadow-sm transition hover:bg-mint-400"
                >
                  <Eye className="size-4" aria-hidden />
                  {t('reservations.permitViewIssuedFile')}
                </a>
              </div>
            ) : (
              <FormFactTile
                icon={FileImage}
                label={t('reservations.permitAttachment')}
                value={t('reservations.permitNoAttachment')}
                empty
                tone="teal"
              />
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-line px-5 py-3 sm:px-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="size-4" aria-hidden />
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function LicenseFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white px-3 py-3 shadow-[0_4px_12px_rgba(20,40,40,0.04)]">
      <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
        <Icon className="size-3.5 text-teal-600" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  )
}
