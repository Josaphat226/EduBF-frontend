'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  TYPES, DIFFICULTES, AUTORISATIONS, formulaireVide, verifierFormulaire, construireCharge,
  seriesDe, chapitresPour, elaguerSelections, idPourNom,
} from './informations'

// Formulaire « Informations » d'un contenu : titre, classement, source et droits.
// Sert à la création (initial absent) et à la modification (initial = valeurs actuelles).
//   onSubmit(charge) : appelé avec le corps de la requête ; doit lancer une erreur en cas d'échec
export default function FormulaireInformations({ initial, onSubmit, libelleBouton = 'Enregistrer' }) {
  const [ref, setRef] = useState(null)
  const [form, setForm] = useState(initial || formulaireVide())
  const [erreurs, setErreurs] = useState({})
  const [erreurServeur, setErreurServeur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [enregistre, setEnregistre] = useState(false)

  useEffect(() => {
    api.get('/admin/contenus/referentiels').then((r) => setRef(r.data)).catch((e) => setErreurServeur(e.message))
  }, [])

  function maj(champ, valeur) {
    setEnregistre(false)
    setForm((f) => {
      const suivant = { ...f, [champ]: valeur }
      return ['niveau_id', 'matiere_id', 'examen_id'].includes(champ) && ref ? elaguerSelections(suivant, ref) : suivant
    })
  }

  // Classe ou matière : l'auteur tape un nom (des suggestions sont proposées) ; s'il existe déjà on le relie,
  // sinon il sera créé à l'enregistrement.
  function majNom(champ, texte) {
    const liste = champ === 'niveau' ? ref.niveaux : ref.matieres
    setEnregistre(false)
    setForm((f) => elaguerSelections({ ...f, [`${champ}_nom`]: texte, [`${champ}_id`]: idPourNom(liste, texte) }, ref))
  }

  function basculer(champ, valeur) {
    setEnregistre(false)
    setForm((f) => {
      const liste = f[champ].includes(valeur) ? f[champ].filter((x) => x !== valeur) : [...f[champ], valeur]
      const suivant = { ...f, [champ]: liste }
      return champ === 'series_ids' && ref ? elaguerSelections(suivant, ref) : suivant
    })
  }

  async function envoyer(e) {
    e.preventDefault()
    const verification = verifierFormulaire(form)
    setErreurs(verification.erreurs)
    setErreurServeur('')
    if (!verification.ok) return
    setEnvoi(true)
    try {
      await onSubmit(construireCharge(form))
      setEnregistre(true)
    } catch (err) {
      setErreurServeur(err.message || 'Une erreur est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  const Erreur = ({ champ }) => (erreurs[champ] ? <span className="ctn-erreur" role="alert">{erreurs[champ]}</span> : null)

  if (!ref) {
    return erreurServeur
      ? <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreurServeur}</div>
      : <p className="ctn-chargement">Chargement…</p>
  }

  const series = seriesDe(form.examen_id, ref.series)
  const chapitres = chapitresPour(form.niveau_id, form.matiere_id, form.series_ids, ref.chapitres)

  return (
    <form onSubmit={envoyer} noValidate>
      <div className="adoc-section">
        <h3 className="adoc-section-title">Informations de base</h3>
        <div className="adoc-grid-2">
          <div className="adoc-field adoc-field-full">
            <label htmlFor="ctn-titre">Titre <span className="adoc-required">*</span></label>
            <input id="ctn-titre" type="text" value={form.titre} onChange={(e) => maj('titre', e.target.value)} placeholder="Ex : Racines carrées et statistiques" maxLength={255} />
            <Erreur champ="titre" />
          </div>
          <div className="adoc-field">
            <label htmlFor="ctn-type">Type <span className="adoc-required">*</span></label>
            <select id="ctn-type" value={form.type} onChange={(e) => maj('type', e.target.value)}>
              {TYPES.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
            </select>
            <Erreur champ="type" />
          </div>
          <div className="adoc-field">
            <label htmlFor="ctn-difficulte">Difficulté</label>
            <select id="ctn-difficulte" value={form.difficulte} onChange={(e) => maj('difficulte', e.target.value)}>
              <option value="">— Non précisée —</option>
              {DIFFICULTES.map((d) => <option key={d.valeur} value={d.valeur}>{d.libelle}</option>)}
            </select>
          </div>
          <div className="adoc-field adoc-field-full">
            <label htmlFor="ctn-description">Description <span className="ctn-aide">(affichée dans les résultats de recherche)</span></label>
            <textarea id="ctn-description" rows="3" value={form.description} onChange={(e) => maj('description', e.target.value)} placeholder="Ex : Simplifier des radicaux, calculer une moyenne et une médiane." />
            <Erreur champ="description" />
          </div>
        </div>
      </div>

      <div className="adoc-section">
        <h3 className="adoc-section-title">Classement</h3>
        <div className="adoc-grid-2">
          <div className="adoc-field">
            <label htmlFor="ctn-niveau">Classe <span className="ctn-aide">(facultatif)</span></label>
            <input id="ctn-niveau" type="text" list="ctn-niveaux-liste" autoComplete="off" value={form.niveau_nom || ''} maxLength={100}
              onChange={(e) => majNom('niveau', e.target.value)} placeholder="Ex : 3e, Terminale D, Licence 1…" />
            <datalist id="ctn-niveaux-liste">{ref.niveaux.map((n) => <option key={n.id} value={n.nom} />)}</datalist>
            {(form.niveau_nom || '').trim() && !form.niveau_id && <span className="ctn-aide">Nouvelle classe : « {form.niveau_nom.trim()} » sera créée à l’enregistrement.</span>}
            <Erreur champ="niveau_id" />
          </div>
          <div className="adoc-field">
            <label htmlFor="ctn-matiere">Matière <span className="adoc-required">*</span></label>
            <input id="ctn-matiere" type="text" list="ctn-matieres-liste" autoComplete="off" value={form.matiere_nom || ''} maxLength={150}
              onChange={(e) => majNom('matiere', e.target.value)} placeholder="Ex : Mathématiques, Physique-Chimie…" />
            <datalist id="ctn-matieres-liste">{ref.matieres.map((m) => <option key={m.id} value={m.nom} />)}</datalist>
            {(form.matiere_nom || '').trim() && !form.matiere_id && <span className="ctn-aide">Nouvelle matière : « {form.matiere_nom.trim()} » sera créée à l’enregistrement.</span>}
            <Erreur champ="matiere_id" />
          </div>
          <div className="adoc-field">
            <label htmlFor="ctn-examen">Examen {form.type === 'sujet_examen' && <span className="adoc-required">*</span>}</label>
            <select id="ctn-examen" value={form.examen_id} onChange={(e) => maj('examen_id', e.target.value)}>
              <option value="">— Aucun —</option>
              {ref.examens.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
            <Erreur champ="examen_id" />
          </div>
          <div className="adoc-field">
            <label htmlFor="ctn-annee">Année scolaire</label>
            <input id="ctn-annee" type="text" value={form.annee_scolaire} onChange={(e) => maj('annee_scolaire', e.target.value)} placeholder="Ex : 2025-2026" maxLength={20} />
            <Erreur champ="annee_scolaire" />
          </div>

          {series.length > 0 && (
            <div className="adoc-field adoc-field-full">
              <label>Séries concernées</label>
              <div className="ctn-cases" role="group" aria-label="Séries concernées">
                {series.map((s) => (
                  <label key={s.id} className="ctn-case">
                    <input type="checkbox" checked={form.series_ids.includes(Number(s.id))} onChange={() => basculer('series_ids', Number(s.id))} />
                    {s.nom}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="adoc-field adoc-field-full">
            <label>Chapitres</label>
            {chapitres.length > 0 ? (
              <div className="ctn-cases" role="group" aria-label="Chapitres">
                {chapitres.map((c) => (
                  <label key={c.id} className="ctn-case">
                    <input type="checkbox" checked={form.chapitres_ids.includes(Number(c.id))} onChange={() => basculer('chapitres_ids', Number(c.id))} />
                    {c.titre}
                  </label>
                ))}
              </div>
            ) : (
              <p className="ctn-aide">{form.niveau_id && form.matiere_id ? 'Aucun chapitre n’est encore saisi pour cette classe et cette matière.' : 'Choisissez une classe et une matière existantes pour voir les chapitres.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="adoc-section">
        <h3 className="adoc-section-title">Origine et droits</h3>
        <div className="adoc-grid-2">
          <div className="adoc-field adoc-field-full">
            <label>Origine du contenu</label>
            <div className="ctn-cases" role="radiogroup" aria-label="Origine du contenu">
              <label className="ctn-case"><input type="radio" name="origine" checked={form.origine === 'edubf'} onChange={() => maj('origine', 'edubf')} /> Créé par EduBF</label>
              <label className="ctn-case"><input type="radio" name="origine" checked={form.origine === 'externe'} onChange={() => maj('origine', 'externe')} /> Source externe</label>
            </div>
          </div>
          {form.origine === 'externe' && (
            <>
              <div className="adoc-field adoc-field-full">
                <label htmlFor="ctn-source">Source <span className="adoc-required">*</span></label>
                <input id="ctn-source" type="text" value={form.source_nom} onChange={(e) => maj('source_nom', e.target.value)} placeholder="Ex : Office du BAC, session 2019" maxLength={300} />
                <Erreur champ="source_nom" />
              </div>
              <div className="adoc-field">
                <label htmlFor="ctn-url">Lien de la source</label>
                <input id="ctn-url" type="url" value={form.source_url} onChange={(e) => maj('source_url', e.target.value)} placeholder="https://…" />
                <Erreur champ="source_url" />
              </div>
              <div className="adoc-field">
                <label htmlFor="ctn-licence">Licence</label>
                <input id="ctn-licence" type="text" value={form.licence} onChange={(e) => maj('licence', e.target.value)} placeholder="Ex : CC BY-SA 4.0" maxLength={100} />
                <Erreur champ="licence" />
              </div>
              <div className="adoc-field">
                <label htmlFor="ctn-autorisation">Autorisation</label>
                <select id="ctn-autorisation" value={form.autorisation} onChange={(e) => maj('autorisation', e.target.value)}>
                  {AUTORISATIONS.map((a) => <option key={a.valeur} value={a.valeur}>{a.libelle}</option>)}
                </select>
              </div>
              <div className="adoc-field">
                <label htmlFor="ctn-note">Note sur l’autorisation</label>
                <input id="ctn-note" type="text" value={form.autorisation_note} onChange={(e) => maj('autorisation_note', e.target.value)} placeholder="Qui a autorisé, quand…" maxLength={1000} />
                <Erreur champ="autorisation_note" />
              </div>
              <p className="ctn-aide adoc-field-full">Un contenu externe ne peut être publié que si l’autorisation est « obtenue » ou « domaine public ».</p>
            </>
          )}
        </div>
      </div>

      {erreurServeur && <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreurServeur}</div>}
      {enregistre && <div className="ctn-alerte ctn-alerte-ok" role="status">Informations enregistrées.</div>}
      {Object.keys(erreurs).length > 0 && <div className="ctn-alerte ctn-alerte-erreur" role="alert">Certains champs sont à corriger (en rouge ci-dessus).</div>}

      <div className="adoc-actions">
        <button type="submit" className="adoc-btn-submit" disabled={envoi}>{envoi ? 'Enregistrement…' : libelleBouton}</button>
      </div>
    </form>
  )
}