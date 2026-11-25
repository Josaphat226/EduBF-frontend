'use client'

import { useEffect } from 'react'
import { signaler } from '@/lib/contenus'

// Barre d'actions de la page d'impression (masquée à l'impression).
export default function ImpressionActions({ code, corrige }) {
  // Dans la version « corrigé », tous les corrigés sont ouverts à l'écran et à l'impression
  useEffect(() => {
    if (!corrige) return
    const ouvrir = () => document.querySelectorAll('details.sujet-corrige').forEach((d) => { d.open = true })
    ouvrir()
    window.addEventListener('beforeprint', ouvrir)
    return () => window.removeEventListener('beforeprint', ouvrir)
  }, [corrige])

  function imprimer() {
    signaler(code, corrige ? 'telechargement_corrige' : 'telechargement_sujet')
    window.print()
  }

  return (
    <div className="imp-actions">
      <button type="button" onClick={imprimer}>Imprimer / Enregistrer en PDF</button>
      <a href={corrige ? `/s/${code}/imprimer` : `/s/${code}/imprimer?corrige=1`}>{corrige ? 'Voir le sujet seul' : 'Voir le corrigé'}</a>
      <a href={`/s/${code}`}>← Retour au sujet</a>
      <p>Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF » comme imprimante.</p>
    </div>
  )
}