'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function ResetPassword() {
  const { token } = useParams()
  const [form, setForm] = useState({ mot_de_passe: '', confirmation: '' })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenValide, setTokenValide] = useState(null)

  useEffect(() => {
    if (!token) {
      setTokenValide(false)
      return
    }
    api.get(`/auth/reset-password/${token}`)
      .then(res => setTokenValide(res.data.valid))
      .catch(() => setTokenValide(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    if (form.mot_de_passe !== form.confirmation) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post(`/auth/reset-password/${token}`, form)
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
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p className="auth-subtitle">Choisis un nouveau mot de passe sécurisé.</p>

          {erreur && <div className="alert alert-error" role="alert">{erreur}</div>}
          {succes && (
            <>
              <div className="alert alert-success" role="alert">{succes}</div>
              <p className="auth-switch" style={{ marginTop: '1rem' }}>
                <Link href="/connexion">Se connecter maintenant →</Link>
              </p>
            </>
          )}

          {tokenValide === null && !succes && (
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Vérification du lien...</p>
          )}

          {tokenValide === false && !succes && (
            <>
             <div className="alert alert-error" role="alert">Ce lien de réinitialisation est invalide ou a expiré.</div>
              <p className="auth-switch" style={{ marginTop: '1rem' }}>
                <Link href="/mot-de-passe-oublie">Faire une nouvelle demande</Link>
              </p>
            </>
          )}

          {tokenValide === true && !succes && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                  value={form.mot_de_passe}
                  onChange={e => setForm(prev => ({ ...prev, mot_de_passe: e.target.value }))}
                />
              </div>
              <div className="auth-form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  placeholder="Répète ton mot de passe"
                  required
                  minLength={8}
                  value={form.confirmation}
                  onChange={e => setForm(prev => ({ ...prev, confirmation: e.target.value }))}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}