'use client'

import { useEffect } from 'react'

export default function Modale({ titre, onFermer, children, pied, large = false }) {
  useEffect(() => {
    const touche = (e) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [onFermer])

  return (
    <div className="ed-fond" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer() }}>
      <div className={`ed-modale${large ? ' ed-modale-large' : ''}`} role="dialog" aria-modal="true" aria-label={titre}>
        <div className="ed-modale-tete">
          <h3>{titre}</h3>
          <button type="button" onClick={onFermer} aria-label="Fermer">✕</button>
        </div>
        <div className="ed-modale-corps">{children}</div>
        {pied && <div className="ed-modale-pied">{pied}</div>}
      </div>
    </div>
  )
}