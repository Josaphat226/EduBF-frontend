'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import BackLink from '@/components/ui/BackLink'

export default function MesSessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState(null)

  useEffect(() => {
    if (!user) return
    api.get('/concours/mes-sessions').then(res => setSessions(res.data.sessions)).catch(() => setSessions([]))
  }, [user])

  if (!user) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <BackLink href="/concours">Retour aux domaines</BackLink>
        <div className="doc-login-box" style={{ marginTop: '1.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <p>Connecte-toi pour voir tes sessions passées.</p>
          <div className="doc-login-btns">
            <Link href="/connexion" className="doc-btn-dl">Se connecter</Link>
            <Link href="/inscription" className="doc-btn-outline">S'inscrire gratuitement</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <BackLink href="/concours">Retour aux domaines</BackLink>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: '1.2rem 0 1.6rem' }}>
        Mes sessions
      </h1>

      {sessions === null ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
       <p>Tu n'as pas encore fait de session QCM.</p>
          <Link href="/concours" className="hero-btn-main" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
            Découvrir les domaines
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          {sessions.map(s => {
            const enCours = s.statut === 'en_cours'
            const titre = s.serie_titre || 'Entraînement personnalisé'
            const date = new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            return (
              <Link
                key={s.id}
                href={`/concours/session/${s.id}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '1rem 1.3rem', textDecoration: 'none',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{titre}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {date} · {s.nb_questions} questions
                  </div>
                </div>
                {enCours ? (
                  <span style={{
                    fontSize: '.78rem', fontWeight: 700, color: '#D97706', background: '#FFFBEB',
                    padding: '.35rem .8rem', borderRadius: 999,
                  }}>
                    En cours — reprendre
                  </span>
                ) : (
                  <span style={{
                    fontSize: '.95rem', fontWeight: 800, color: 'var(--accent)',
                  }}>
                    {s.score} / {s.nb_questions}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}