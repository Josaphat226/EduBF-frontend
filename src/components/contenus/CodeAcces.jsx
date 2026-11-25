'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { normaliserCode } from '@/lib/contenus'

// « J'ai un code » : pour ouvrir un sujet à partir de la référence imprimée sur une feuille
// (EDU-K7M2QX) sans avoir à scanner le QR code.
export default function CodeAcces() {
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState('')
  const router = useRouter()

  function ouvrir(e) {
    e.preventDefault()
    const code = normaliserCode(saisie)
    if (!code) {
      setErreur('Code non reconnu. Il comporte 6 caractères (par exemple EDU-K7M2QX) et ne contient jamais les lettres I, L, O ni les chiffres 0 et 1.')
      return
    }
    setErreur('')
    router.push(`/s/${code}`)
  }

  return (
    <form className="exo-code" onSubmit={ouvrir}>
      <label htmlFor="exo-code-champ">Vous avez un code ?</label>
      <div className="exo-code-ligne">
        <input
          id="exo-code-champ"
          type="text"
          value={saisie}
          onChange={(e) => { setSaisie(e.target.value); setErreur('') }}
          placeholder="EDU-K7M2QX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={erreur ? 'exo-code-erreur' : undefined}
          aria-invalid={erreur ? 'true' : undefined}
        />
        <button type="submit">Ouvrir</button>
      </div>
      {erreur && <p id="exo-code-erreur" className="exo-code-erreur" role="alert">{erreur}</p>}
    </form>
  )
}