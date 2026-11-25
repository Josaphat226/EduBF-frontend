'use client'

import { useState } from 'react'
import ChampRiche from './ChampRiche'
import DialogueImport from './DialogueImport'
import { integrerSujet } from '@/components/contenus/editeur/importer'
import {
  modifier, ajouterPartie, ajouterExercice, ajouterQuestion, ajouterCorrige, retirerCorrige, supprimer, deplacer, dupliquer,
  peutDeplacer, peutSupprimer, peutDefinirPoints, peutAjouterSousQuestion, definirPoints, pointsValides, trouver, totalDocument,
} from '@/components/contenus/editeur/structure'
import { formaterPoints, totalQuestion, totalExercice, totalPartie, etiquetteQuestion } from '@/lib/contenus'

function Actions({ id, doc, appliquer, confirmation }) {
  return (
    <div className="ed-actions">
      <button type="button" title="Monter" disabled={!peutDeplacer(doc, id, 'haut')} onClick={() => appliquer((d) => deplacer(d, id, 'haut'))}>↑</button>
      <button type="button" title="Descendre" disabled={!peutDeplacer(doc, id, 'bas')} onClick={() => appliquer((d) => deplacer(d, id, 'bas'))}>↓</button>
      <button type="button" title="Dupliquer" onClick={() => appliquer((d) => dupliquer(d, id))}>⧉</button>
      <button type="button" title="Supprimer" className="ed-danger" disabled={!peutSupprimer(doc, id)}
        onClick={() => { if (confirm(confirmation)) appliquer((d) => supprimer(d, id)) }}>✕</button>
    </div>
  )
}

function ChampPoints({ valeur, onChange }) {
  const [texte, setTexte] = useState(valeur == null ? '' : String(valeur))
  const ok = texte === '' || pointsValides(texte.replace(',', '.'))
  return (
    <label className="ed-points">Points
      <input type="text" inputMode="decimal" placeholder="0" value={texte} className={ok ? '' : 'ed-invalide'}
        onChange={(e) => {
          setTexte(e.target.value)
          const v = e.target.value.replace(',', '.')
          if (v === '' || pointsValides(v)) onChange(v)
        }}
        onBlur={() => setTexte(valeur == null ? '' : String(valeur))} />
    </label>
  )
}

const CHAMPS_CORRIGE = [['methode', 'Méthode'], ['remarque', 'Remarque']]

function Corrige({ id, corrige, appliquer }) {
  // Modifie le corrigé à partir de sa valeur la plus récente ; un corrigé vide est retiré
  const maj = (f) => appliquer((d) => {
    const suivant = f({ ...((trouver(d, id) || {}).corrige || {}) })
    return Object.keys(suivant).length ? modifier(d, id, { corrige: suivant }) : retirerCorrige(d, id)
  })
  const etapes = corrige.etapes || []
  const majEtape = (i, patch) => maj((c) => ({ ...c, etapes: (c.etapes || []).map((e, j) => (j === i ? { ...e, ...patch } : e)) }))
  const sans = (cle) => maj((c) => { const s = { ...c }; delete s[cle]; return s })

  return (
    <div className="ed-corrige">
      <div className="ed-corrige-tete">
        <strong>Corrigé</strong>
        <button type="button" className="ctn-lien-action ctn-lien-danger" onClick={() => { if (confirm('Retirer tout le corrigé ?')) appliquer((d) => retirerCorrige(d, id)) }}>Retirer le corrigé</button>
      </div>

      {corrige.reponse_attendue ? (
        <div className="ed-sous"><label>Réponse attendue <button type="button" className="ctn-lien-action" onClick={() => sans('reponse_attendue')}>retirer</button></label>
          <ChampRiche valeur={corrige.reponse_attendue} onChange={(v) => maj((c) => ({ ...c, reponse_attendue: v }))} /></div>
      ) : <button type="button" className="ed-ajout" onClick={() => maj((c) => ({ ...c, reponse_attendue: { type: 'doc', content: [] } }))}>+ Réponse attendue</button>}

      {etapes.map((e, i) => (
        <div className="ed-sous" key={`${i}-${etapes.length}`}>
          <label>{etapes.length > 1 ? `Étape ${i + 1}` : 'Résolution détaillée'}{' '}
            <input type="text" className="ed-titre-etape" value={e.titre || ''} placeholder="Titre (facultatif)" onChange={(ev) => majEtape(i, { titre: ev.target.value || undefined })} />
            <button type="button" className="ctn-lien-action" onClick={() => maj((c) => { const s = { ...c, etapes: etapes.filter((_, j) => j !== i) }; if (!s.etapes.length) delete s.etapes; return s })}>retirer</button>
          </label>
          <ChampRiche valeur={e.doc} onChange={(v) => majEtape(i, { doc: v })} />
        </div>
      ))}
      <button type="button" className="ed-ajout" onClick={() => maj((c) => ({ ...c, etapes: [...(c.etapes || []), { doc: { type: 'doc', content: [] } }] }))}>
        + {etapes.length ? 'Étape suivante' : 'Résolution détaillée'}
      </button>

      {CHAMPS_CORRIGE.map(([cle, nom]) => (corrige[cle] ? (
        <div className="ed-sous" key={cle}><label>{nom} <button type="button" className="ctn-lien-action" onClick={() => sans(cle)}>retirer</button></label>
          <ChampRiche valeur={corrige[cle]} onChange={(v) => maj((c) => ({ ...c, [cle]: v }))} /></div>
      ) : <button type="button" className="ed-ajout" key={cle} onClick={() => maj((c) => ({ ...c, [cle]: { type: 'doc', content: [] } }))}>+ {nom}</button>))}

      {corrige.bareme && <p className="ctn-aide">Barème détaillé conservé ({corrige.bareme.length} critères) : il n’est pas modifiable depuis cet écran.</p>}
    </div>
  )
}

