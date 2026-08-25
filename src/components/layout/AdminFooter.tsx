import { Globe, Phone, type LucideIcon } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { BaleIcon, EitaaIcon, InstagramIcon, TelegramIcon } from '../brand/SocialBrandIcon'
import { localizeDigits, parseDigitString } from '../../lib/datetime'
import { displayExternalUrl, toExternalHref, type SocialNetwork } from '../../lib/social-links'
import type { HeadquartersServiceSummary } from '../../types/app'

type SocialIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>

const socials: {
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

export function AdminFooter({
  branding,
  compactEnd,
}: {
  branding?: HeadquartersServiceSummary
  compactEnd?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const phones = (branding?.phones ?? []).filter((item) => item.phone.trim())
  const links = socials.flatMap((item) => {
    const value = branding?.[item.key]?.trim()
    if (!value) return []
    return [
      {
        ...item,
        href: toExternalHref(value, item.key),
        display: item.key === 'website' ? displayExternalUrl(value) : undefined,
      },
    ]
  })

  if (!phones.length && !links.length) {
    return null
  }

  return (
    <footer
      aria-label={t('nav.contactFooter')}
      className={`shrink-0 border-t border-line bg-white/90 px-4 py-2 backdrop-blur sm:px-8 ${
        compactEnd ? 'pe-20 sm:pe-24' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {phones.map((item) => {
          const latin = parseDigitString(item.phone)
          const phoneLabel = localizeDigits(item.phone, locale)
          const content = (
            <>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 ring-1 ring-teal-100">
                <Phone className="size-3" aria-hidden />
              </span>
              <span className="flex min-w-0 items-center gap-1">
                {item.department ? (
                  <span className="truncate font-medium text-ink-600">{item.department}</span>
                ) : (
                  <span className="sr-only">{t('headquartersPhones.phone')}</span>
                )}
                <span dir="ltr" className="whitespace-nowrap font-semibold">
                  {phoneLabel}
                </span>
              </span>
            </>
          )
          const className =
            'inline-flex max-w-full items-center gap-1.5 rounded-full bg-teal-50 px-2 py-1 text-[11px] text-teal-800 ring-1 ring-teal-100 transition hover:bg-teal-100'
          if (!latin) {
            return (
              <span key={item.id} className={className}>
                {content}
              </span>
            )
          }
          return (
            <a key={item.id} href={`tel:${latin}`} className={className}>
              {content}
            </a>
          )
        })}
        {phones.length > 0 && links.length > 0 ? (
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
        ) : null}
        {links.map((item) => {
          const Icon = item.Icon
          return (
            <a
              key={item.key}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={item.display ? `${t(item.labelKey)} ${item.display}` : t(item.labelKey)}
              aria-label={item.display ? `${t(item.labelKey)} ${item.display}` : t(item.labelKey)}
              className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 ring-1 transition ${item.className}`}
            >
              <span className="flex size-5 items-center justify-center">
                <Icon className="size-3.5" />
              </span>
              {item.display ? (
                <span dir="ltr" className="hidden max-w-[10rem] truncate text-[11px] font-medium sm:inline">
                  {item.display}
                </span>
              ) : (
                <span className="hidden text-[11px] font-medium sm:inline">{t(item.labelKey)}</span>
              )}
            </a>
          )
        })}
      </div>
    </footer>
  )
}
