import { useTranslation } from 'react-i18next'

export function PublishStatus({
  published,
  ns,
}: {
  published: boolean
  ns: 'headquartersNews' | 'headquartersAnnouncements'
}) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        published ? 'bg-teal-50 text-teal-700' : 'bg-cream-100 text-ink-500'
      }`}
    >
      {published ? t(`${ns}.published`) : t(`${ns}.draft`)}
    </span>
  )
}
