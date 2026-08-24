import { KeyRound, Send, X } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppForm,
  Button,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { generateRepeatingDigitPassword } from '../../lib/password'

export function SetUserPasswordModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [password, setPassword] = useState(generateRepeatingDigitPassword)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onSubmit(password)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
        disabled={submitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-user-password-title"
        className={`relative z-10 w-full max-w-md p-6 ${cardClassName}`}
      >
        <h2
          id="set-user-password-title"
          className="mb-4 text-lg font-semibold text-ink-900"
        >
          {t('users.forgotPassword')}
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
          <div className="flex flex-wrap gap-3" dir="ltr">
            <Button type="submit" disabled={submitting}>
              <Send className="size-4" aria-hidden />
              {t('users.changeAndSendPassword')}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              <X className="size-4" aria-hidden />
              {t('common.cancel')}
            </Button>
          </div>
        </AppForm>
      </div>
    </div>
  )
}
