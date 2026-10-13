'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

const LABELS_STATUT = {
  publiee: { label: 'Publiée', couleur: '#059669', fond: '#D1FAE5' },
  a_verifier: { label: 'À vérifier', couleur: '#2563EB', fond: '#DBEAFE' },
  reponse_manquante: { label: 'Réponse manquante', couleur: '#D97706', fond: '#FEF3C7' },
  ambigue: { label: 'Ambiguë', couleur: '#DC2626', fond: '#FEE2E2' },
  rejetee: { label: 'Rejetée', couleur: '#64748B', fond: '#F1F5F9' },
}

// Statuts consideres "en attente de decision" -> affiche Valider/Rejeter
const STATUTS_EN_ATTENTE = ['a_verifier', 'reponse_manquante', 'ambigue']

function LigneQuestion({ question, domaines, ouverte, onToggle, onChangerStatut, onSupprimer, onSauvegarde }) {
  const [q, setQ] = useState(question)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => { setQ(question) }, [question])

  function majPropo(index, champ, valeur) {
    setQ(prev => {
      const props = [...(prev.propositions || [])]
      props[index] = { ...props[index], [champ]: valeur }
      return { ...prev, propositions: props }
    })
  }

  function marquerCorrecte(index) {
    setQ(prev => ({
      ...prev,
      propositions: (prev.propositions || []).map((p, i) => ({ ...p, correcte: i === index })),
    }))
  }

  async function enregistrerModifs() {
    setEnregistrement(true)
    setErreur('')
    try {
      await api.put(`/admin/concours/questions/${q.id}`, q)
      onSauvegarde(q)
      onToggle()
    } catch (err) {
      setErreur(err.message || "Échec de l'enregistrement.")
    } finally {
      setEnregistrement(false)
    }
  }

  const style = LABELS_STATUT[q.statut] || { label: q.statut, couleur: '#475569', fond: '#F1F5F9' }
  const enAttente = STATUTS_EN_ATTENTE.includes(q.statut)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Ligne compacte, toujours visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.9rem 1.2rem' }}>
        <span style={{ background: style.fond, color: style.couleur, fontSize: '.7rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: 999, flexShrink: 0 }}>
          {style.label}
        </span>
        <span style={{ flex: 1, fontSize: '.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.enonce}
        </span>
        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{q.domaine_nom}</span>

        <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
          {enAttente ? (
            <>
              <button type="button" onClick={() => onChangerStatut(q.id, 'publiee')} className="adoc-btn-submit" style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}>
                ✓ Valider
              </button>
              <button type="button" onClick={() => onChangerStatut(q.id, 'rejetee')} className="adoc-btn-prev" style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}>
                ✕ Rejeter
              </button>
            </>
          ) : q.statut === 'publiee' ? (
            <button type="button" onClick={() => onChangerStatut(q.id, 'a_verifier')} className="adoc-btn-prev" style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}>
              Dépublier
            </button>
          ) : q.statut === 'rejetee' ? (
            <button type="button" onClick={() => onChangerStatut(q.id, 'a_verifier')} className="adoc-btn-prev" style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}>
              Republier
            </button>
          ) : null}

          <button type="button" onClick={onToggle} className="adoc-btn-prev" style={{ fontSize: '.78rem', padding: '.4rem .8rem' }}>
            {ouverte ? 'Fermer' : 'Modifier'}
          </button>
          <button
            type="button"
            onClick={() => { if (confirm('Supprimer définitivement cette question ?')) onSupprimer(q.id) }}
            style={{ fontSize: '.78rem', padding: '.4rem .8rem', border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer' }}
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Formulaire d'edition, seulement si ouverte */}
      {ouverte && (
        <div style={{ padding: '0 1.2rem 1.2rem', borderTop: '1px solid var(--border)' }}>
          <textarea
            value={q.enonce}
            onChange={e => setQ(prev => ({ ...prev, enonce: e.target.value }))}
            rows={2}
            style={{ width: '100%', fontSize: '.9rem', fontWeight: 600, margin: '.9rem 0 .8rem', padding: '.5rem' }}
          />

          {Array.isArray(q.propositions) && q.propositions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '.8rem' }}>
              {q.propositions.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <input type="radio" checked={!!p.correcte} onChange={() => marquerCorrecte(i)} title="Marquer comme la bonne réponse" />
                  <input
                    type="text"
                    value={p.texte}
                    onChange={e => majPropo(i, 'texte', e.target.value)}
                    style={{ flex: 1, fontSize: '.85rem', padding: '.35rem .5rem' }}
                  />
                </div>
              ))}
            </div>
          )}

          {q.type === 'reponse_libre' && (
            <div style={{ marginBottom: '.8rem' }}>
              <label style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.3rem' }}>Réponse correcte</label>
              <input
                type="text"
                value={q.reponse_texte || ''}
                onChange={e => setQ(prev => ({ ...prev, reponse_texte: e.target.value }))}
                style={{ width: '100%', fontSize: '.85rem', padding: '.4rem .6rem' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '.8rem' }}>
            <label style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.3rem' }}>Explication</label>
            <textarea
              value={q.explication || ''}
              onChange={e => setQ(prev => ({ ...prev, explication: e.target.value }))}
              rows={2}
              style={{ width: '100%', fontSize: '.85rem', padding: '.4rem .6rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.9rem' }}>
            <select
              value={q.domaine_id || ''}
              onChange={e => setQ(prev => ({ ...prev, domaine_id: e.target.value ? Number(e.target.value) : null }))}
              style={{ fontSize: '.82rem', padding: '.4rem .6rem' }}
            >
              <option value="">-- Domaine --</option>
              {domaines.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            <select
              value={q.difficulte || ''}
              onChange={e => setQ(prev => ({ ...prev, difficulte: e.target.value || null }))}
              style={{ fontSize: '.82rem', padding: '.4rem .6rem' }}
            >
              <option value="">-- Difficulté --</option>
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="difficile">Difficile</option>
            </select>
          </div>

          {erreur && <p style={{ color: '#DC2626', fontSize: '.8rem', marginBottom: '.6rem' }}>{erreur}</p>}

          <button type="button" onClick={enregistrerModifs} disabled={enregistrement} className="adoc-btn-submit" style={{ fontSize: '.85rem' }}>
            {enregistrement ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ModerationConcoursPage() {
  const [questions, setQuestions] = useState(null)
  const [domaines, setDomaines] = useState([])
  const [statutFiltre, setStatutFiltre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [ligneOuverte, setLigneOuverte] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    api.get('/admin/concours/domaines').then(res => setDomaines(res.data.domaines))
  }, [])

  const charger = useCallback(() => {
    setQuestions(null)
    api.get('/admin/concours/questions', { params: { statut: statutFiltre || undefined, q: recherche || undefined, page } })
      .then(res => {
        setQuestions(res.data.questions)
        setPagination(res.data.pagination)
      })
  }, [statutFiltre, recherche, page])

  useEffect(() => { charger() }, [charger])

  // Recherche avec un petit delai pour ne pas interroger l'API a chaque frappe
  function handleRechercheChange(valeur) {
    setRecherche(valeur)
  }
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400)
    return () => clearTimeout(t)
  }, [recherche])

  async function changerStatut(id, nouveauStatut) {
    try {
      await api.patch(`/admin/concours/questions/${id}/statut`, { statut: nouveauStatut })
      setQuestions(qs => qs.map(q => q.id === id ? { ...q, statut: nouveauStatut } : q))
    } catch (err) {
      alert(err.message || 'Échec du changement de statut.')
    }
  }

  async function supprimer(id) {
    try {
      await api.delete(`/admin/concours/questions/${id}`)
      setQuestions(qs => qs.filter(q => q.id !== id))
    } catch (err) {
      alert(err.message || 'Échec de la suppression.')
    }
  }

  function sauvegarderLocal(qModifiee) {
    setQuestions(qs => qs.map(q => q.id === qModifiee.id ? qModifiee : q))
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Modération Concours</h1>
          <p className="admin-page-sub">Corrige et valide les questions importées avant publication.</p>
        </div>
      </div>

      <input
        type="text"
        value={recherche}
        onChange={e => handleRechercheChange(e.target.value)}
        placeholder="Rechercher une question par son énoncé..."
        style={{ width: '100%', padding: '.7rem 1rem', marginBottom: '1rem', fontSize: '.9rem' }}
      />

      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setStatutFiltre(''); setPage(1) }}
          style={{
            background: statutFiltre === '' ? 'var(--text)' : 'var(--bg-alt)',
            color: statutFiltre === '' ? '#fff' : 'var(--text)',
            border: 'none', borderRadius: 999, padding: '.4rem .9rem', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Toutes
        </button>
        {Object.entries(LABELS_STATUT).map(([statut, style]) => (
          <button
            key={statut}
            type="button"
            onClick={() => { setStatutFiltre(statut); setPage(1) }}
            style={{
              background: statutFiltre === statut ? style.couleur : style.fond,
              color: statutFiltre === statut ? '#fff' : style.couleur,
              border: 'none', borderRadius: 999, padding: '.4rem .9rem', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {style.label}
          </button>
        ))}
      </div>

      {questions === null ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : questions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Aucune question ne correspond.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {questions.map(q => (
            <LigneQuestion
              key={q.id}
              question={q}
              domaines={domaines}
              ouverte={ligneOuverte === q.id}
              onToggle={() => setLigneOuverte(o => o === q.id ? null : q.id)}
              onChangerStatut={changerStatut}
              onSupprimer={supprimer}
              onSauvegarde={sauvegarderLocal}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{ padding: '.4rem .8rem', borderRadius: 8, border: 'none', background: n === page ? 'var(--accent)' : 'var(--bg-alt)', color: n === page ? '#fff' : 'var(--text)', cursor: 'pointer' }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </>
  )
}