'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { DomaineCardSkeleton } from '@/components/ui/Skeleton'
import BackLink from '@/components/ui/BackLink'

export default function DomaineConcoursPage(props) {
  const params = typeof props.params?.then === 'function' ? use(props.params) : props.params
  const { domaineId } = params
  const router = useRouter()
    const { user } = useAuth()
  const [series, setSeries] = useState(null)
  const [erreur, setErreur] = useState('')
  const [demarrage, setDemarrage] = useState(false)

  useEffect(() => {
    api.get(`/concours/domaines/${domaineId}/series`).then(res => setSeries(res.data.series))
  }, [domaineId])

  async function demarrerSerie(serieId) {
    setDemarrage(true)
    setErreur('')
    try {
      const res = await api.post('/concours/sessions', { serie_id: serieId })
      router.push(`/concours/session/${res.data.session_id}`)
    } catch (err) {
      setErreur(err.message || 'Impossible de démarrer cette série.')
      setDemarrage(false)
    }
  }

  async function demarrerEntrainementPersonnalise() {
    setDemarrage(true)
    setErreur('')
    try {
      const res = await api.post('/concours/sessions', { domaine_ids: [Number(domaineId)], nb_questions: 20 })
      router.push(`/concours/session/${res.data.session_id}`)
    } catch (err) {
      setErreur(err.message || "Impossible de démarrer l'entraînement.")
      setDemarrage(false)
    }
  }


    if (!user) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <Link href="/concours" style={{ fontSize: '.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Retour aux domaines</Link>
        <div className="doc-login-box" style={{ marginTop: '1.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <p>Connecte-toi pour t'entraîner sur ce domaine.</p>
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
      <Link href="/concours" style={{ fontSize: '.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Retour aux domaines</Link>

      {erreur && (
        <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.9rem 1.2rem', borderRadius: 10, margin: '1rem 0', fontSize: '0.9rem' }}>
          {erreur}
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-alt)', borderRadius: 16, padding: '1.2rem 1.4rem', margin: '1.2rem 0 2rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>Entraînement personnalisé</div>
          <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>20 questions tirées au hasard dans ce domaine</div>
        </div>
        <button type="button" className="adoc-btn-submit" onClick={demarrerEntrainementPersonnalise} disabled={demarrage}>
          Démarrer
        </button>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1rem' }}>Séries</h2>

      {series === null ? (
        <DomaineCardSkeleton style={{ height: 70, borderRadius: 14 }} />
      ) : series.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Aucune série publiée dans ce domaine pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                   {series.map(s => {
            const fait = (s.nb_tentatives || 0) > 0
            return (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.8rem',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.3rem',
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{s.titre}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{s.nb_questions_cible} questions</div>
                  {fait && (
                    <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: '.2rem' }}>
                      Meilleur score : {s.meilleur_score} / {s.nb_questions_cible}
                      {s.nb_tentatives > 1 ? ` · ${s.nb_tentatives} tentatives` : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', flexWrap: 'wrap' }}>
                  {fait && <span className="serie-badge-fait">✓ Déjà fait</span>}
                  <button type="button" className="adoc-btn-submit" onClick={() => demarrerSerie(s.id)} disabled={demarrage}>
                    Commencer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}