import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SmsPreviewModal } from '../../components/sms/SmsPreviewModal'
import {
  DetailActions,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import { VoucherDeliveryActions } from '../../components/voucher/VoucherDeliveryActions'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useSendSms } from '../../hooks/useSendSms'
import { useVoucherCardImage } from '../../hooks/useVoucherCardImage'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { formatItemUnit, type ItemQuotaVoucher } from '../../types/app'
import { VoucherCard } from './VoucherCard'
import { voucherEditPath, voucherListPath } from './voucher-paths'

function recipientTitle(
  gender: ItemQuotaVoucher['accommodationManager']['gender'],
  t: (key: string) => string,
) {
  if (gender === 'MALE') return t('itemQuotaVouchers.mister')
  if (gender === 'FEMALE') return t('itemQuotaVouchers.miss')
  return ''
}

function buildSupplierSmsBody(
  voucher: ItemQuotaVoucher,
  locale: string,
  t: (key: string, opts?: Record<string, string>) => string,
) {
  const manager = voucher.accommodationManager
  const title = recipientTitle(manager.gender, t)
  const recipient = manager.nationalId
    ? t('itemQuotaVouchers.smsRecipientWithId', {
        title,
        name: manager.fullName,
        nationalId: manager.nationalId,
      })
    : t('itemQuotaVouchers.smsRecipient', {
        title,
        name: manager.fullName,
      })
  return t('itemQuotaVouchers.smsBody', {
    recipient: recipient.trim(),
    quantity: formatNumber(voucher.quantity, locale),
    unit: formatItemUnit(voucher.quota.unit, t),
    item: voucher.quota.name,
    code: voucher.code,
  })
}

function buildManagerSmsBody(
  voucher: ItemQuotaVoucher,
  locale: string,
  t: (key: string, opts?: Record<string, string>) => string,
) {
  return t('itemQuotaVouchers.smsManagerBody', {
    quantity: formatNumber(voucher.quantity, locale),
    unit: formatItemUnit(voucher.quota.unit, t),
    item: voucher.quota.name,
    code: voucher.code,
    location: voucher.pickupLocation || '—',
    supplier: voucher.supplierName,
  })
}

export function ItemQuotaVoucherDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { quotaId, id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const sms = useSendSms()
  const [smsOpen, setSmsOpen] = useState(false)
  const [smsTitle, setSmsTitle] = useState('')
  const [smsPhone, setSmsPhone] = useState('')
  const [smsBody, setSmsBody] = useState('')
  const [sending, setSending] = useState(false)

  const query = useQuery({
    queryKey: ['item-quota-voucher', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ItemQuotaVoucher>(`/item-quota-vouchers/${id}`)
      return data
    },
  })

  const item = query.data
  const { cardRef, qrUrl, downloading, sharing, shareUrl, shareText, downloadCard, shareCard } = useVoucherCardImage('item', item?.code, {
    downloaded: t('itemQuotaVouchers.cardDownloaded'),
    failed: t('itemQuotaVouchers.downloadFailed'),
  })
  const listPath = voucherListPath(quotaId)

  if (!item) {
    return <LoadingState />
  }

  function openSupplierSms() {
    if (!item) return
    setSmsTitle(t('itemQuotaVouchers.smsPreviewTitle'))
    setSmsPhone(item.supplier?.phone ?? '')
    setSmsBody(buildSupplierSmsBody(item, locale, t))
    setSmsOpen(true)
  }

  function openManagerSms() {
    if (!item) return
    setSmsTitle(t('itemQuotaVouchers.smsManagerPreviewTitle'))
    setSmsPhone(item.accommodationManager.phone ?? '')
    setSmsBody(buildManagerSmsBody(item, locale, t))
    setSmsOpen(true)
  }

  async function sendSms() {
    const phone = smsPhone.trim()
    const body = smsBody.trim()
    if (!phone) {
      toast.error(t('itemQuotaVouchers.smsPhoneRequired'))
      return
    }
    if (!body) {
      toast.error(t('itemQuotaVouchers.smsBodyRequired'))
      return
    }
    setSending(true)
    try {
      await sms.mutateAsync({ phone, body })
      toast.success(t('sms.queued'))
      setSmsOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('itemQuotaVouchers.details')}
        subtitle={t('itemQuotaVouchers.detailsSubtitle')}
        action={
          <Link to={listPath} className="text-sm text-teal-700 hover:underline">
            {t('itemQuotaVouchers.backToList')}
          </Link>
        }
      />
      <VoucherCard ref={cardRef} voucher={item} qrUrl={qrUrl} />
      <DetailActions
        editTo={voucherEditPath(item.id, quotaId)}
        editLabel={t('common.edit')}
        deleteLabel={t('itemQuotaVouchers.delete')}
        onDelete={() =>
          confirmDelete({
            message: t('itemQuotaVouchers.confirmDelete'),
            successMessage: t('itemQuotaVouchers.deleted'),
            path: `/item-quota-vouchers/${item.id}`,
            queryKey: ['item-quota-vouchers'],
            onDeleted: () => navigate(listPath),
          })
        }
      />
      <VoucherDeliveryActions
        onDownload={() => void downloadCard()}
        onSmsSupplier={openSupplierSms}
        onSmsManager={openManagerSms}
        onShare={shareCard}
        onShareDownload={() => downloadCard({ silent: true })}
        shareUrl={shareUrl}
        shareText={shareText}
        sharing={sharing}
        downloading={downloading}
        disabled={!qrUrl}
      />
      {smsOpen ? (
        <SmsPreviewModal
          title={smsTitle}
          phone={smsPhone}
          body={smsBody}
          sending={sending}
          onPhoneChange={setSmsPhone}
          onBodyChange={setSmsBody}
          onClose={() => setSmsOpen(false)}
          onSend={sendSms}
        />
      ) : null}
    </div>
  )
}
