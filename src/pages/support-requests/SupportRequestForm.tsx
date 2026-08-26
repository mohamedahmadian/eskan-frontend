import {
  AlignLeft,
  Building,
  CalendarDays,
  ClipboardList,
  Hash,
  HandHeart,
  Landmark,
  Package,
} from 'lucide-react'
import { DateObject } from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import { type FormEvent, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, FormSectionTitle, formCardBodyClassName } from '../../components/ui/FormLayout'
import { PersianDateField } from '../../components/ui/PersianDateField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { toIsoDateOnly } from '../../lib/datetime'
import { isAdmin } from '../../lib/roles'
import type {
  GovernmentOrganization,
  SupportRequest,
  SupportRequestStatus,
  SupportRequestType,
} from '../../types/app'
import { supportRequestStatuses, supportRequestTypes } from '../../types/app'

export type SupportRequestPayload = {
  organizationId?: string
  type: SupportRequestType
  subject: string
  quantity: number | null
  requestedAt: string
  neededBy: string | null
  description: string | null
  status?: SupportRequestStatus
  handlingOrganizationId?: string | null
  handledAt?: string | null
  handlingNotes?: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function todayIso() {
  return toIsoDateOnly(new DateObject({ calendar: gregorian }))
}

function parseQuantity(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : Number.NaN
}

export function SupportRequestForm({
  initial,
  onSubmit,
}: {
  initial?: SupportRequest
  onSubmit: (payload: SupportRequestPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    organizationId: initial?.organizationId ?? '',
    type: (initial?.type ?? supportRequestTypes.GOODS) as SupportRequestType,
    subject: initial?.subject ?? '',
    quantity: initial?.quantity != null ? String(initial.quantity) : '',
    requestedAt: initial?.requestedAt ?? todayIso(),
    neededBy: initial?.neededBy ?? '',
    description: initial?.description ?? '',
    status: (initial?.status ?? supportRequestStatuses.PENDING) as SupportRequestStatus,
    handlingOrganizationId: initial?.handlingOrganizationId ?? '',
    handledAt: initial?.handledAt ?? '',
    handlingNotes: initial?.handlingNotes ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const organizations = useQuery({
    queryKey: ['government-organizations', 'lookup'],
    enabled: admin,
    queryFn: async () => {
      const { data } = await api.get<GovernmentOrganization[]>('/government-organizations')
      return data
    },
  })

  const orgOptions = useMemo(
    () =>
      (organizations.data ?? []).map((organization) => ({
        value: organization.id,
        label: organization.name,
      })),
    [organizations.data],
  )

  const subjectLabel = t(`supportRequests.subjectByType.${values.type}`)
  const quantityLabel = t(`supportRequests.quantityByType.${values.type}`)
  const showHandling = Boolean(admin && initial)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (admin && !values.organizationId) {
      toast.error(t('supportRequests.organizationRequired'))
      return
    }
    if (!admin && !user?.issuingOrganization) {
      toast.error(t('supportRequests.organizationMissing'))
      return
    }
    if (!values.requestedAt) {
      toast.error(t('supportRequests.requestedAtRequired'))
      return
    }
    const quantity = parseQuantity(values.quantity)
    if (Number.isNaN(quantity)) {
      toast.error(t('supportRequests.quantityInvalid'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        ...(admin ? { organizationId: values.organizationId } : {}),
        type: values.type,
        subject: values.subject.trim(),
        quantity,
        requestedAt: values.requestedAt,
        neededBy: emptyToNull(values.neededBy),
        description: emptyToNull(values.description),
        ...(showHandling
          ? {
              status: values.status,
              handlingOrganizationId: emptyToNull(values.handlingOrganizationId),
              handledAt: emptyToNull(values.handledAt),
              handlingNotes: emptyToNull(values.handlingNotes),
            }
          : {}),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={HandHeart}
      title={initial ? initial.subject : t('supportRequests.create')}
      subtitle={initial ? undefined : t('supportRequests.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormSectionTitle icon={ClipboardList}>{t('supportRequests.requestSection')}</FormSectionTitle>
        {admin ? (
          <FormField
            icon={Building}
            label={t('supportRequests.organization')}
            htmlFor="organizationId"
          >
            <SearchSelect
              id="organizationId"
              value={values.organizationId}
              required
              onChange={(next) => set('organizationId', next)}
              placeholder={t('supportRequests.selectOrganization')}
              options={[
                { value: '', label: t('supportRequests.selectOrganization') },
                ...orgOptions,
              ]}
            />
          </FormField>
        ) : (
          <FormField icon={Building} label={t('supportRequests.organization')} htmlFor="organizationName">
            <input
              id="organizationName"
              className={fieldClassName}
              value={user?.issuingOrganization?.name ?? ''}
              readOnly
            />
          </FormField>
        )}
        <FormField icon={Package} label={t('supportRequests.type')} htmlFor="type">
          <SearchSelect
            id="type"
            value={values.type}
            required
            onChange={(next) => set('type', next as SupportRequestType)}
            placeholder={t('supportRequests.selectType')}
            options={Object.values(supportRequestTypes).map((type) => ({
              value: type,
              label: t(`supportRequests.types.${type}`),
            }))}
          />
        </FormField>
        <FormField icon={HandHeart} label={subjectLabel} htmlFor="subject">
          <input
            id="subject"
            className={fieldClassName}
            value={values.subject}
            onChange={(e) => set('subject', e.target.value)}
            required
            minLength={2}
          />
        </FormField>
        <FormField icon={Hash} label={quantityLabel} htmlFor="quantity">
          <input
            id="quantity"
            type="number"
            min={1}
            className={fieldClassName}
            value={values.quantity}
            onChange={(e) => set('quantity', e.target.value)}
          />
        </FormField>
        <FormField icon={CalendarDays} label={t('supportRequests.requestedAt')} htmlFor="requestedAt">
          <PersianDateField
            id="requestedAt"
            value={values.requestedAt}
            onChange={(next) => set('requestedAt', next ?? '')}
          />
        </FormField>
        <FormField icon={CalendarDays} label={t('supportRequests.neededBy')} htmlFor="neededBy">
          <PersianDateField
            id="neededBy"
            value={values.neededBy || undefined}
            onChange={(next) => set('neededBy', next ?? '')}
          />
        </FormField>
        <FormField icon={AlignLeft} label={t('supportRequests.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormField>

        {showHandling ? (
          <>
            <FormSectionTitle icon={Landmark}>{t('supportRequests.handlingSection')}</FormSectionTitle>
            <FormField icon={ClipboardList} label={t('supportRequests.status')} htmlFor="status">
              <SearchSelect
                id="status"
                value={values.status}
                required
                onChange={(next) => set('status', next as SupportRequestStatus)}
                options={Object.values(supportRequestStatuses).map((status) => ({
                  value: status,
                  label: t(`supportRequests.statuses.${status}`),
                }))}
              />
            </FormField>
            <FormField
              icon={Building}
              label={t('supportRequests.handlingOrganization')}
              htmlFor="handlingOrganizationId"
            >
              <SearchSelect
                id="handlingOrganizationId"
                value={values.handlingOrganizationId}
                onChange={(next) => set('handlingOrganizationId', next)}
                placeholder={t('supportRequests.selectHandlingOrganization')}
                options={[
                  { value: '', label: t('supportRequests.selectHandlingOrganization') },
                  ...orgOptions,
                ]}
              />
            </FormField>
            <FormField icon={CalendarDays} label={t('supportRequests.handledAt')} htmlFor="handledAt">
              <PersianDateField
                id="handledAt"
                value={values.handledAt || undefined}
                onChange={(next) => set('handledAt', next ?? '')}
              />
            </FormField>
            <FormField
              icon={AlignLeft}
              label={t('supportRequests.handlingNotes')}
              htmlFor="handlingNotes"
            >
              <textarea
                id="handlingNotes"
                className={fieldClassName}
                rows={4}
                value={values.handlingNotes}
                onChange={(e) => set('handlingNotes', e.target.value)}
              />
            </FormField>
          </>
        ) : null}

        <FormActions
          submitLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
