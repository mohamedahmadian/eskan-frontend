export function ShrineMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M36 214h148"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="28" y="168" width="24" height="46" rx="4" fill="currentColor" fillOpacity="0.18" />
      <rect x="168" y="168" width="24" height="46" rx="4" fill="currentColor" fillOpacity="0.18" />
      <rect x="34" y="92" width="12" height="78" rx="6" fill="currentColor" fillOpacity="0.55" />
      <rect x="174" y="92" width="12" height="78" rx="6" fill="currentColor" fillOpacity="0.55" />
      <circle cx="40" cy="86" r="9" fill="#e8b83a" fillOpacity="0.92" />
      <circle cx="180" cy="86" r="9" fill="#e8b83a" fillOpacity="0.92" />
      <path
        d="M110 28c28 22 48 48 48 78H62c0-30 20-56 48-78Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path
        d="M110 36c24 18 40 42 40 70H70c0-28 16-52 40-70Z"
        fill="#e8b83a"
        fillOpacity="0.88"
      />
      <path
        d="M110 22v18"
        stroke="#e8b83a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="110" cy="18" r="5" fill="#e8b83a" />
      <path
        d="M70 108h80v96H70z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M82 128h56v76H82z"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <path
        d="M94 148c0-10 16-10 16 0v56H94v-56Z"
        fill="#f8f7f2"
        fillOpacity="0.22"
      />
      <path
        d="M70 108h80"
        stroke="#e8b83a"
        strokeOpacity="0.7"
        strokeWidth="2"
      />
    </svg>
  )
}
