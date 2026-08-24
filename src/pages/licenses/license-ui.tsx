import { Ban, CheckCircle2, Clock3 } from 'lucide-react'

import { useTranslation } from 'react-i18next'

import type { IssuedLicenseStatus } from '../../types/app'



const statusTone: Record<

  IssuedLicenseStatus,

  { Icon: typeof CheckCircle2; className: string }

> = {

  ISSUED: {

    Icon: Clock3,

    className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',

  },

  APPROVED: {

    Icon: CheckCircle2,

    className: 'bg-mint-100 text-mint-700 ring-1 ring-mint-200',

  },

  REVOKED: {

    Icon: Ban,

    className: 'bg-red-50 text-red-700 ring-1 ring-red-100',

  },

}



export function IssuedLicenseStatusBadge({ status }: { status: IssuedLicenseStatus }) {

  const { t } = useTranslation()

  const tone = statusTone[status] ?? statusTone.ISSUED

  const Icon = tone.Icon



  return (

    <span

      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.className}`}

    >

      <Icon className="size-3.5" aria-hidden />

      {t(`licenses.statuses.${status}`)}

    </span>

  )

}


