import {
  AlignLeft,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileBadge2,
  FileImage,
  IdCard,
  MapPin,
  Phone,
  Tent,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { DateText } from '../../components/ui/DateText'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormFactTile,
  FormMetaChip,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { confirmToast } from '../../components/ui/confirmToast'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { formatDate, formatTime, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isAdmin } from '../../lib/roles'
import type { IssuedLicense, IssuedLicenseStatus } from '../../types/app'
import { IssuedLicenseStatusBadge } from './license-ui'

function IssuedAtWithTime({
  issuedAt,
  createdAt,
  locale,
}: {
  issuedAt: string
  createdAt: string
  locale: string
}) {
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap" dir="ltr">
      <span>{formatDate(issuedAt, locale)}</span>
      <span>{formatTime(createdAt, locale)}</span>
    </span>
  )
}

export function IssuedLicenseDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { user } = useAuth()
  const canApprove = isAdmin(user)
  const { id } = useParams()
  const queryClient = useQueryClient()
  const nameOf = useGeoName()
  const query = useQuery({
    queryKey: ['issued-license', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<IssuedLicense>(`/issued-licenses/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const empty = '—'
  const cityLabel = `${nameOf(item.caravan.city)}${
    item.caravan.city.province ? ` — ${nameOf(item.caravan.city.province)}` : ''
  }`

  async function refreshLicense() {
    await queryClient.invalidateQueries({ queryKey: ['issued-licenses'] })
    await queryClient.invalidateQueries({ queryKey: ['issued-license', id] })
  }

  function approve() {
    confirmToast({
      title: t('licenses.confirmApprove'),
      confirmLabel: t('licenses.yesApprove'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await api.post(`/issued-licenses/${item!.id}/approve`)
          await refreshLicense()
          toast.success(t('licenses.approved'))
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  function revoke() {
    confirmToast({
      title: t('licenses.confirmRevoke'),
      confirmLabel: t('licenses.yesRevoke'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.post(`/issued-licenses/${item!.id}/revoke`)
          await refreshLicense()
          toast.success(t('licenses.revoked'))
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('licenses.details')}
        subtitle={<EntityNameSubtitle name={item.caravan.name} icon={FileBadge2} />}
      />

      <FormCard
        icon={FileBadge2}
        title={item.caravan.name}
        subtitle={t('licenses.detailsSubtitle')}
        chips={
          <>
            <HeaderStatusBadge status={item.status} />
            <FormMetaChip icon={UserRound} label={item.manager.fullName} />
            <FormMetaChip
              icon={CalendarDays}
              label={
                <IssuedAtWithTime
                  issuedAt={item.issuedAt}
                  createdAt={item.createdAt}
                  locale={locale}
                />
              }
            />
            {item.organization ? (
              <FormMetaChip icon={Building2} label={item.organization.name} />
            ) : null}
          </>
        }
      >
        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={FileBadge2}>{t('licenses.licenseInfo')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={FileBadge2}
                label={t('users.status')}
                value={<IssuedLicenseStatusBadge status={item.status} />}
                tone="teal"
              />
              <FormFactTile
                icon={Building2}
                label={t('licenses.organization')}
                value={item.organization?.name ?? empty}
                empty={!item.organization}
                tone="mint"
              />
              <FormFactTile
                icon={UserRound}
                label={t('licenses.issuer')}
                value={item.issuer.fullName}
                tone="teal"
              />
              <FormFactTile
                icon={CalendarDays}
                label={t('licenses.issuedAt')}
                value={
                  <IssuedAtWithTime
                    issuedAt={item.issuedAt}
                    createdAt={item.createdAt}
                    locale={locale}
                  />
                }
                tone="mint"
              />
              {item.approvedBy ? (
                <FormFactTile
                  icon={UserRound}
                  label={t('licenses.approvedBy')}
                  value={item.approvedBy.fullName}
                  tone="teal"
                />
              ) : null}
              {item.approvedAt ? (
                <FormFactTile
                  icon={CheckCircle2}
                  label={t('licenses.approvedAt')}
                  value={<DateText value={item.approvedAt} withTime />}
                  tone="mint"
                />
              ) : null}
              {item.revokedBy ? (
                <FormFactTile
                  icon={UserRound}
                  label={t('licenses.revokedBy')}
                  value={item.revokedBy.fullName}
                  tone="ink"
                />
              ) : null}
              {item.revokedAt ? (
                <FormFactTile
                  icon={Ban}
                  label={t('licenses.revokedAt')}
                  value={<DateText value={item.revokedAt} withTime />}
                  tone="ink"
                />
              ) : null}
              <FormFactTile
                icon={AlignLeft}
                label={t('licenses.description')}
                value={
                  item.description ? (
                    <span className="whitespace-pre-wrap">{item.description}</span>
                  ) : (
                    empty
                  )
                }
                empty={!item.description}
                tone="mint"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={UserRound}>{t('licenses.managerInfo')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={UserRound}
                label={t('users.fullName')}
                value={item.manager.fullName}
                tone="teal"
              />
              <FormFactTile
                icon={IdCard}
                label={t('users.nationalId')}
                copyValue={item.manager.nationalId}
                tone="mint"
              />
              <FormFactTile
                icon={Phone}
                label={t('users.phone')}
                copyValue={item.manager.phone}
                tone="ink"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={Tent}>{t('licenses.caravanInfo')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Tent}
                label={t('caravans.name')}
                value={item.caravan.name}
                tone="teal"
              />
              <FormFactTile icon={MapPin} label={t('geo.city')} value={cityLabel} tone="mint" />
              <FormFactTile
                icon={Phone}
                label={t('caravans.officePhone')}
                value={
                  item.caravan.officePhone
                    ? localizeDigits(item.caravan.officePhone, locale)
                    : empty
                }
                empty={!item.caravan.officePhone}
                tone="ink"
              />
              <FormFactTile
                icon={MapPin}
                label={t('caravans.officeAddress')}
                value={item.caravan.officeAddress || empty}
                empty={!item.caravan.officeAddress}
                tone="teal"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={FileImage}>{t('licenses.file')}</FormSectionTitle>
            {item.fileId ? (
              <LicenseFilePreview fileId={item.fileId} licenseId={item.id} />
            ) : (
              <FormFactTile
                icon={FileImage}
                label={t('licenses.file')}
                value={empty}
                empty
                tone="teal"
              />
            )}
          </section>
        </div>

        {item.status !== 'REVOKED' ? (
          <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 sm:px-6">
            {canApprove && item.status === 'ISSUED' ? (
              <Button type="button" variant="soft" onClick={approve}>
                <CheckCircle2 className="size-4" aria-hidden />
                {t('licenses.approve')}
              </Button>
            ) : null}
            <Button type="button" variant="danger" onClick={revoke}>
              <Ban className="size-4" aria-hidden />
              {t('licenses.revoke')}
            </Button>
          </div>
        ) : null}
      </FormCard>
    </div>
  )
}

function LicenseFilePreview({
  fileId,
  licenseId,
}: {
  fileId: string
  licenseId: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const url = getImageUrl(fileId)

  async function download() {
    setDownloading(true)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('download failed')
      }
      const blob = await response.blob()
      const extension = mimeToExtension(blob.type)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `license-${licenseId}${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error(t('licenses.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full max-w-md justify-center rounded-2xl border border-line bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label={t('licenses.preview')}
        >
          <img
            src={url}
            alt=""
            className="max-h-56 w-auto max-w-full object-contain"
          />
        </button>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
            <Eye className="size-4" aria-hidden />
            {t('licenses.preview')}
          </Button>
          <Button
            type="button"
            variant="soft"
            onClick={() => void download()}
            disabled={downloading}
          >
            <Download className="size-4" aria-hidden />
            {t('licenses.downloadFile')}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/55"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('licenses.file')}
            className="relative z-10 flex max-h-[92vh] w-full max-w-[min(96vw,100%)] flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              icon
              className="absolute -top-1 end-0 z-10 bg-white/95 shadow-sm"
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden />
            </Button>
            <div className="max-h-[82vh] max-w-full overflow-auto rounded-2xl border border-line bg-white p-3 shadow-[0_20px_50px_rgba(20,40,40,0.28)]">
              <img src={url} alt="" className="h-auto w-auto max-w-none" />
            </div>
            <Button
              type="button"
              variant="soft"
              onClick={() => void download()}
              disabled={downloading}
            >
              <Download className="size-4" aria-hidden />
              {t('licenses.downloadFile')}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function mimeToExtension(mimeType: string) {
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/gif') return '.gif'
  return '.jpg'
}

function HeaderStatusBadge({ status }: { status: IssuedLicenseStatus }) {
  const { t } = useTranslation()
  const tone =
    status === 'APPROVED'
      ? 'bg-teal-500 text-white ring-teal-500'
      : status === 'REVOKED'
        ? 'bg-red-500 text-white ring-red-500'
        : 'bg-amber-500 text-white ring-amber-500'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${tone}`}
    >
      {t(`licenses.statuses.${status}`)}
    </span>
  )
}