function BlocCorrige({ id, corrige, appliquer }) {
  return corrige
    ? <Corrige id={id} corrige={corrige} appliquer={appliquer} />
    : <button type="button" className="ed-ajout ed-ajout-corrige" onClick={() => appliquer((d) => ajouterCorrige(d, id))}>+ Ajouter le corrigé</button>
}

function Question({ q, index, profondeur, doc, appliquer }) {
  const feuille = !q.sous_questions
  return (
    <div className={`ed-question ed-niv-${Math.min(profondeur, 2)}`}>
      <div className="ed-tete">
        <strong className="ed-num">{etiquetteQuestion(q, index, profondeur)}</strong>
        {feuille && peutDefinirPoints(doc, q.id) && <ChampPoints valeur={q.points} onChange={(v) => appliquer((d) => definirPoints(d, q.id, v))} />}
        {!feuille && <span className="ed-total">{formaterPoints(totalQuestion(q))}</span>}
        <Actions id={q.id} doc={doc} appliquer={appliquer} confirmation="Supprimer cette question et tout ce qu’elle contient ?" />
      </div>
      <ChampRiche valeur={q.enonce} onChange={(v) => appliquer((d) => modifier(d, q.id, { enonce: v }))} />
      {q.sous_questions && q.sous_questions.map((sq, i) => <Question key={sq.id} q={sq} index={i} profondeur={profondeur + 1} doc={doc} appliquer={appliquer} />)}
      {peutAjouterSousQuestion(doc, q.id) && <button type="button" className="ed-ajout" onClick={() => appliquer((d) => ajouterQuestion(d, q.id))}>+ Sous-question</button>}
      {(feuille || q.corrige) && <BlocCorrige id={q.id} corrige={q.corrige} appliquer={appliquer} />}
    </div>
  )
}

