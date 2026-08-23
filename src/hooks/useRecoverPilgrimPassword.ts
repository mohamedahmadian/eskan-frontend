import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../components/ui/confirmToast'
import { api, getApiErrorMessage } from '../lib/api'

export function useRecoverPilgrimPassword() {
  const { t } = useTranslation()

  function recoverPassword() {
    confirmToast({
      title: t('auth.forgotPasswordConfirm'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await api.post('/pilgrims/me/password/recover')
          toast.success(t('auth.forgotPasswordSent'))
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return { recoverPassword }
}
