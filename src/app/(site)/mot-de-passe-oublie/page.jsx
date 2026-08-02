'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSucces(res.data.message)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px', margin: '2rem auto' }}>
        <div className="auth-left" style={{ width: '100%', padding: '2.5rem' }}>
          <Link href="/" className="auth-logo">EDUBF</Link>
          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-subtitle">Saisis ton email et on t'envoie un lien de réinitialisation.</p>

        {erreur && <div className="alert alert-error" role="alert">{erreur}</div>}
{succes && <div className="alert alert-success" role="alert">{succes}</div>}

          {!succes && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label>Adresse email</label>
                <input
                  type="email"
                  placeholder="exemple@gmail.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link href="/connexion">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  )
}