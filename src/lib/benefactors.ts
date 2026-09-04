export const ANONYMOUS_BENEFACTOR_CODE = 'ANONYMOUS'
export const ANONYMOUS_BENEFACTOR_NAME = 'ناشناس'

export function isAnonymousBenefactor(item: { code?: string | null; name?: string }) {
  return item.code === ANONYMOUS_BENEFACTOR_CODE || item.name === ANONYMOUS_BENEFACTOR_NAME
}

export function findAnonymousBenefactor<T extends { code?: string | null; name?: string }>(
  items: T[] | undefined,
) {
  return items?.find((item) => item.code === ANONYMOUS_BENEFACTOR_CODE)
    ?? items?.find((item) => item.name === ANONYMOUS_BENEFACTOR_NAME)
}
