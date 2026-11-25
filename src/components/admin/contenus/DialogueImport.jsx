'use client'

import { useMemo, useState } from 'react'
import Modale from './Modale'
import { analyserSujet, associerCorriges, separerSujetCorrige, documentEstVide, CONSIGNE_IA, CONSIGNE_CORRIGE } from '@/components/contenus/editeur/importer'
import { formaterPoints } from '@/lib/contenus'

// Copie un texte dans le presse-papiers (avec une solution de secours pour les anciens navigateurs)
async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte)
    return true
  } catch {
    const z = document.createElement('textarea')
    z.value = texte
    z.style.position = 'fixed'
    z.style.opacity = '0'
    document.body.appendChild(z)
    z.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(z)
    return ok
  }
}

export default function DialogueImport({ doc, onImporter, onFermer }) {
  const [texteSujet, setTexteSujet] = useState('')
  const [texteCorrige, setTexteCorrige] = useState('')
  const [mode, setMode] = useState('remplacer')
  const [copie, setCopie] = useState('') // '', 'sujet' ou 'corrige' : bouton qui vient d'être cliqué
  const vide = documentEstVide(doc)

  // Si le corrigé a été collé dans la zone du sujet (« PARTIE 2 : CORRIGÉS »…), il est détecté tout seul
  const separe = useMemo(() => separerSujetCorrige(texteSujet), [texteSujet])
  const corrigeUtilise = texteCorrige.trim() ? texteCorrige : separe.corrige
  const corrigeDetecte = !texteCorrige.trim() && Boolean(separe.corrige.trim())

  // Le sujet et le corrigé sont analysés séparément, puis chaque réponse est placée sous sa question
  const analyse = useMemo(() => {
    if (!separe.sujet.trim()) return null
    const sujet = analyserSujet(separe.sujet)
    if (!corrigeUtilise.trim()) return sujet
    return associerCorriges(sujet, analyserSujet(corrigeUtilise, { corrigeSeul: true }))
  }, [separe, corrigeUtilise])

  const r = analyse && analyse.resume
  const importable = Boolean(analyse && r.exercices > 0)

  async function copierConsigne(quelle) {
    if (await copier(quelle === 'sujet' ? CONSIGNE_IA : CONSIGNE_CORRIGE)) {
      setCopie(quelle)
      setTimeout(() => setCopie(''), 2500)
    }
  }

  async function coller(setTexte) {
    try { setTexte(await navigator.clipboard.readText()) } catch { /* autorisation refusée : on colle à la main */ }
  }

  return (
    <Modale
      large
      titre="Coller un sujet et son corrigé"
      onFermer={onFermer}
      pied={<>
        <button type="button" className="btn-admin btn-admin-ghost" onClick={onFermer}>Annuler</button>
        <button type="button" className="btn-admin btn-admin-primary" disabled={!importable} onClick={() => onImporter(analyse, vide ? 'remplacer' : mode)}>
          Importer dans l’éditeur
        </button>
      </>}
    >
      <ol className="ed-import-etapes">
        <li>Zone de gauche : copiez la consigne « sujet », donnez-la à votre IA avec votre demande (classe, matière, chapitre…), puis collez le sujet obtenu. Si l’IA a écrit le sujet et le corrigé dans la même réponse, collez tout ici : le corrigé est détecté tout seul.</li>
        <li>Zone de droite (seulement si le corrigé est séparé) : donnez à l’IA la consigne « corrigé », puis collez le corrigé obtenu.</li>
        <li>Le système place automatiquement chaque réponse sous la bonne question. Vous pourrez tout corriger ensuite dans l’éditeur.</li>
      </ol>

      <div className="ed-import-deux">
        <div className="ed-import-colonne">
          <div className="ed-import-entete">
            <label htmlFor="ed-import-sujet">① Sujet</label>
            <span>
              <button type="button" className="btn-admin btn-admin-ghost" onClick={() => copierConsigne('sujet')}>{copie === 'sujet' ? '✓ Copiée' : '📋 Consigne « sujet »'}</button>
              {' '}
              <button type="button" className="ctn-lien-action" onClick={() => coller(setTexteSujet)}>Coller</button>
            </span>
          </div>
          <textarea
            id="ed-import-sujet"
            className="ed-import-zone"
            value={texteSujet}
            onChange={(e) => setTexteSujet(e.target.value)}
            placeholder={'# Partie I : …\n\n## Exercice 1 : … (4 points)\n1. Question… (2 points)\n2. Question…'}
            spellCheck={false}
            autoFocus
          />
        </div>

        <div className="ed-import-colonne">
          <div className="ed-import-entete">
            <label htmlFor="ed-import-corrige">② Corrigé complet</label>
            <span>
              <button type="button" className="btn-admin btn-admin-ghost" onClick={() => copierConsigne('corrige')}>{copie === 'corrige' ? '✓ Copiée' : '📋 Consigne « corrigé »'}</button>
              {' '}
              <button type="button" className="ctn-lien-action" onClick={() => coller(setTexteCorrige)}>Coller</button>
            </span>
          </div>
          <textarea
            id="ed-import-corrige"
            className="ed-import-zone"
            value={texteCorrige}
            onChange={(e) => setTexteCorrige(e.target.value)}
            placeholder={'## Exercice 1\n1. Réponse : …\n2. …\n\n## Exercice 2\n1.\na) …\nb) …'}
            spellCheck={false}
          />
        </div>
      </div>

      {analyse && (
        <div className="ed-import-resume" aria-live="polite">
          <strong>Ce qui sera importé :</strong>{' '}
          {r.parties} partie(s) · {r.exercices} exercice(s) · {r.questions} question(s) · {r.formules} formule(s)
          {' · '}{r.points > 0 ? formaterPoints(r.points) : 'sans points'}
          {r.consignes && ' · consignes générales'}
          {corrigeDetecte && <em> (corrigé détecté dans la zone ①)</em>}
          {' · '}
          <strong>{r.aAssocier !== undefined ? `${analyse.associes} corrigé(s) associé(s) sur ${analyse.total}` : `${r.corriges} corrigé(s)`}</strong>
          {!importable && <p className="ed-import-avert">Aucun exercice n’a été reconnu pour l’instant.</p>}
          {analyse.avertissements.length > 0 && (
            <ul className="ed-import-avert">
              {analyse.avertissements.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
        </div>
      )}

      {importable && !vide && (
        <fieldset className="ed-import-mode">
          <legend>Votre sujet contient déjà du texte :</legend>
          <label><input type="radio" name="mode-import" checked={mode === 'remplacer'} onChange={() => setMode('remplacer')} /> Remplacer le contenu actuel par ce nouveau sujet</label>
          <label><input type="radio" name="mode-import" checked={mode === 'ajouter'} onChange={() => setMode('ajouter')} /> Ajouter à la suite du contenu actuel</label>
        </fieldset>
      )}
    </Modale>
  )
}