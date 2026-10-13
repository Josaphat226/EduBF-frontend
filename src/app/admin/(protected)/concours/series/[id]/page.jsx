'use client'

import { useState, useEffect, use } from 'react'
import { api } from '@/lib/api'

const LABELS_STATUT = {
  brouillon: { label: 'Brouillon', couleur: '#64748B', fond: '#F1F5F9' },
  incomplete: { label: 'Incomplète', couleur: '#D97706', fond: '#FEF3C7' },
  complete: { label: 'Complète', couleur: '#2563EB', fond: '#DBEAFE' },
  publiee: { label: 'Publiée', couleur: '#059669', fond: '#D1FAE5' },
}

export default function DetailSerieConcoursPage({ params }) {
  const { id } = use(params)

  const [serie, setSerie] = useState(null)
  const [questionsIncluses, setQuestionsIncluses] = useState([])
  const [questionsDisponibles, setQuestionsDisponibles] = useState([])
  const [selection, setSelection] = useState([])
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(false)

  function charger() {
    api.get(`/admin/concours/series/${id}`).then(res => {
      setSerie(res.data.serie)
      setQuestionsIncluses(res.data.questions)
    })
    api.get(`/admin/concours/series/${id}/questions-disponibles`).then(res => {
      setQuestionsDisponibles(res.data.questions)
    })
  }

  useEffect(() => { charger() }, [id])

  function toggleSelection(qid) {
    setSelection(sel => sel.includes(qid) ? sel.filter(x => x !== qid) : [...sel, qid])
  }

  async function ajouterSelection() {
    if (selection.length === 0) return
    setEnCours(true)
    setErreur('')
    try {
      await api.post(`/admin/concours/series/${id}/questions`, { question_ids: selection })
      setSelection([])
      charger()
    } catch (err) {
      setErreur(err.message || "Échec de l'ajout.")
    } finally {
      setEnCours(false)
    }
  }

  async function retirerQuestion(questionId) {
    setEnCours(true)
    try {
      await api.delete(`/admin/concours/series/${id}/questions/${questionId}`)
      charger()
    } catch (err) {
      setErreur(err.message || 'Échec du retrait.')
    } finally {
      setEnCours(false)
    }
  }

  async function publier() {
    setEnCours(true)
    setErreur('')
    setSucces('')
    try {
      await api.put(`/admin/concours/series/${id}/publier`)
      setSucces('Série publiée avec succès.')
      charger()
    } catch (err) {
      setErreur(err.message || 'Échec de la publication.')
    } finally {
      setEnCours(false)
    }
  }

  if (!serie) return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>

  const style = LABELS_STATUT[serie.statut] || { label: serie.statut, couleur: '#475569', fond: '#F1F5F9' }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{serie.titre}</h1>
          <p className="admin-page-sub">
            {questionsIncluses.length}/{serie.nb_questions_cible} question(s) —{' '}
            <span style={{ background: style.fond, color: style.couleur, fontWeight: 700, padding: '.15rem .5rem', borderRadius: 999, fontSize: '.78rem' }}>
              {style.label}
            </span>
          </p>
        </div>
        {serie.statut === 'complete' && (
          <button type="button" className="adoc-btn-submit" onClick={publier} disabled={enCours}>
            Publier la série
          </button>
        )}
      </div>

      {erreur && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.9rem 1.2rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.9rem' }}>
          {erreur}
        </div>
      )}
      {succes && (
        <div role="alert" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.9rem 1.2rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.9rem' }}>
          {succes}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Questions deja dans la serie */}
        <div className="adoc-card">
          <div className="adoc-section">
            <h3 className="adoc-section-title">Questions incluses ({questionsIncluses.length})</h3>
            {questionsIncluses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Aucune question ajoutée pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {questionsIncluses.map(q => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', background: 'var(--bg-alt)', borderRadius: 8, padding: '.6rem .8rem' }}>
                    <span style={{ fontSize: '.85rem', color: 'var(--text)' }}>{q.enonce}</span>
                    <button type="button" onClick={() => retirerQuestion(q.id)} disabled={enCours} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '.8rem', flexShrink: 0 }}>
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Questions validees disponibles a ajouter */}
        <div className="adoc-card">
          <div className="adoc-section">
            <h3 className="adoc-section-title">Questions validées disponibles ({questionsDisponibles.length})</h3>
            {questionsDisponibles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
                Aucune question validée disponible dans ce domaine — passe par la modération d'abord.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 400, overflowY: 'auto' }}>
                  {questionsDisponibles.map(q => (
                    <label key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', background: 'var(--bg-alt)', borderRadius: 8, padding: '.6rem .8rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selection.includes(q.id)} onChange={() => toggleSelection(q.id)} />
                      <span style={{ fontSize: '.85rem', color: 'var(--text)' }}>{q.enonce}</span>
                    </label>
                  ))}
                </div>
                <div className="adoc-actions">
                  <button type="button" className="adoc-btn-submit" onClick={ajouterSelection} disabled={selection.length === 0 || enCours}>
                    Ajouter {selection.length > 0 ? `(${selection.length})` : ''} à la série
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  )
}