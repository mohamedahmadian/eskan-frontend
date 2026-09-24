import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div key={location.pathname} className="flex min-h-full flex-col animate-page-fade-in">
      {children}
    </div>
  )
}
