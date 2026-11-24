import { IdCard, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { OpenUserPanelButton } from '../../components/auth/OpenUserPanelButton'
import { Button } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser } from '../../types/app'
import { PilgrimCardModal } from '../dashboard/PilgrimCardModal'
import { SetUserPasswordModal } from './SetUserPasswordModal'

export function RoleUserQuickActions({
  user,
  showChangePassword = true,
  showManagerCard = false,
  showOpenPanel = false,
}: {
  user: ManagedUser
  showChangePassword?: boolean
  showManagerCard?: boolean
  showOpenPanel?: boolean
}) {
  const { t } = useTranslation()
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [managerCardOpen, setManagerCardOpen] = useState(false)

  async function submitUserPassword(password: string, sendSms: boolean) {
    if (sendSms && !user.phone) {
      toast.error(t('users.phoneRequiredForSms'))
      return
    }
    setPasswordSaving(true)
    try {
      const { data } = await api.patch<{ ok: true; smsQueued: boolean }>(
        `/users/${user.id}/password`,
        { password, sendSms },
      )
      if (sendSms && data.smsQueued) {
        toast.success(t('users.passwordChangedSmsSent'))
      } else if (sendSms) {
        toast.success(t('users.passwordChanged'))
        toast.error(t('users.passwordChangedSmsFailed'))
      } else {
        toast.success(t('users.passwordChanged'))
      }
      setPasswordModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <>
      {passwordModalOpen ? (
        <SetUserPasswordModal
          submitting={passwordSaving}
          hasPhone={Boolean(user.phone)}
          onClose={() => {
            if (!passwordSaving) setPasswordModalOpen(false)
          }}
          onSubmit={submitUserPassword}
        />
      ) : null}
      {managerCardOpen ? (
        <PilgrimCardModal variant="manager" user={user} onClose={() => setManagerCardOpen(false)} />
      ) : null}
      {showChangePassword ? (
        <Button type="button" variant="soft" onClick={() => setPasswordModalOpen(true)}>
          <KeyRound className="size-4" aria-hidden />
          {t('users.changePassword')}
        </Button>
      ) : null}
      {showManagerCard ? (
        <Button type="button" variant="soft" onClick={() => setManagerCardOpen(true)}>
          <IdCard className="size-4" aria-hidden />
          {t('pilgrims.managerCardTitle')}
        </Button>
      ) : null}
      {showOpenPanel ? (
        <OpenUserPanelButton userId={user.id} status={user.status} />
      ) : null}
    </>
  )
}