function Exercice({ ex, index, doc, appliquer }) {
  const feuille = !ex.questions
  return (
    <section className="ed-exercice">
      <div className="ed-tete">
        <h4>Exercice {index + 1}</h4>
        <input type="text" className="ed-titre" value={ex.titre || ''} placeholder="Titre de l’exercice (facultatif)" onChange={(e) => appliquer((d) => modifier(d, ex.id, { titre: e.target.value }))} />
        {feuille && peutDefinirPoints(doc, ex.id) && <ChampPoints valeur={ex.points} onChange={(v) => appliquer((d) => definirPoints(d, ex.id, v))} />}
        {!feuille && <span className="ed-total">{formaterPoints(totalExercice(ex))}</span>}
        <Actions id={ex.id} doc={doc} appliquer={appliquer} confirmation="Supprimer cet exercice et tout ce qu’il contient ?" />
      </div>
      {ex.enonce && <ChampRiche valeur={ex.enonce} onChange={(v) => appliquer((d) => modifier(d, ex.id, { enonce: v }))} />}
      {ex.questions && ex.questions.map((q, i) => <Question key={q.id} q={q} index={i} profondeur={0} doc={doc} appliquer={appliquer} />)}
      <button type="button" className="ed-ajout" onClick={() => appliquer((d) => ajouterQuestion(d, ex.id))}>+ Question</button>
      {(feuille || ex.corrige) && <BlocCorrige id={ex.id} corrige={ex.corrige} appliquer={appliquer} />}
    </section>
  )
}

export default function EditeurSujet({ doc, appliquer }) {
  const [importer, setImporter] = useState(false)
  const entete = doc.entete || {}
  const majEntete = (patch) => appliquer((d) => {
    const e = { ...(d.entete || {}), ...patch }
    for (const k of Object.keys(e)) if (e[k] === undefined || e[k] === '') delete e[k]
    const sortie = { ...d }
    if (Object.keys(e).length) sortie.entete = e
    else delete sortie.entete
    return sortie
  })

  return (
    <div className="ed-sujet">
      <div className="ed-outils-haut">
        <button type="button" className="btn-admin btn-admin-primary" onClick={() => setImporter(true)}>📋 Coller un sujet (rédigé par une IA)</button>
        <span className="ctn-aide">Collez un sujet complet : parties, exercices, questions, corrigés et formules sont créés d’un coup.</span>
      </div>
      {importer && (
        <DialogueImport doc={doc} onFermer={() => setImporter(false)}
          onImporter={(analyse, mode) => { appliquer((d) => integrerSujet(d, analyse, mode)); setImporter(false) }} />
      )}
      <div className="ed-entete">
        <div className="adoc-grid-2">
          <div className="adoc-field">
            <label htmlFor="ed-duree">Durée (minutes)</label>
            <input id="ed-duree" type="number" min="1" max="600" value={entete.duree_minutes || ''} onChange={(e) => majEntete({ duree_minutes: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="adoc-field">
            <label htmlFor="ed-materiel">Matériel autorisé</label>
            <input id="ed-materiel" type="text" value={entete.materiel || ''} maxLength={200} placeholder="Ex : Calculatrice autorisée" onChange={(e) => majEntete({ materiel: e.target.value })} />
          </div>
          <div className="adoc-field adoc-field-full">
            <label>Consignes générales</label>
            <ChampRiche valeur={entete.consignes || { type: 'doc', content: [] }} onChange={(v) => majEntete({ consignes: v.content.length ? v : undefined })} />
          </div>
        </div>
        {totalDocument(doc) > 0 && (
          <p className="ed-total-general">Total du sujet : <strong>{formaterPoints(totalDocument(doc))}</strong> <span className="ctn-aide">(calculé automatiquement ; les points sont facultatifs)</span></p>
        )}
      </div>

      {doc.parties.map((p, i) => (
        <div className="ed-partie" key={p.id}>
          <div className="ed-tete">
            <h3>Partie {i + 1}</h3>
            <input type="text" className="ed-titre" value={p.titre || ''} placeholder="Titre de la partie (facultatif)" onChange={(e) => appliquer((d) => modifier(d, p.id, { titre: e.target.value }))} />
            <span className="ed-total">{formaterPoints(totalPartie(p))}</span>
            <Actions id={p.id} doc={doc} appliquer={appliquer} confirmation="Supprimer cette partie et tout ce qu’elle contient ?" />
          </div>
          {p.exercices.map((ex, j) => <Exercice key={ex.id} ex={ex} index={j} doc={doc} appliquer={appliquer} />)}
          <button type="button" className="ed-ajout" onClick={() => appliquer((d) => ajouterExercice(d, p.id))}>+ Exercice</button>
        </div>
      ))}
      <button type="button" className="ed-ajout ed-ajout-partie" onClick={() => appliquer((d) => ajouterPartie(d))}>+ Partie</button>
    </div>
  )
}