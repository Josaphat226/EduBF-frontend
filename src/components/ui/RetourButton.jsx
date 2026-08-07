'use client'

import { useRouter } from 'next/navigation'

export default function RetourButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.4rem',
        background: 'none',
        border: 'none',
        color: 'var(--primary)',
        fontSize: '.9rem',
        fontWeight: 600,
        cursor: 'pointer',
        padding: 0,
        marginBottom: '2rem',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Retour
    </button>
  )
}