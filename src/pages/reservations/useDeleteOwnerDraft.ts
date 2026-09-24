import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'

export function useDeleteOwnerDraft() {
  const { t } = useTranslation()
  const { confirmDelete } = useConfirmDelete()
  const queryClient = useQueryClient()

  return (id: string, onDeleted?: () => void, kind: 'draft' | 'cancelled' = 'draft') =>
    confirmDelete({
      message:
        kind === 'cancelled'
          ? t('reservations.confirmDeleteCancelled')
          : t('reservations.confirmDeleteDraft'),
      successMessage:
        kind === 'cancelled'
          ? t('reservations.cancelledDeleted')
          : t('reservations.draftDeleted'),
      path: `/reservations/${id}`,
      queryKey: ['reservations'],
      onDeleted: () => {
        queryClient.removeQueries({ queryKey: ['reservations', id] })
        queryClient.removeQueries({ queryKey: ['reservations', 'open'] })
        onDeleted?.()
      },
    })
}
