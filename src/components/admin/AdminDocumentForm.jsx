'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const ANNEES = [
  '2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021',
  '2019-2020', '2018-2019', '2017-2018', '2016-2017', '2015-2016',
]

const SERIES_GROUPES = {
  BAC: ['BAC A', 'BAC B', 'BAC C', 'BAC D', 'BAC E', 'BAC F1', 'BAC F2', 'BAC F3', 'BAC F4', 'BAC G1', 'BAC G2', 'BAC H'],
  BEP: ['BEP Électrotechnique', 'BEP Génie Civil', 'BEP Comptabilité', 'BEP Secrétariat', 'BEP Mécanique', 'BEP Informatique'],
  CAP: ['CAP Maçonnerie', 'CAP Menuiserie', 'CAP Électricité', 'CAP Couture', 'CAP Mécanique', 'CAP Commerce'],
  BTS: ['BTS Informatique', 'BTS Comptabilité', 'BTS Électrotechnique', 'BTS Génie Civil', 'BTS Commerce', 'BTS Secrétariat'],
}

const MATIERES = [
  'Mathématiques', 'Français', 'Physique-Chimie', 'SVT', 'Histoire-Géographie',
  'Anglais', 'Philosophie', 'Informatique', 'Comptabilité', 'Électrotechnique', 'Économie', 'Autre',
]

const TYPES_DOCUMENT = ['Cours', 'Devoir', 'Composition', 'Examen blanc', 'Sujet officiel', 'Corrigé', 'TD / TP', 'Résumé']

const VIDE = {
  titre: '', description: '', niveau: '', annee_scolaire: '',
  cycle: '', serie_filiere: '', matiere: '', type_document: '', statut: 'publie',
}

export default function AdminDocumentForm({ mode, id }) {
  const router = useRouter()
  const [form, setForm] = useState(VIDE)
  const [fichier, setFichier] = useState(null)
  const [fichierNom, setFichierNom] = useState(mode === 'nouveau' ? 'Clique pour sélectionner un PDF' : 'Clique pour remplacer le PDF actuel')
  const [step, setStep] = useState(1)
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'editer' && id) {
      api.get(`/admin/documents/${id}`).then(res => setForm(res.data.document))
    }
  }, [mode, id])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
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
    if (step === 2 && (!form.cycle || !form.matiere || !form.type_document)) { setErreur('Merci de remplir les champs obligatoires.'); return }
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

  const serieOptions = Object.entries(SERIES_GROUPES)

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
                  <label>Cycle / Examen <span className="adoc-required">*</span></label>
                  <select value={form.cycle} onChange={e => update('cycle', e.target.value)} required>
                    <option value="">-- Choisir --</option>
                    <option value="BEPC">BEPC</option>
                    <option value="BAC">BAC</option>
                    <option value="BEP">BEP</option>
                    <option value="CAP">CAP</option>
                    <option value="BTS">BTS</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="adoc-field">
                  <label>Série / Filière</label>
                  <select value={form.serie_filiere || ''} onChange={e => update('serie_filiere', e.target.value)}>
                    <option value="">-- Aucune --</option>
                    {serieOptions.map(([groupe, options]) => (
                      <optgroup label={groupe} key={groupe}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="adoc-field">
                  <label>Matière <span className="adoc-required">*</span></label>
                  <select value={form.matiere} onChange={e => update('matiere', e.target.value)} required>
                    <option value="">-- Choisir --</option>
                    {MATIERES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="adoc-field">
                  <label>Type de document <span className="adoc-required">*</span></label>
                  <select value={form.type_document} onChange={e => update('type_document', e.target.value)} required>
                    <option value="">-- Choisir --</option>
                    {TYPES_DOCUMENT.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
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