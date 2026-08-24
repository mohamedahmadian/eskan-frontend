import { History } from 'lucide-react'
import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { AppForm, FormActions, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'

/** Stub UI only — pilgrimage history logic not implemented yet. */
export function CaravanPilgrimageHistoryPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const location = useLocation()
  const fromMyCaravans = location.pathname.startsWith('/my-caravans/')
  const backTo = fromMyCaravans ? `/my-caravans/${id}` : `/caravans/${id}`

  function submit(event: FormEvent) {
    event.preventDefault()
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('caravanPilgrimageHistory.title')}
        subtitle={t('caravanPilgrimageHistory.listSubtitle')}
        backTo={backTo}
      />
      <AppForm onSubmit={submit} className={`space-y-4 p-6 ${cardClassName}`}>
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <History className="size-4 shrink-0" aria-hidden />
          {t('caravanPilgrimageHistory.listPlaceholder')}
        </p>
        <FormActions
          submitLabel={t('caravanPilgrimageHistory.save')}
          cancelLabel={t('caravanPilgrimageHistory.cancel')}
          onCancel={() => history.back()}
        />
      </AppForm>
    </div>
  )
}
