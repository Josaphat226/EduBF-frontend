'use client'

import { useEffect, useRef, useState } from 'react'
import { signaler } from '@/lib/contenus'

// Boutons « Télécharger le sujet / le corrigé (PDF) ».
// Si le PDF a déjà été fabriqué (prop `pdf`), il est téléchargé directement (marche sur mobile).
// Sinon, sur ordinateur : ancienne méthode par impression ; sur mobile : message « en préparation ».
export default function BoutonsTelechargement({ code, pdf }) {
  const [choix, setChoix] = useState(null) // null | 'sujet' | 'corrige'
  const [etat, setEtat] = useState('attente') // attente | preparation | erreur | indisponible
  const [impression, setImpression] = useState(null)
  const [mobile, setMobile] = useState(false)
  const boutonConfirmer = useRef(null)
  const nettoyage = useRef(null)

  const corrige = choix === 'corrige'
  const nom = `EduBF-${code}-${corrige ? 'corrige' : 'sujet'}`
  const pdfPret = !!(pdf && (corrige ? pdf.corrige : pdf.sujet))

  useEffect(() => {
    setMobile(window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (!choix) return
    const touche = (e) => { if (e.key === 'Escape' && etat !== 'preparation') fermer() }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  })

  useEffect(() => { if (choix && boutonConfirmer.current) boutonConfirmer.current.focus() }, [choix])

  useEffect(() => {
    if (etat !== 'preparation') return
    const t = setTimeout(() => { setEtat('erreur'); setImpression(null) }, 20000)
    return () => clearTimeout(t)
  }, [etat])

  useEffect(() => () => { if (nettoyage.current) nettoyage.current() }, [])

  function ouvrir(type) { setEtat('attente'); setChoix(type) }
  function fermer() { setChoix(null); setEtat('attente') }

  function confirmer() {
    if (pdfPret) {
      signaler(code, corrige ? 'telechargement_corrige' : 'telechargement_sujet')
      window.location.href = `/api/contenus/${code}/pdf/${corrige ? 'corrige' : 'sujet'}`
      setTimeout(fermer, 800)
      return
    }
    if (mobile) { setEtat('indisponible'); return }
    setEtat('preparation')
    setImpression({ corrige, cle: Date.now() })
  }

  async function pret(e) {
    const cadre = e.currentTarget
    const fenetre = cadre.contentWindow
    const doc = cadre.contentDocument
    if (!fenetre || !doc || !impression || !doc.querySelector('.imp-page')) return
    try {
      if (impression.corrige) doc.querySelectorAll('details.sujet-corrige').forEach((d) => { d.open = true })
      if (doc.fonts && doc.fonts.ready) await doc.fonts.ready
      await new Promise((r) => setTimeout(r, 500))

      const titreAvant = document.title
      doc.title = nom
      document.title = nom
      const fin = () => {
        document.title = titreAvant
        fenetre.removeEventListener('afterprint', fin)
        clearTimeout(secours)
        nettoyage.current = null
        setImpression(null)
      }
      const secours = setTimeout(fin, 120000)
      nettoyage.current = fin
      fenetre.addEventListener('afterprint', fin)

      signaler(code, impression.corrige ? 'telechargement_corrige' : 'telechargement_sujet')
      setChoix(null)
      setEtat('attente')
      fenetre.focus()
      fenetre.print()
    } catch {
      setEtat('erreur')
      setImpression(null)
    }
  }

  const termine = etat === 'erreur' || etat === 'indisponible'

  return (
    <>
      <div className="sujet-telecharger">
        <button type="button" onClick={() => ouvrir('sujet')}>⬇ Télécharger le sujet (PDF)</button>
        <button type="button" onClick={() => ouvrir('corrige')}>⬇ Télécharger le corrigé (PDF)</button>
      </div>

      {choix && (
        <div className="dl-fond" onMouseDown={(e) => { if (e.target === e.currentTarget && etat !== 'preparation') fermer() }}>
          <div className="dl-modale" role="dialog" aria-modal="true" aria-labelledby="dl-titre">
            <h3 id="dl-titre">Télécharger {corrige ? 'le corrigé' : 'le sujet'} en PDF</h3>

            {etat === 'indisponible' ? (
              <p className="dl-erreur">Le PDF de ce document est en cours de préparation. Merci de réessayer dans quelques heures.</p>
            ) : etat === 'erreur' ? (
              <p className="dl-erreur">
                Impossible de préparer le document. Vérifiez votre connexion et réessayez, ou{' '}
                <a href={`/s/${code}/imprimer${corrige ? '?corrige=1' : ''}`} target="_blank" rel="noopener">ouvrez la version imprimable</a>.
              </p>
            ) : (
              <p>
                {etat === 'preparation'
                  ? 'Préparation du document…'
                  : pdfPret
                  ? 'Le PDF va être téléchargé sur votre appareil.'
                  : 'Le document va être préparé. Une fenêtre d’enregistrement s’ouvrira : choisissez « Enregistrer au format PDF » comme imprimante, puis cliquez sur « Enregistrer ».'}
              </p>
            )}

            <div className="dl-actions">
              <button type="button" className="dl-secondaire" disabled={etat === 'preparation'} onClick={fermer}>
                {termine ? 'Fermer' : 'Annuler'}
              </button>
              {!termine && (
                <button type="button" ref={boutonConfirmer} className="dl-principal" disabled={etat === 'preparation'} onClick={confirmer}>
                  {etat === 'preparation' ? 'Préparation…' : 'Confirmer le téléchargement'}
                </button>
              )}
              {etat === 'erreur' && <button type="button" className="dl-principal" onClick={confirmer}>Réessayer</button>}
            </div>
          </div>
        </div>
      )}

      {impression && (
        <iframe
          key={impression.cle}
          title="Préparation du PDF"
          aria-hidden="true"
          tabIndex={-1}
          className="dl-cadre"
          src={`/s/${code}/imprimer${impression.corrige ? '?corrige=1' : ''}`}
          onLoad={pret}
        />
      )}
    </>
  )
}