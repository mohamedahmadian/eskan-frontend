import { formatGroupedNumber, formatNumber } from '../../lib/datetime'
import type { IceVoucher } from '../../types/app'

export function buildIceVoucherSmsBody(
  voucher: IceVoucher,
  locale: string,
  t: (key: string, opts?: Record<string, string>) => string,
) {
  return t('iceVouchers.smsBody', {
    count: formatNumber(voucher.moldCount, locale),
    amount: formatGroupedNumber(voucher.totalCost, locale),
  })
}
