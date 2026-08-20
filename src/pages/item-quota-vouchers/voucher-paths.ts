export const VOUCHERS_ADMIN_BASE = '/logistics/vouchers'

export function voucherListPath(quotaId?: string) {
  return quotaId ? `/logistics/item-quotas/${quotaId}/vouchers` : VOUCHERS_ADMIN_BASE
}

export function voucherDetailPath(id: string, quotaId?: string) {
  return `${voucherListPath(quotaId)}/${id}`
}

export function voucherEditPath(id: string, quotaId?: string) {
  return `${voucherDetailPath(id, quotaId)}/edit`
}
