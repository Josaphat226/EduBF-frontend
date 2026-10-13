'use client'

import { useRouter } from 'next/navigation'

export default function RetourButton() {
  const router = useRouter()

  return (
    <button type="button" onClick={() => router.back()} className="btn-retour" style={{ marginBottom: '2rem' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Retour
    </button>
  )
}