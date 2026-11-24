import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const listPersistentQueryKeys = ['q', 'sortBy', 'sortDir'] as const

/** Drops extra list filters; keeps search and column sort. Page resets to 1. */
export function withoutListFilters(searchParams: URLSearchParams) {
  const next = new URLSearchParams()
  for (const key of listPersistentQueryKeys) {
    const value = searchParams.get(key)
    if (value) next.set(key, value)
  }
  return next
}

export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
  const [term, setTerm] = useState(q)

  useEffect(() => {
    setTerm(q)
  }, [q])

  function setParams(
    updates: Record<string, string | undefined>,
    options?: { resetPage?: boolean },
  ) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
    }
    if (options?.resetPage) {
      next.set('page', '1')
    }
    setSearchParams(next)
  }

  function applySearch(nextTerm = term) {
    const trimmed = nextTerm.trim()
    setParams({ q: trimmed || undefined }, { resetPage: true })
  }

  function setPage(nextPage: number) {
    setParams({ page: String(Math.max(1, nextPage)) })
  }

  function clearFilters() {
    setSearchParams(withoutListFilters(searchParams))
  }

  return { q, page, term, setTerm, applySearch, setPage, searchParams, setParams, clearFilters }
}
