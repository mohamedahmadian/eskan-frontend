import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import { confirmToast } from '../../components/ui/confirmToast'
import { api, getApiErrorMessage } from '../../lib/api'

export function useWithdrawHonoraryService() {
  const { t } = useTranslation()
  const { refresh } = useAuth()
  const queryClient = useQueryClient()

  function withdraw(id: string, onDone?: () => void) {
    confirmToast({
      title: t('honoraryServants.confirmWithdraw'),
      confirmLabel: t('honoraryServants.yesWithdraw'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/honorary-servants/mine/${id}`)
          toast.success(t('honoraryServants.withdrawn'))
          await refresh()
          await queryClient.invalidateQueries({ queryKey: ['honorary-servants'] })
          await queryClient.invalidateQueries({ queryKey: ['honorary-servant'] })
          await queryClient.invalidateQueries({ queryKey: ['reservations'] })
          onDone?.()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return { withdraw }
}
