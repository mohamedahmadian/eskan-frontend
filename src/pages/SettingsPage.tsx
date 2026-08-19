import { Globe, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthProvider'
import { AppForm, FormField, FormActions, PageHeader, cardClassName, fieldClassName, formShellClassName } from '../components/ui/Form'
import { SearchSelect } from '../components/ui/SearchSelect'
import { languages, type AppLanguage } from '../i18n'
import { api } from '../lib/api'

export function SettingsPage() {
  const { t } = useTranslation()
  const { user, refresh } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [locale, setLocale] = useState(user?.locale ?? 'fa')
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await api.patch('/auth/settings', { fullName, locale })
      await refresh()
      toast.success(t('settings.saved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <AppForm
        onSubmit={onSubmit}
        className={`space-y-4 p-6 ${cardClassName}`}
      >
        <FormField icon={UserRound} label={t('settings.fullName')} htmlFor="fullName">
          <input
            id="fullName"
            className={fieldClassName}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </FormField>
        <FormField icon={Globe} label={t('settings.locale')} htmlFor="locale">
          <SearchSelect
            id="locale"
            value={locale}
            onChange={setLocale}
            options={(Object.keys(languages) as AppLanguage[]).map((code) => ({
              value: code,
              label: languages[code].enabled
                ? t(`languages.${code}`)
                : `${t(`languages.${code}`)} (${t('settings.comingSoon')})`,
              disabled: !languages[code].enabled,
            }))}
          />
        </FormField>
        <FormActions submitLabel={t('settings.save')} submitting={saving} />
      </AppForm>
    </div>
  )
}
