import { AlignLeft, Building, MapPin, Phone, Smartphone, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import type { GovernmentOrganization, ManagedUser } from '../../types/app'

export type GovernmentOrganizationPayload = {
  name: string
  phone: string | null
  address: string | null
  contactUserId: string | null
  mobile: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function GovernmentOrganizationForm({
  initial,
  onSubmit,
}: {
  initial?: GovernmentOrganization
  onSubmit: (payload: GovernmentOrganizationPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    contactUserId: initial?.contactUserId ?? '',
    mobile: initial?.mobile ?? '',
    description: initial?.description ?? '',
  })

  const officers = useQuery({
    queryKey: ['users', 'lookup', 'GOVERNMENT_ORG_OFFICER'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users', {
        params: { roleCode: 'GOVERNMENT_ORG_OFFICER' },
      })
      return data
    },
  })

  const officerOptions = useMemo(() => {
    const items = officers.data ?? []
    return items.filter((user) => {
      if (user.id === values.contactUserId) {
        return true
      }
      if (user.status !== 'ACTIVE') {
        return false
      }
      if (!user.issuingOrganizationId) {
        return true
      }
      return Boolean(initial?.id) && user.issuingOrganizationId === initial?.id
    })
  }, [officers.data, values.contactUserId, initial?.id])

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        phone: emptyToNull(values.phone),
        address: emptyToNull(values.address),
        contactUserId: emptyToNull(values.contactUserId),
        mobile: emptyToNull(values.mobile),
        description: emptyToNull(values.description),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={Building}
      title={initial ? initial.name || t('governmentOrganizations.edit') : t('governmentOrganizations.create')}
      subtitle={initial ? undefined : t('governmentOrganizations.createSubtitle')}
    >
    <AppForm onSubmit={submit} className={formCardBodyClassName}>
      <FormField icon={Building} label={t('governmentOrganizations.name')} htmlFor="name">
        <input
          id="name"
          className={fieldClassName}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          minLength={2}
        />
      </FormField>
      <FormField icon={Phone} label={t('governmentOrganizations.phone')} htmlFor="phone">
        <input
          id="phone"
          className={fieldClassName}
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </FormField>
      <FormField icon={MapPin} label={t('governmentOrganizations.address')} htmlFor="address">
        <textarea
          id="address"
          className={fieldClassName}
          rows={3}
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </FormField>
      <FormField
        icon={UserRound}
        label={t('governmentOrganizations.contactPerson')}
        htmlFor="contactUserId"
      >
        <SearchSelect
          id="contactUserId"
          value={values.contactUserId}
          placeholder={t('governmentOrganizations.selectContactPerson')}
          onChange={(next) => set('contactUserId', next)}
          options={[
            { value: '', label: t('governmentOrganizations.selectContactPerson') },
            ...officerOptions.map((user) => ({
              value: user.id,
              label: user.phone
                ? `${user.fullName} — ${localizeDigits(user.phone, locale)}`
                : user.fullName,
            })),
          ]}
        />
        <p className="text-xs text-ink-500">{t('governmentOrganizations.contactPersonHint')}</p>
      </FormField>
      <FormField icon={Smartphone} label={t('governmentOrganizations.mobile')} htmlFor="mobile">
        <input
          id="mobile"
          className={fieldClassName}
          value={values.mobile}
          onChange={(e) => set('mobile', e.target.value)}
        />
      </FormField>
      <FormField icon={AlignLeft} label={t('governmentOrganizations.description')} htmlFor="description">
        <textarea
          id="description"
          className={fieldClassName}
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <FormActions
        submitLabel={t('governmentOrganizations.save')}
        cancelLabel={t('governmentOrganizations.cancel')}
        submitting={saving}
        onCancel={() => history.back()}
      />
    </AppForm>
    </FormCard>
  )
}
