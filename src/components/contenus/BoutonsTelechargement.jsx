'use client'

import { useEffect, useRef, useState } from 'react'
import { signaler } from '@/lib/contenus'

// Boutons « Télécharger le sujet / le corrigé (PDF) ».
// Un clic ouvre une fenêtre de confirmation ; la confirmation prépare le document dans une page
// invisible (aucun nouvel onglet) puis ouvre la fenêtre d'enregistrement du navigateur.
export default function BoutonsTelechargement({ code }) {
  const [choix, setChoix] = useState(null) // null | 'sujet' | 'corrige'
  const [etat, setEtat] = useState('attente') // attente | preparation | erreur
  const [impression, setImpression] = useState(null) // { corrige, cle } : page invisible en cours de chargement
  const boutonConfirmer = useRef(null)
  const nettoyage = useRef(null)

  const corrige = choix === 'corrige'
  const nom = `EduBF-${code}-${corrige ? 'corrige' : 'sujet'}`

  // Touche Échap pour fermer, sauf pendant la préparation
  useEffect(() => {
    if (!choix) return
    const touche = (e) => { if (e.key === 'Escape' && etat !== 'preparation') fermer() }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  })

  useEffect(() => { if (choix && boutonConfirmer.current) boutonConfirmer.current.focus() }, [choix])

  // Si la page invisible ne répond pas en 20 secondes : message d'erreur
  useEffect(() => {
    if (etat !== 'preparation') return
    const t = setTimeout(() => { setEtat('erreur'); setImpression(null) }, 20000)
    return () => clearTimeout(t)
  }, [etat])

  useEffect(() => () => { if (nettoyage.current) nettoyage.current() }, [])

  function ouvrir(type) { setEtat('attente'); setChoix(type) }
  function fermer() { setChoix(null); setEtat('attente') }

  function confirmer() {
    setEtat('preparation')
    setImpression({ corrige, cle: Date.now() })
  }

  // La page invisible est chargée : on ouvre la fenêtre d'impression / d'enregistrement en PDF
  async function pret(e) {
    const cadre = e.currentTarget
    const fenetre = cadre.contentWindow
    const doc = cadre.contentDocument
    // Certains navigateurs signalent d'abord le chargement d'une page vide : on attend la vraie page d'impression
    if (!fenetre || !doc || !impression || !doc.querySelector('.imp-page')) return
    try {
      if (impression.corrige) doc.querySelectorAll('details.sujet-corrige').forEach((d) => { d.open = true })
      if (doc.fonts && doc.fonts.ready) await doc.fonts.ready
      await new Promise((r) => setTimeout(r, 500)) // laisse aux formules et aux images le temps de se placer

      const titreAvant = document.title
      doc.title = nom
      document.title = nom // le navigateur s'en sert comme nom de fichier proposé
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

            {etat === 'erreur' ? (
              <p className="dl-erreur">
                Impossible de préparer le document. Vérifiez votre connexion et réessayez, ou{' '}
                <a href={`/s/${code}/imprimer${corrige ? '?corrige=1' : ''}`} target="_blank" rel="noopener">ouvrez la version imprimable</a>.
              </p>
            ) : (
              <p>
                {etat === 'preparation'
                  ? 'Préparation du document…'
                  : 'Le document va être préparé. Une fenêtre d’enregistrement s’ouvrira : choisissez « Enregistrer au format PDF » comme imprimante, puis cliquez sur « Enregistrer ».'}
              </p>
            )}

            <div className="dl-actions">
              <button type="button" className="dl-secondaire" disabled={etat === 'preparation'} onClick={fermer}>
                {etat === 'erreur' ? 'Fermer' : 'Annuler'}
              </button>
              {etat !== 'erreur' && (
                <button type="button" ref={boutonConfirmer} className="dl-principal" disabled={etat === 'preparation'} onClick={confirmer}>
                  {etat === 'preparation' ? 'Préparation…' : 'Confirmer le téléchargement'}
                </button>
              )}
              {etat === 'erreur' && <button type="button" className="dl-principal" onClick={confirmer}>Réessayer</button>}
            </div>
          </div>
        </div>
      )}

      {/* Page d'impression chargée en arrière-plan, invisible : aucun nouvel onglet */}
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