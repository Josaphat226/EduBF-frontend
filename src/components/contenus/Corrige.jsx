'use client'

import { useRef } from 'react'
import { signaler } from '@/lib/contenus'

// Corrigé replié sous la question. Le contenu est déjà dans la page (rendu serveur) :
// il reste donc lisible par les moteurs de recherche et sans JavaScript.
// La première ouverture sur la page est comptée comme « consultation du corrigé ».
export default function Corrige({ code, children }) {
  const compte = useRef(false)

  function surBascule(e) {
    if (e.currentTarget.open && !compte.current) {
      compte.current = true
      signaler(code, 'vue_corrige')
    }
  }

  return (
    <details className="sujet-corrige" onToggle={surBascule}>
      <summary>Voir le corrigé</summary>
      <div className="sujet-corrige-corps">{children}</div>
    </details>
  )
}