'use client'

import { useState } from 'react'

// Bouton « Filtres » (mobile) qui plie / déplie le cadre des filtres.
// Sur ordinateur, les filtres restent toujours visibles (réglé par le CSS).
export default function FiltresPliables({ nb = 0, children }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <>
      <button
        type="button"
        className={`docs-filtres-toggle-btn ${ouvert ? 'open' : ''}`}
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls="exo-filtres-panel"
      >
        <svg className="docs-filtres-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
        </svg>
        <span className="docs-filtres-toggle-label">Filtres</span>
        {nb > 0 && <span className="docs-filtres-toggle-badge">{nb}</span>}
        <svg className="docs-filtres-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div id="exo-filtres-panel" className={`exo-filtres-zone${ouvert ? ' exo-filtres-ouverts' : ''}`}>
        {children}
      </div>
    </>
  )
}