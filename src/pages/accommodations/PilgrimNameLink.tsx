import { Link } from 'react-router-dom'

export function pilgrimDetailsTo(id: string) {
  return `/pilgrims/${id}`
}

export function PilgrimNameLink({
  id,
  name,
  className = '',
}: {
  id?: string | null
  name: string
  className?: string
}) {
  if (!id) {
    return <span className={className}>{name}</span>
  }

  return (
    <Link
      to={pilgrimDetailsTo(id)}
      className={`cursor-pointer font-medium text-teal-700 hover:underline ${className}`.trim()}
    >
      {name}
    </Link>
  )
}
