import { Coins, Phone, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { getApiErrorMessage } from '../../lib/api'
import type { CampaignParticipant, ParticipationCampaign } from '../../types/app'

export type ParticipantPayload = {
  fullName: string
  phone: string | null
  shareCount: number
  paidAmount?: number
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function ParticipantForm({
  campaign,
  initial,
  onSubmit,
}: {
  campaign: ParticipationCampaign
  initial?: CampaignParticipant
  onSubmit: (payload: ParticipantPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    shareCount: initial?.shareCount != null ? String(initial.shareCount) : '',
    paidAmount: initial?.paidAmount != null ? String(initial.paidAmount) : '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const shareCount = Number(values.shareCount)
      const paidRaw = values.paidAmount.trim()
      await onSubmit({
        fullName: values.fullName.trim(),
        phone: emptyToNull(values.phone),
        shareCount,
        paidAmount: paidRaw ? Number(paidRaw) : undefined,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={UserRound}
      title={initial ? initial.fullName : t('campaignParticipants.create')}
      subtitle={initial ? undefined : t('campaignParticipants.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={UserRound} label={t('campaignParticipants.fullName')} htmlFor="fullName">
          <input
            id="fullName"
            className={fieldClassName}
            value={values.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Phone} label={t('campaignParticipants.phone')} htmlFor="phone">
          <input
            id="phone"
            className={`${fieldClassName} digit-field`}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            inputMode="tel"
          />
        </FormField>
        <FormField icon={Coins} label={t('campaignParticipants.shareCount')} htmlFor="shareCount">
          <input
            id="shareCount"
            type="number"
            min={1}
            className={fieldClassName}
            value={values.shareCount}
            onChange={(e) => set('shareCount', e.target.value)}
            required
          />
        </FormField>
        <FormField icon={Coins} label={t('campaignParticipants.paidAmount')} htmlFor="paidAmount">
          <input
            id="paidAmount"
            type="number"
            min={0}
            className={fieldClassName}
            value={values.paidAmount}
            onChange={(e) => set('paidAmount', e.target.value)}
            placeholder={String(campaign.sharePrice)}
          />
        </FormField>
        <p className="text-xs text-ink-500">{t('campaignParticipants.paidAmountHint')}</p>
        <FormActions
          submitLabel={t('campaignParticipants.save')}
          cancelLabel={t('campaignParticipants.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
