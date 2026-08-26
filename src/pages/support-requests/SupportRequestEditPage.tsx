import { HandHeart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthProvider'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import { isAdmin } from '../../lib/roles'
import type { SupportRequest } from '../../types/app'
import { SupportRequestForm } from './SupportRequestForm'

export function SupportRequestEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const admin = isAdmin(user)
  const item = useQuery({
    queryKey: ['support-request', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<SupportRequest>(`/support-requests/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  if (!admin && item.data.status !== 'PENDING') {
    return <Navigate to={`/support-requests/${item.data.id}`} replace />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('supportRequests.edit')}
        subtitle={<EntityNameSubtitle name={item.data.subject} icon={HandHeart} />}
      />
      <SupportRequestForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/support-requests/${id}`, payload)
          toast.success(t('supportRequests.updated'))
          navigate(`/support-requests/${id}`)
        }}
      />
    </div>
  )
}
