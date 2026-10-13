'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

const LABELS_STATUT = {
  brouillon: { label: 'Brouillon', couleur: '#64748B', fond: '#F1F5F9' },
  incomplete: { label: 'Incomplète', couleur: '#D97706', fond: '#FEF3C7' },
  complete: { label: 'Complète', couleur: '#2563EB', fond: '#DBEAFE' },
  publiee: { label: 'Publiée', couleur: '#059669', fond: '#D1FAE5' },
}

export default function SeriesConcoursPage() {
  const [series, setSeries] = useState(null)
  const [domaines, setDomaines] = useState([])
  const [formOuvert, setFormOuvert] = useState(false)
  const [nouveauTitre, setNouveauTitre] = useState('')
  const [nouveauDomaine, setNouveauDomaine] = useState('')
  const [nouveauNbCible, setNouveauNbCible] = useState(20)
  const [erreur, setErreur] = useState('')
  const [creation, setCreation] = useState(false)

  function charger() {
    api.get('/admin/concours/series').then(res => setSeries(res.data.series))
  }

  useEffect(() => {
    charger()
    api.get('/admin/concours/domaines').then(res => setDomaines(res.data.domaines))
  }, [])

  async function creerSerie(e) {
    e.preventDefault()
    if (!nouveauTitre.trim() || !nouveauDomaine) {
      setErreur('Titre et domaine sont obligatoires.')
      return
    }
    setCreation(true)
    setErreur('')
    try {
      await api.post('/admin/concours/series', {
        titre: nouveauTitre.trim(),
        domaine_id: Number(nouveauDomaine),
        nb_questions_cible: Number(nouveauNbCible) || 20,
      })
      setNouveauTitre('')
      setNouveauDomaine('')
      setNouveauNbCible(20)
      setFormOuvert(false)
      charger()
    } catch (err) {
      setErreur(err.message || 'Échec de la création.')
    } finally {
      setCreation(false)
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Séries — Concours</h1>
          <p className="admin-page-sub">Crée des séries et sélectionne les questions validées qui les composent.</p>
        </div>
        <button type="button" className="adoc-btn-submit" onClick={() => setFormOuvert(o => !o)}>
          {formOuvert ? 'Annuler' : '+ Nouvelle série'}
        </button>
      </div>

      {formOuvert && (
        <div className="adoc-card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={creerSerie} className="adoc-section">
            {erreur && <p style={{ color: '#DC2626', fontSize: '.85rem', marginBottom: '.8rem' }}>{erreur}</p>}
            <div className="adoc-grid-2">
              <div className="adoc-field adoc-field-full">
                <label>Titre <span className="adoc-required">*</span></label>
                <input type="text" value={nouveauTitre} onChange={e => setNouveauTitre(e.target.value)} placeholder="Ex: Informatique — Série 02" />
              </div>
              <div className="adoc-field">
                <label>Domaine <span className="adoc-required">*</span></label>
                <select value={nouveauDomaine} onChange={e => setNouveauDomaine(e.target.value)}>
                  <option value="">-- Choisir --</option>
                  {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </div>
              <div className="adoc-field">
                <label>Nombre de questions cible</label>
                <input type="number" min="1" value={nouveauNbCible} onChange={e => setNouveauNbCible(e.target.value)} />
              </div>
            </div>
            <div className="adoc-actions">
              <button type="submit" className="adoc-btn-submit" disabled={creation}>
                {creation ? 'Création...' : 'Créer la série'}
              </button>
            </div>
          </form>
        </div>
      )}

      {series === null ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : series.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Aucune série pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          {series.map(s => {
            const style = LABELS_STATUT[s.statut] || { label: s.statut, couleur: '#475569', fond: '#F1F5F9' }
            return (
              <Link
                key={s.id}
                href={`/admin/concours/series/${s.id}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '1.1rem 1.4rem', textDecoration: 'none',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '.95rem' }}>{s.titre}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
                    {s.domaine_nom} · {s.nb_questions_actuelles}/{s.nb_questions_cible} question(s)
                  </div>
                </div>
                <span style={{ background: style.fond, color: style.couleur, fontSize: '.75rem', fontWeight: 700, padding: '.3rem .7rem', borderRadius: 999 }}>
                  {style.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}