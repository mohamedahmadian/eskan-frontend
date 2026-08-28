import { useTranslation } from 'react-i18next'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'

export function useDeleteOwnerDraft() {
  const { t } = useTranslation()
  const { confirmDelete } = useConfirmDelete()

  return (id: string) =>
    confirmDelete({
      message: t('reservations.confirmDeleteDraft'),
      successMessage: t('reservations.draftDeleted'),
      path: `/reservations/${id}`,
      queryKey: ['reservations'],
    })
}
