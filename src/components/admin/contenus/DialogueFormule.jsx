'use client'

import { useRef, useState } from 'react'
import katex from 'katex'
import Modale from './Modale'

const PALETTE = [
  ['Fraction', '\\frac{a}{b}'], ['Racine', '\\sqrt{x}'], ['Racine n-ième', '\\sqrt[n]{x}'], ['Puissance', '^{2}'], ['Indice', '_{n}'],
  ['Somme', '\\sum_{i=1}^{n}'], ['Intégrale', '\\int_{a}^{b}'], ['Limite', '\\lim_{x \\to +\\infty}'], ['Vecteur', '\\vec{u}'], ['Valeur absolue', '\\left|x\\right|'],
  ['≤', '\\leq '], ['≥', '\\geq '], ['≠', '\\neq '], ['≈', '\\approx '], ['×', '\\times '], ['÷', '\\div '], ['±', '\\pm '], ['→', '\\rightarrow '], ['∞', '\\infty '],
  ['π', '\\pi '], ['α', '\\alpha '], ['β', '\\beta '], ['θ', '\\theta '], ['λ', '\\lambda '], ['Δ', '\\Delta '], ['Ω', '\\Omega '], ['°', '^{\\circ}'],
]

export default function DialogueFormule({ bloc, initial = '', onValider, onFermer }) {
  const [latex, setLatex] = useState(initial)
  const zone = useRef(null)

  let html = ''
  let erreur = ''
  if (latex.trim()) {
    try { html = katex.renderToString(latex, { displayMode: bloc, throwOnError: true }) }
    catch (e) { erreur = String(e.message).replace(/^KaTeX parse error: /, '') }
  }

  function inserer(texte) {
    const z = zone.current
    const debut = z.selectionStart
    const fin = z.selectionEnd
    setLatex(latex.slice(0, debut) + texte + latex.slice(fin))
    requestAnimationFrame(() => { z.focus(); z.setSelectionRange(debut + texte.length, debut + texte.length) })
  }

  const valide = latex.trim() && !erreur
  return (
    <Modale
      titre={bloc ? 'Formule (sur sa propre ligne)' : 'Formule (dans le texte)'}
      onFermer={onFermer}
      pied={<>
        <button type="button" className="btn-admin btn-admin-ghost" onClick={onFermer}>Annuler</button>
        <button type="button" className="btn-admin btn-admin-primary" disabled={!valide} onClick={() => onValider(latex.trim())}>Valider</button>
      </>}
    >
      <p className="ctn-aide">Cliquez sur les boutons pour construire la formule, puis remplacez les lettres (a, b, x, n…) par vos valeurs.</p>
      <div className="ed-palette">
        {PALETTE.map(([nom, code]) => (
          <button type="button" key={nom} title={nom} onClick={() => inserer(code)}>{nom}</button>
        ))}
      </div>
      <textarea ref={zone} rows="3" value={latex} onChange={(e) => setLatex(e.target.value)} placeholder="Ex : \frac{a}{b}" spellCheck={false} className="ed-latex" />
      <div className="ed-apercu-formule" aria-live="polite">
        {erreur ? <span className="ctn-erreur">Formule incorrecte : {erreur}</span>
          : html ? <span dangerouslySetInnerHTML={{ __html: html }} />
          : <span className="ctn-aide">L’aperçu apparaît ici.</span>}
      </div>
    </Modale>
  )
}