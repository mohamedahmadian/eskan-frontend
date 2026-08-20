import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'

export function PublicVoucherLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="min-h-svh bg-cream-50 px-4 py-8 sm:px-8">
      <div className={userFormShellClassName}>
        <p className="mb-2 text-xs font-medium text-teal-700">{t('app.name')}</p>
        <PageHeader title={title} subtitle={subtitle} />
        {children}
      </div>
    </div>
  )
}

export function PublicVoucherNotFound() {
  const { t } = useTranslation()
  return (
    <PublicVoucherLayout
      title={t('publicVouchers.notFoundTitle')}
      subtitle={t('publicVouchers.notFound')}
    >
      <div className="rounded-[22px] border border-line bg-white p-8 text-center text-sm text-ink-500">
        {t('publicVouchers.notFoundHint')}
      </div>
    </PublicVoucherLayout>
  )
}

export function PublicVoucherLoading() {
  return (
    <div className="min-h-svh bg-cream-50">
      <LoadingState />
    </div>
  )
}
