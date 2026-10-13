'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function ImportConcoursPage() {
  const [fichier, setFichier] = useState(null)
  const [tailleSerie, setTailleSerie] = useState(20)
  const [chargement, setChargement] = useState(false)
  const [rapport, setRapport] = useState(null)
  const [erreur, setErreur] = useState('')

  async function handleImporter() {
    if (!fichier) return
    setChargement(true)
    setErreur('')
    setRapport(null)
    try {
      const fd = new FormData()
      fd.append('fichier', fichier)
      fd.append('taille_serie', tailleSerie)
      const res = await api.post('/admin/concours/imports/executer', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRapport(res.data)
      setFichier(null)
    } catch (err) {
      setErreur(err.message || "Échec de l'import.")
    } finally {
      setChargement(false)
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Importer des questions Concours</h1>
          <p className="admin-page-sub">Format TXT, CSV ou JSON — domaine et difficulté doivent déjà être présents dans le fichier.</p>
        </div>
      </div>

      {erreur && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.9rem 1.2rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.9rem' }}>
          {erreur}
        </div>
      )}

      <div className="adoc-card">
        <div className="adoc-section">
          <h3 className="adoc-section-title">Fichier</h3>
          <div className="adoc-grid-2">
            <div className="adoc-field adoc-field-full">
              <input type="file" accept=".txt,.csv,.json" onChange={e => setFichier(e.target.files[0])} />
            </div>
            <div className="adoc-field">
              <label>Questions par série</label>
              <input type="number" min="1" value={tailleSerie} onChange={e => setTailleSerie(e.target.value)} />
            </div>
          </div>
          <div className="adoc-actions">
            <button type="button" className="adoc-btn-submit" onClick={handleImporter} disabled={!fichier || chargement}>
              {chargement ? 'Import en cours...' : 'IMPORTER ET PUBLIER'}
            </button>
          </div>
        </div>
      </div>

      {rapport && (
        <div className="adoc-card" style={{ marginTop: '1.5rem' }}>
          <div className="adoc-section">
            <h3 className="adoc-section-title">Résultat de l'import</h3>

            <p style={{ fontSize: '.95rem', color: 'var(--text)', marginBottom: '1rem' }}>
              <strong>{rapport.total}</strong> question(s) détectée(s)<br />
              <span style={{ color: '#059669' }}>✓ {rapport.valides} valide(s), publiée(s) immédiatement</span><br />
              {rapport.erreurs > 0 && <span style={{ color: '#D97706' }}>⚠ {rapport.erreurs} à corriger (visible dans la modération)</span>}
              {rapport.rejetees > 0 && <><br /><span style={{ color: '#DC2626' }}>✕ {rapport.rejetees} rejetée(s) (énoncé vide)</span></>}
            </p>

            {Object.keys(rapport.par_domaine).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', marginBottom: '1.2rem' }}>
                {Object.entries(rapport.par_domaine).map(([nom, n]) => (
                  <div key={nom} style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{nom} : <strong>{n}</strong></div>
                ))}
              </div>
            )}

           {rapport.series_creees.length > 0 && (
  <div style={{ fontSize: '.9rem', color: 'var(--text)', marginBottom: '1rem' }}>
    <strong>{rapport.series_creees.length}</strong> série(s) créée(s) et publiée(s) automatiquement :
    <ul style={{ margin: '.4rem 0 0', paddingLeft: '1.3rem' }}>
      {rapport.series_creees.map(s => <li key={s.id} style={{ fontSize: '.85rem' }}>{s.titre}</li>)}
    </ul>
  </div>
)}

            {rapport.detail_erreurs.length > 0 && (
              <details style={{ fontSize: '.85rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text)' }}>Voir le détail des erreurs</summary>
                <ul style={{ margin: '.6rem 0 0', paddingLeft: '1.2rem' }}>
                  {rapport.detail_erreurs.map((e, i) => (
                    <li key={i} style={{ marginBottom: '.4rem', color: 'var(--text-secondary)' }}>
                      « {e.enonce}... » — {e.erreurs.join(', ')}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </>
  )
}