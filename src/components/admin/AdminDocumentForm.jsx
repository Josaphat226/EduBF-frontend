'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const ANNEES = [
  '2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021',
  '2019-2020', '2018-2019', '2017-2018', '2016-2017', '2015-2016',
]

// Categories dont la classification depend d'un examen (donc affichent
// le selecteur Examen -> Series). Les autres (Cours, Exercices, Livres...)
// n'en ont pas besoin.
const SLUGS_AVEC_EXAMEN = ['sujets-examen', 'corriges']

const VIDE = {
  titre: '', description: '', niveau: '', annee_scolaire: '',
  categorie_id: '', type_precis_id: '', examen_id: '', statut: 'publie',
}

export default function AdminDocumentForm({ mode, id }) {
  const router = useRouter()
  const [form, setForm] = useState(VIDE)
  const [matiereIds, setMatiereIds] = useState([])
  const [serieIds, setSerieIds] = useState([])
  const [fichier, setFichier] = useState(null)
  const [fichierNom, setFichierNom] = useState(mode === 'nouveau' ? 'Clique pour sélectionner un PDF' : 'Clique pour remplacer le PDF actuel')
  const [step, setStep] = useState(1)
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const [ajoutMatiereOuvert, setAjoutMatiereOuvert] = useState(false)
  const [nouvelleMatiereNom, setNouvelleMatiereNom] = useState('')
  const [matiereEnCours, setMatiereEnCours] = useState(false)

  // Referentiels charges depuis l'API
  const [categories, setCategories] = useState([])
  const [examens, setExamens] = useState([])
  const [typesDocument, setTypesDocument] = useState([])
  const [matieres, setMatieres] = useState([])
  const [series, setSeries] = useState([])

  const categorieChoisie = categories.find(c => String(c.id) === String(form.categorie_id))
  const afficheExamen = categorieChoisie && SLUGS_AVEC_EXAMEN.includes(categorieChoisie.slug)

  // Chargement initial des referentiels stables
  useEffect(() => {
    api.get('/admin/referentiels/categories').then(res => setCategories(res.data.categories))
    api.get('/admin/referentiels/examens').then(res => setExamens(res.data.examens))
    api.get('/admin/referentiels/matieres').then(res => setMatieres(res.data.matieres))
  }, [])

  // Cache en memoire (dure le temps de vie du formulaire) : evite de refaire
  // un appel reseau si l'admin revient sur une categorie/examen deja charge
  const cacheTypesDocument = useRef({})
  const cacheSeries = useRef({})
  const [chargementTypes, setChargementTypes] = useState(false)
  const [chargementSeries, setChargementSeries] = useState(false)

  // Types de document dependants de la categorie choisie
  useEffect(() => {
    if (!form.categorie_id) { setTypesDocument([]); return }

    if (cacheTypesDocument.current[form.categorie_id]) {
      setTypesDocument(cacheTypesDocument.current[form.categorie_id])
      return
    }

    setChargementTypes(true)
    api.get('/admin/referentiels/types-document', { params: { categorie_id: form.categorie_id } })
      .then(res => {
        cacheTypesDocument.current[form.categorie_id] = res.data.types
        setTypesDocument(res.data.types)
      })
      .finally(() => setChargementTypes(false))
  }, [form.categorie_id])

  // Series dependantes de l'examen choisi
  useEffect(() => {
    // On reinitialise TOUJOURS la selection de series des que l'examen change
    // (avant meme la reponse de l'API) : corrige le bug ou changer d'examen
    // sans repasser par un etat vide laissait d'anciennes series cochees.
    setSerieIds([])

    if (!form.examen_id) { setSeries([]); return }

    if (cacheSeries.current[form.examen_id]) {
      setSeries(cacheSeries.current[form.examen_id])
      return
    }

    setChargementSeries(true)
    api.get('/admin/referentiels/series', { params: { examen_id: form.examen_id } })
      .then(res => {
        cacheSeries.current[form.examen_id] = res.data.series
        setSeries(res.data.series)
      })
      .finally(() => setChargementSeries(false))
  }, [form.examen_id])


  

  // Mode edition : charge le document existant
  useEffect(() => {
    if (mode === 'editer' && id) {
      api.get(`/admin/documents/${id}`).then(res => {
        setForm(f => ({ ...f, ...res.data.document }))
        if (res.data.document.matiere_ids) setMatiereIds(res.data.document.matiere_ids)
        if (res.data.document.serie_ids) setSerieIds(res.data.document.serie_ids)
      })
    }
  }, [mode, id])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function validerNouvelleMatiere() {
    const nom = nouvelleMatiereNom.trim()
    if (!nom) return

    // Si une matière du même nom (insensible à la casse) est déjà chargée localement,
    // pas besoin d'appeler l'API : on la sélectionne directement.
    const dejaConnue = matieres.find(m => m.nom.toLowerCase() === nom.toLowerCase())
    if (dejaConnue) {
      if (!matiereIds.includes(dejaConnue.id)) setMatiereIds(ids => [...ids, dejaConnue.id])
      setAjoutMatiereOuvert(false)
      return
    }

    setMatiereEnCours(true)
    try {
      const res = await api.post('/admin/referentiels/matieres', { nom })
      const matiere = res.data.matiere
      setMatieres(list => list.some(m => m.id === matiere.id) ? list : [...list, matiere])
      setMatiereIds(ids => ids.includes(matiere.id) ? ids : [...ids, matiere.id])
      setAjoutMatiereOuvert(false)
    } catch (err) {
      setErreur(err.message || "Impossible d'ajouter cette matière.")
    } finally {
      setMatiereEnCours(false)
    }
  }

  function toggleSerie(serieId) {
    setSerieIds(ids => ids.includes(serieId) ? ids.filter(i => i !== serieId) : [...ids, serieId])
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setFichier(file)
      setFichierNom(file.name)
    }
  }

  function nextStep() {
    if (step === 1 && (!form.titre || !form.niveau)) { setErreur('Merci de remplir les champs obligatoires.'); return }
    if (step === 2 && (!form.categorie_id || !form.type_precis_id || matiereIds.length === 0)) { setErreur('Merci de remplir les champs obligatoires (catégorie, type, au moins une matière).'); return }
    setErreur('')
    setStep(s => s + 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'nouveau' && !fichier) { setErreur('Veuillez sélectionner un fichier PDF.'); return }

    setLoading(true)
    setErreur('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ''))
      fd.append('matiere_ids', JSON.stringify(matiereIds))
      fd.append('serie_ids', JSON.stringify(serieIds))
      if (fichier) fd.append('fichier', fichier)

      if (mode === 'nouveau') {
        await api.post('/admin/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.put(`/admin/documents/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      router.push('/admin/documents')
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{mode === 'nouveau' ? 'Ajouter un document' : 'Modifier le document'}</h1>
          <p className="admin-page-sub">{mode === 'nouveau' ? 'Remplis les informations du document à publier' : 'Modifie les informations du document'}</p>
        </div>
      </div>

      {erreur && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.9rem 1.2rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.9rem' }}>
          {erreur}
        </div>
      )}

      <div className="adoc-card">

        {mode === 'nouveau' && (
          <div className="adoc-stepper">
            <div className={`adoc-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}><div className="adoc-step-circle">1</div><div className="adoc-step-label">Informations</div></div>
            <div className={`adoc-step-line ${step > 1 ? 'done' : ''}`}></div>
            <div className={`adoc-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}><div className="adoc-step-circle">2</div><div className="adoc-step-label">Classification</div></div>
            <div className={`adoc-step-line ${step > 2 ? 'done' : ''}`}></div>
            <div className={`adoc-step ${step === 3 ? 'active' : ''}`}><div className="adoc-step-circle">3</div><div className="adoc-step-label">Fichier & Publication</div></div>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {(mode === 'editer' || step === 1) && (
            <div className="adoc-section">
              <h3 className="adoc-section-title">Informations de base</h3>
              <div className="adoc-grid-2">
                <div className="adoc-field adoc-field-full">
                  <label>Titre du document <span className="adoc-required">*</span></label>
                  <input type="text" value={form.titre} onChange={e => update('titre', e.target.value)} placeholder="Ex: Sujet BAC D Mathématiques 2023" required />
                </div>
                <div className="adoc-field adoc-field-full">
                  <label>Description</label>
                  <textarea rows="3" value={form.description || ''} onChange={e => update('description', e.target.value)} placeholder="Décris brièvement ce document..." />
                </div>
                <div className="adoc-field">
                  <label>Niveau <span className="adoc-required">*</span></label>
                  <select value={form.niveau} onChange={e => update('niveau', e.target.value)} required>
                    <option value="">-- Choisir --</option>
                    <option value="Collège">Collège</option>
                    <option value="Lycée">Lycée</option>
                    <option value="Supérieur">Supérieur</option>
                  </select>
                </div>
                <div className="adoc-field">
                  <label>Année scolaire</label>
                  <select value={form.annee_scolaire || ''} onChange={e => update('annee_scolaire', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              {mode === 'nouveau' && (
                <div className="adoc-actions">
                  <button type="button" className="adoc-btn-next" onClick={nextStep}>Suivant →</button>
                </div>
              )}
            </div>
          )}

          {(mode === 'editer' || step === 2) && (
            <div className="adoc-section">
              <h3 className="adoc-section-title">Classification</h3>
              <div className="adoc-grid-2">
                <div className="adoc-field">
                  <label>Catégorie <span className="adoc-required">*</span></label>
                  <select
                    value={form.categorie_id}
                    onChange={e => { update('categorie_id', e.target.value); update('type_precis_id', ''); update('examen_id', '') }}
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
                  </select>
                </div>
                <div className="adoc-field">
                  <label>Type précis <span className="adoc-required">*</span></label>
                  <select value={form.type_precis_id} onChange={e => update('type_precis_id', e.target.value)} required disabled={!form.categorie_id}>
                    <option value="">-- Choisir --</option>
                    {typesDocument.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>

                {afficheExamen && (
                  <>
                    <div className="adoc-field">
                      <label>Examen</label>
                      <select value={form.examen_id} onChange={e => update('examen_id', e.target.value)}>
                        <option value="">-- Choisir --</option>
                        {examens.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                      </select>
                    </div>

                    {(chargementSeries || series.length > 0) && (
                      <div className="adoc-field adoc-field-full">
                        <label>Séries / Filières concernées</label>
                        {chargementSeries ? (
                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            {[1, 2, 3].map(i => (
                              <div key={i} style={{ width: 90, height: 30, borderRadius: 999, background: 'var(--bg-alt)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                            ))}
                          </div>
                        ) : (
                        Object.entries(
                          series.reduce((acc, s) => {
                            const groupe = s.groupe || 'Autres'
                            acc[groupe] = acc[groupe] || []
                            acc[groupe].push(s)
                            return acc
                          }, {})
                        ).map(([groupe, seriesDuGroupe]) => (
                          <div key={groupe} style={{ marginBottom: '.8rem' }}>
                            <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: '.4rem' }}>
                              {groupe}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                              {seriesDuGroupe.map(s => (
                                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'var(--bg-alt)', padding: '.4rem .8rem', borderRadius: 999, fontSize: '.85rem', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={serieIds.includes(s.id)} onChange={() => toggleSerie(s.id)} />
                                  {s.nom}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="adoc-field adoc-field-full">
                  <label>Matières <span className="adoc-required">*</span></label>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                    {matieres.map(m => (
                      <label
                        key={m.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '.4rem',
                          background: matiereIds.includes(m.id) ? 'var(--accent-soft)' : 'var(--bg-alt)',
                          color: matiereIds.includes(m.id) ? 'var(--accent-hover)' : 'var(--text)',
                          padding: '.4rem .8rem', borderRadius: 999, fontSize: '.85rem', cursor: 'pointer',
                          border: matiereIds.includes(m.id) ? '1px solid var(--accent)' : '1px solid transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={matiereIds.includes(m.id)}
                          onChange={() => matiereIds.includes(m.id)
                            ? setMatiereIds(ids => ids.filter(i => i !== m.id))
                            : setMatiereIds(ids => [...ids, m.id])}
                        />
                        {m.nom}
                      </label>
                    ))}
                  </div>

                  <div style={{ marginTop: '.8rem', paddingTop: '.8rem', borderTop: '1px dashed var(--border)' }}>
                    {!ajoutMatiereOuvert ? (
                      <button
                        type="button"
                        onClick={() => { setAjoutMatiereOuvert(true); setNouvelleMatiereNom('') }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        Vous ne trouvez pas votre matière ? + Ajouter une matière
                      </button>
                    ) : (
                      <div>
                        <label style={{ fontSize: '.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '.35rem' }}>
                          Nouvelle matière
                        </label>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <input
                            type="text"
                            autoFocus
                            value={nouvelleMatiereNom}
                            onChange={e => setNouvelleMatiereNom(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); validerNouvelleMatiere() } }}
                            placeholder="Ex: Mécanique générale"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={validerNouvelleMatiere}
                            disabled={!nouvelleMatiereNom.trim() || matiereEnCours}
                            className="adoc-btn-next"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {matiereEnCours ? 'Ajout...' : 'Ajouter'}
                          </button>
                          <button type="button" onClick={() => setAjoutMatiereOuvert(false)} className="adoc-btn-prev">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {mode === 'nouveau' && (
                <div className="adoc-actions">
                  <button type="button" className="adoc-btn-prev" onClick={() => setStep(1)}>← Précédent</button>
                  <button type="button" className="adoc-btn-next" onClick={nextStep}>Suivant →</button>
                </div>
              )}
            </div>
          )}

          {(mode === 'editer' || step === 3) && (
            <div className="adoc-section">
              <h3 className="adoc-section-title">{mode === 'nouveau' ? 'Fichier & Publication' : 'Fichier PDF'}</h3>
              <div className="adoc-grid-2">
                <div className="adoc-field adoc-field-full">
                  <label>{mode === 'nouveau' ? <>Fichier PDF <span className="adoc-required">*</span></> : 'Remplacer le PDF (optionnel)'}</label>
                  <div className="adoc-file-zone" onClick={() => document.getElementById('pdfInput').click()}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="12" y1="12" x2="12" y2="18" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                    <div className="adoc-file-text">{fichierNom}</div>
                    <div className="adoc-file-sub">{mode === 'nouveau' ? 'Taille maximale : 20 Mo' : 'Laisse vide pour garder le fichier actuel'}</div>
                    <input type="file" id="pdfInput" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} required={mode === 'nouveau'} />
                  </div>
                </div>

                {mode === 'nouveau' && (
                  <div className="adoc-field adoc-field-full">
                    <label>Statut de publication <span className="adoc-required">*</span></label>
                    <div className="adoc-status-group">
                      <label className="adoc-status-option">
                        <input type="radio" name="statut" checked={form.statut === 'publie'} onChange={() => update('statut', 'publie')} />
                        <div className="adoc-status-card">
                          <div className="adoc-status-icon" style={{ background: '#ECFDF5', color: '#059669' }}>✓</div>
                          <div><div className="adoc-status-title">Publier immédiatement</div><div className="adoc-status-desc">Visible par tous les élèves</div></div>
                        </div>
                      </label>
                      <label className="adoc-status-option">
                        <input type="radio" name="statut" checked={form.statut === 'brouillon'} onChange={() => update('statut', 'brouillon')} />
                        <div className="adoc-status-card">
                          <div className="adoc-status-icon" style={{ background: '#F1F5F9', color: '#64748B' }}>✎</div>
                          <div><div className="adoc-status-title">Brouillon</div><div className="adoc-status-desc">Enregistrer sans publier</div></div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="adoc-actions">
                {mode === 'nouveau' && <button type="button" className="adoc-btn-prev" onClick={() => setStep(2)}>← Précédent</button>}
                <button type="submit" className="adoc-btn-submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : mode === 'nouveau' ? 'Publier le document' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </>
  )
}