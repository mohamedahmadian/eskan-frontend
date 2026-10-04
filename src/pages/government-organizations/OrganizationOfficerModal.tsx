import { KeyRound, Smartphone, UserRound, UserRoundPlus } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppForm, FormActions, FormField, fieldClassName } from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage } from '../../lib/api'
import { parseDigitString } from '../../lib/datetime'
import { isPhoneReady } from '../../lib/identity'
import type { ManagedUser } from '../../types/app'

const DEFAULT_PASSWORD = '11111111'

export function OrganizationOfficerModal({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: string
  onClose: () => void
  onCreated: (user: ManagedUser) => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState(DEFAULT_PASSWORD)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving && !event.defaultPrevented) {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [saving, onClose])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const phoneDigits = parseDigitString(phone)
    if (!isPhoneReady(phoneDigits, true)) {
      toast.error(t('governmentOrganizations.officerPhoneInvalid'))
      document.getElementById('officer-phone')?.focus()
      return
    }
    if (password.length < 8) {
      toast.error(t('governmentOrganizations.officerPasswordMin'))
      document.getElementById('officer-password')?.focus()
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post<ManagedUser>(
        `/government-organizations/${organizationId}/officers`,
        {
          phone: phoneDigits,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        },
      )
      toast.success(t('governmentOrganizations.officerCreated'))
      onCreated(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      data-no-form-dblclick=""
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('governmentOrganizations.cancel')}
        disabled={saving}
        onClick={() => {
          if (!saving) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('governmentOrganizations.addOfficer')}
        className="relative z-10 max-h-[min(92vh,44rem)] w-full max-w-lg overflow-y-auto"
      >
        <FormCard
          icon={UserRoundPlus}
          title={t('governmentOrganizations.addOfficer')}
          subtitle={t('governmentOrganizations.addOfficerSubtitle')}
        >
          <AppForm onSubmit={submit} className={formCardBodyClassName} autoFocusFirst>
            <FormField
              icon={Smartphone}
              label={t('governmentOrganizations.officerPhone')}
              htmlFor="officer-phone"
            >
              <input
                id="officer-phone"
                className={`${fieldClassName} digit-field`}
                value={phone}
                inputMode="tel"
                dir="ltr"
                autoComplete="off"
                maxLength={11}
                required
                onChange={(e) => setPhone(parseDigitString(e.target.value).slice(0, 11))}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                icon={UserRound}
                label={t('governmentOrganizations.officerFirstName')}
                htmlFor="officer-first-name"
              >
                <input
                  id="officer-first-name"
                  className={fieldClassName}
                  value={firstName}
                  required
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </FormField>
              <FormField
                icon={UserRound}
                label={t('governmentOrganizations.officerLastName')}
                htmlFor="officer-last-name"
              >
                <input
                  id="officer-last-name"
                  className={fieldClassName}
                  value={lastName}
                  required
                  onChange={(e) => setLastName(e.target.value)}
                />
              </FormField>
            </div>
            <FormField
              icon={KeyRound}
              label={t('governmentOrganizations.officerPassword')}
              htmlFor="officer-password"
            >
              <input
                id="officer-password"
                className={`${fieldClassName} latin-field`}
                value={password}
                dir="ltr"
                autoComplete="off"
                required
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-ink-500">
                {t('governmentOrganizations.officerPasswordHint')}
              </p>
            </FormField>
            <FormActions
              submitLabel={t('governmentOrganizations.save')}
              cancelLabel={t('governmentOrganizations.cancel')}
              submitting={saving}
              onCancel={onClose}
            />
          </AppForm>
        </FormCard>
      </div>
    </div>,
    document.body,
  )
}
