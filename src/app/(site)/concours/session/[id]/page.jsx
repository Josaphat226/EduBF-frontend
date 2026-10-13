'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { QuizSkeleton } from '@/components/ui/Skeleton'

export default function SessionConcoursPage(props) {
  const params = typeof props.params?.then === 'function' ? use(props.params) : props.params
  const { id } = params

  const [questions, setQuestions] = useState(null)
  const [indexActuel, setIndexActuel] = useState(0)
  const [selectionActuelle, setSelectionActuelle] = useState(null)
  const [texteActuel, setTexteActuel] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [resultat, setResultat] = useState(null)
   const [erreur, setErreur] = useState('')
  const [confirmerSortie, setConfirmerSortie] = useState(false)

  useEffect(() => {
    api.get(`/concours/sessions/${id}`).then(res => {
      if (res.data.session.statut === 'terminee') {
        // Session deja terminee (ex: on revient depuis "Mes sessions") —
        // on va directement chercher le resultat, pas la peine de repasser par le quiz
        api.get(`/concours/sessions/${id}/resultat`).then(r => setResultat(r.data))
         } else {
        const qs = res.data.questions
        setQuestions(qs)
        const premiere = qs.findIndex(q => !q.deja_repondue)
        if (premiere === -1) {
          // Toutes les questions ont déjà une réponse : il ne reste qu'à terminer la session
          setIndexActuel(qs.length - 1)
          api.put(`/concours/sessions/${id}/terminer`)
            .then(() => api.get(`/concours/sessions/${id}/resultat`))
            .then(r => setResultat(r.data))
            .catch(err => setErreur(err.message || 'Impossible de terminer la session.'))
        } else {
          setIndexActuel(premiere)
        }
      }
    }).catch(err => setErreur(err.message || 'Impossible de charger cette session.'))
  }, [id])

  async function valider() {
    setEnvoi(true)
    setErreur('')
    try {
      await api.post(`/concours/sessions/${id}/reponses`, {
        session_question_id: question.session_question_id,
        proposition_choisie_id: selectionActuelle,
        reponse_texte_donnee: texteActuel,
      })

      if (indexActuel < questions.length - 1) {
        setIndexActuel(i => i + 1)
        setSelectionActuelle(null)
        setTexteActuel('')
        setEnvoi(false)
      } else {
        await terminer()
      }
    } catch (err) {
      setErreur(err.message || "Impossible d'enregistrer ta réponse.")
      setEnvoi(false)
    }
  }

  async function terminer() {
    setEnvoi(true)
    try {
      await api.put(`/concours/sessions/${id}/terminer`)
      const res = await api.get(`/concours/sessions/${id}/resultat`)
      setResultat(res.data)
    } catch (err) {
      setErreur(err.message || 'Impossible de terminer la session.')
    } finally {
      setEnvoi(false)
    }
  }

  // ---- Etat : chargement initial OU calcul du resultat en cours ----
  if (envoi && !questions) return <QuizSkeleton />
  if (!resultat && !questions) return <QuizSkeleton />
  if (envoi && indexActuel === (questions?.length - 1)) return <QuizSkeleton />

  // ---- Etat : resultat final ----
  if (resultat) {
    return (
      <>
        <div className="docs-hero">
          <div className="docs-blob-l"></div>
          <div className="docs-blob-r"></div>
          <div className="docs-blob-sm"></div>
          <h1 className="docs-hero-title">Résultat</h1>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--accent)' }}>
              {resultat.score} / {resultat.total}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '.3rem' }}>
              {resultat.pourcentage}%
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem', marginBottom: '2rem' }}>
            {resultat.questions.map((q, i) => (
              <div
                key={q.session_question_id || i}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '1rem 1.2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.8rem', marginBottom: '.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{i + 1}. {q.enonce}</div>
                  <span style={{
                    fontSize: '.78rem', fontWeight: 700, flexShrink: 0,
                    color: q.correcte ? '#059669' : '#DC2626',
                  }}>
                    {q.correcte ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                </div>

                {q.propositions ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', fontSize: '.85rem' }}>
                    {q.propositions.map(p => (
                      <div
                        key={p.id}
                        style={{
                          color: p.correcte ? '#059669' : (p.id === q.proposition_choisie_id ? '#DC2626' : 'var(--text-muted)'),
                          fontWeight: p.correcte || p.id === q.proposition_choisie_id ? 700 : 400,
                        }}
                      >
                        {p.correcte ? '✓ ' : (p.id === q.proposition_choisie_id ? '✕ ' : '— ')}{p.texte}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '.85rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Ta réponse : {q.reponse_texte_donnee || '(vide)'}</div>
                    <div style={{ color: '#059669', fontWeight: 600 }}>Bonne réponse : {q.reponse_correcte_texte}</div>
                  </div>
                )}

                {q.explication && (
                  <div style={{ marginTop: '.6rem', fontSize: '.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {q.explication}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center' }}>
            <Link href="/concours" className="adoc-btn-prev" style={{ textDecoration: 'none' }}>Retour aux domaines</Link>
            <Link href="/concours/mes-sessions" className="adoc-btn-submit" style={{ textDecoration: 'none' }}>Mes sessions</Link>
          </div>
        </div>
      </>
    )
  }

  // ---- Etat : quiz en cours ----
  const question = questions[indexActuel]

  const peutValider = question.propositions ? selectionActuelle !== null : texteActuel.trim() !== ''

  return (
    <>
      <div className="docs-hero">
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
        <h1 className="docs-hero-title">Question {indexActuel + 1} / {questions.length}</h1>
      </div>

            <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <button type="button" className="btn-retour" onClick={() => setConfirmerSortie(true)} style={{ marginBottom: '1.2rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Quitter la session
        </button>

        {erreur && (
          <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.9rem 1.2rem', borderRadius: 10, marginBottom: '1.2rem', fontSize: '0.9rem' }}>
            {erreur}
          </div>
        )}

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18,
          padding: '1.6rem', marginBottom: '1.4rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)',
        }}>
          {question.enonce}
        </div>

        {question.propositions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem', marginBottom: '1.6rem' }}>
            {question.propositions.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectionActuelle(p.id)}
                style={{
                  textAlign: 'left', padding: '.9rem 1.2rem', borderRadius: 14, cursor: 'pointer',
                  border: `1.5px solid ${selectionActuelle === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectionActuelle === p.id ? 'var(--accent-soft, rgba(245,158,11,0.1))' : 'var(--bg-card)',
                  color: 'var(--text)', fontSize: '.92rem', fontWeight: selectionActuelle === p.id ? 700 : 500,
                }}
              >
                {p.texte}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={texteActuel}
            onChange={e => setTexteActuel(e.target.value)}
            placeholder="Ta réponse..."
            rows={3}
            style={{ width: '100%', marginBottom: '1.6rem' }}
          />
        )}

        <button
          type="button"
          className="adoc-btn-submit"
          onClick={valider}
          disabled={!peutValider || envoi}
          style={{ width: '100%' }}
        >
              {envoi ? 'Enregistrement...' : indexActuel < questions.length - 1 ? 'Suivant' : 'Terminer'}
        </button>
      </div>

      {confirmerSortie && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="quitter-titre">
          <div className="confirm-box">
            <h3 id="quitter-titre">Quitter la session ?</h3>
            <p>Ta progression est enregistrée. Tu pourras reprendre cette session depuis « Mes sessions ».</p>
            <div className="confirm-actions">
              <button type="button" className="adoc-btn-prev" onClick={() => setConfirmerSortie(false)}>Continuer le quiz</button>
              <Link href="/concours" className="adoc-btn-submit" style={{ textDecoration: 'none' }}>Quitter</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}