import { KeyRound, MessageSquare } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppModal } from '../../components/ui/AppModal'
import { CheckboxField } from '../../components/ui/CheckboxField'
import {
  AppForm,
  FormActions,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { generateRepeatingDigitPassword } from '../../lib/password'

export function SetUserPasswordModal({
  submitting,
  hasPhone,
  onClose,
  onSubmit,
}: {
  submitting: boolean
  hasPhone: boolean
  onClose: () => void
  onSubmit: (password: string, sendSms: boolean) => Promise<void>
}) {
  const { t } = useTranslation()
  const [password, setPassword] = useState(generateRepeatingDigitPassword)
  const [sendSms, setSendSms] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onSubmit(password, sendSms)
  }

  return (
    <AppModal
      onClose={onClose}
      closeDisabled={submitting}
      labelledBy="set-user-password-title"
      zClassName="z-50"
      overlayClassName="flex items-center justify-center px-4"
      className={`w-full max-w-md p-6 ${cardClassName}`}
    >
        <h2
          id="set-user-password-title"
          className="mb-4 pe-12 text-lg font-semibold text-ink-900"
        >
          {t('users.changePassword')}
        </h2>
        <AppForm onSubmit={submit} className="space-y-4">
          <FormField
            icon={KeyRound}
            label={t('users.newPassword')}
            htmlFor="set-user-password"
          >
            <input
              ref={inputRef}
              id="set-user-password"
              type="text"
              className={fieldClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              dir="ltr"
            />
          </FormField>
          <FormField icon={MessageSquare} label={t('sms.send')}>
            <CheckboxField
              id="send-user-password-sms"
              checked={sendSms}
              disabled={!hasPhone}
              onChange={setSendSms}
              label={
                hasPhone
                  ? t('users.sendPasswordSms')
                  : t('users.phoneRequiredForSms')
              }
            />
          </FormField>
          <FormActions
            submitLabel={t('users.changePassword')}
            cancelLabel={t('common.cancel')}
            submitting={submitting}
            onCancel={onClose}
          />
        </AppForm>
    </AppModal>
  )
}
