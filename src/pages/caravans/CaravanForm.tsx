import { CalendarDays, MapPin, Tent } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormField, FormActions, cardClassName, fieldClassName } from '../../components/ui/Form'
import { PersianDateField } from '../../components/ui/PersianDateField'

export type CaravanPayload = {
  name: string
  originCity: string
  plannedArrival?: string
}

export function CaravanForm({
  initial,
  onSubmit,
}: {
  initial?: { name: string; originCity: string; plannedArrival?: string | null }
  onSubmit: (payload: CaravanPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [originCity, setOriginCity] = useState(initial?.originCity ?? '')
  const [plannedArrival, setPlannedArrival] = useState(
    initial?.plannedArrival?.slice(0, 10) ?? '',
  )
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name,
        originCity,
        plannedArrival: plannedArrival || undefined,
      })
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppForm onSubmit={submit} className={`space-y-4 p-6 ${cardClassName}`}>
      <FormField icon={Tent} label={t('caravans.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </FormField>
      <FormField icon={MapPin} label={t('caravans.originCity')} htmlFor="originCity">
        <input
          id="originCity"
          className={fieldClassName}
          value={originCity}
          onChange={(e) => setOriginCity(e.target.value)}
          required
        />
      </FormField>
      <FormField icon={CalendarDays} label={t('caravans.plannedArrival')} htmlFor="plannedArrival">
        <PersianDateField
          id="plannedArrival"
          value={plannedArrival || undefined}
          onChange={(iso) => setPlannedArrival(iso ?? '')}
        />
      </FormField>
      <FormActions
        submitLabel={t('caravans.save')}
        cancelLabel={t('caravans.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
  )
}
