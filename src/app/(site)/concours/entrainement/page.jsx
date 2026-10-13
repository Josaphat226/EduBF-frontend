'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import BackLink from '@/components/ui/BackLink'

const DIFFICULTES = [
  { value: '', label: 'Toutes difficultés' },
  { value: 'facile', label: 'Facile' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'difficile', label: 'Difficile' },
]

export default function EntrainementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [domaines, setDomaines] = useState(null)
  const [domaineIds, setDomaineIds] = useState([])
  const [difficulte, setDifficulte] = useState('')
  const [nbQuestions, setNbQuestions] = useState(20)
  const [erreur, setErreur] = useState('')
  const [demarrage, setDemarrage] = useState(false)

  useEffect(() => {
    api.get('/concours/domaines').then(res => setDomaines(res.data.domaines)).catch(() => setDomaines([]))
  }, [])

  function toggleDomaine(id) {
    setDomaineIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  async function demarrer() {
    if (domaineIds.length === 0) { setErreur('Choisis au moins un domaine.'); return }
    setDemarrage(true)
    setErreur('')
    try {
      const res = await api.post('/concours/sessions', {
        domaine_ids: domaineIds,
        nb_questions: nbQuestions,
        difficulte: difficulte || undefined,
      })
      router.push(`/concours/session/${res.data.session_id}`)
    } catch (err) {
      setErreur(err.message || "Impossible de démarrer l'entraînement.")
      setDemarrage(false)
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <Link href="/concours" style={{ fontSize: '.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Retour aux domaines</Link>
        <div className="doc-login-box" style={{ marginTop: '1.5rem' }}>
          <p>Connecte-toi pour lancer un entraînement personnalisé.</p>
          <div className="doc-login-btns">
            <Link href="/connexion" className="doc-btn-dl">Se connecter</Link>
            <Link href="/inscription" className="doc-btn-outline">S'inscrire gratuitement</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link href="/concours" style={{ fontSize: '.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Retour aux domaines</Link>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: '1.2rem 0 .4rem' }}>
        Entraînement personnalisé
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Choisis un ou plusieurs domaines, et EduBF tire des questions au hasard parmi celles publiées.
      </p>

      {erreur && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.9rem 1.2rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.9rem' }}>
          {erreur}
        </div>
      )}

      <div style={{ marginBottom: '1.6rem' }}>
        <label style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '.6rem' }}>
          Domaine(s)
        </label>
        {domaines === null ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Chargement...</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {domaines.map(d => {
              const selectionne = domaineIds.includes(d.id)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDomaine(d.id)}
                  disabled={d.nb_series === 0}
                  style={{
                    padding: '.5rem 1rem', borderRadius: 999, fontSize: '.85rem', fontWeight: 600, cursor: d.nb_series === 0 ? 'not-allowed' : 'pointer',
                    border: `1.5px solid ${selectionne ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectionne ? 'var(--accent-soft, rgba(245,158,11,0.1))' : 'var(--bg-card)',
                    color: selectionne ? 'var(--accent)' : d.nb_series === 0 ? 'var(--text-muted)' : 'var(--text)',
                    opacity: d.nb_series === 0 ? 0.5 : 1,
                  }}
                >
                  {d.nom}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '.5rem' }}>
            Difficulté
          </label>
          <select value={difficulte} onChange={e => setDifficulte(e.target.value)} style={{ width: '100%', padding: '.7rem 1rem', borderRadius: 10, border: '1.5px solid var(--border)' }}>
            {DIFFICULTES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '.5rem' }}>
            Nombre de questions
          </label>
          <select value={nbQuestions} onChange={e => setNbQuestions(Number(e.target.value))} style={{ width: '100%', padding: '.7rem 1rem', borderRadius: 10, border: '1.5px solid var(--border)' }}>
            {[10, 15, 20, 30, 40].map(n => <option key={n} value={n}>{n} questions</option>)}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="hero-btn-main"
        onClick={demarrer}
        disabled={demarrage || domaineIds.length === 0}
        style={{ width: '100%', border: 'none', cursor: 'pointer' }}
      >
        {demarrage ? 'Préparation...' : "Démarrer l'entraînement"}
      </button>
    </div>
  )
}