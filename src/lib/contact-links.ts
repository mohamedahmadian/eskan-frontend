import { Globe, type LucideIcon } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { BaleIcon, EitaaIcon, InstagramIcon, TelegramIcon } from '../components/brand/SocialBrandIcon'
import type { HeadquartersServiceSummary } from '../types/app'
import { displayExternalUrl, toExternalHref, type SocialNetwork } from './social-links'

type SocialIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>

export const headquartersSocials: {
  key: SocialNetwork
  labelKey: string
  Icon: SocialIcon
  className: string
}[] = [
  {
    key: 'website',
    labelKey: 'headquartersInfo.website',
    Icon: Globe,
    className: 'bg-teal-50 text-teal-700 ring-teal-100 hover:bg-teal-100',
  },
  {
    key: 'eitaa',
    labelKey: 'headquartersInfo.eitaa',
    Icon: EitaaIcon,
    className: 'bg-[#FFF4EC] text-[#D65A0C] ring-[#F8D9C4] hover:bg-[#FFE7D4]',
  },
  {
    key: 'bale',
    labelKey: 'headquartersInfo.bale',
    Icon: BaleIcon,
    className: 'bg-mint-50 text-mint-600 ring-mint-100 hover:bg-mint-100',
  },
  {
    key: 'telegram',
    labelKey: 'headquartersInfo.telegram',
    Icon: TelegramIcon,
    className: 'bg-[#EAF6FD] text-[#1A8BC7] ring-[#C5E7F7] hover:bg-[#D7EFFB]',
  },
  {
    key: 'instagram',
    labelKey: 'headquartersInfo.instagram',
    Icon: InstagramIcon,
    className: 'bg-[#FDEEF3] text-[#C13584] ring-[#F5D0E0] hover:bg-[#F9DEE8]',
  },
]

export function brandingSocialLinks(branding?: HeadquartersServiceSummary) {
  return headquartersSocials.flatMap((item) => {
    const value = branding?.[item.key]?.trim()
    if (!value) return []
    return [
      {
        ...item,
        href: toExternalHref(value, item.key),
        display: item.key === 'website' ? displayExternalUrl(value) : value.replace(/^@/, ''),
      },
    ]
  })
}
