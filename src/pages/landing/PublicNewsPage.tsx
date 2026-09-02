import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { LoadingState } from '../../components/ui/Form'
import { FormEmptyHint } from '../../components/ui/FormLayout'
import { api } from '../../lib/api'
import type { HeadquartersNews } from '../../types/app'
import { LandingShell } from './LandingShell'

export function PublicNewsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const query = useQuery({
    queryKey: ['public', 'headquarters-news', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersNews>(`/headquarters-news/published/${id}`)
      return data
    },
  })

  return (
    <LandingShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-8">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 rounded-2xl text-sm font-medium text-teal-700 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        >
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {t('common.back')}
        </Link>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <FormEmptyHint>{t('landing.news.notFound')}</FormEmptyHint> : null}
        {query.data ? (
          <div className="mt-6 rounded-[28px] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(20,40,40,0.06)] sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs text-ink-400">
              <Newspaper className="size-3.5 text-teal-600" aria-hidden />
              <CalendarDays className="size-3.5" aria-hidden />
              <DateText value={query.data.publishedAt} />
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-9 text-ink-900">{query.data.title}</h1>
            {query.data.summary ? (
              <p className="mt-3 text-sm leading-8 text-ink-500">{query.data.summary}</p>
            ) : null}
            <p className="mt-6 whitespace-pre-wrap text-sm leading-8 text-ink-700">{query.data.body}</p>
          </div>
        ) : null}
      </article>
    </LandingShell>
  )
}
