'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', mot_de_passe: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      await login(form.email, form.mot_de_passe)
      router.push('/')
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <Link href="/" className="auth-logo">EDUBF</Link>

          <h1 className="auth-title">Se connecter</h1>
          <p className="auth-subtitle">Content de te revoir ! Accède à tes ressources.</p>

         {erreur && <div className="alert alert-error" role="alert">{erreur}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="exemple@gmail.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="auth-form-group">
              <label>Mot de passe</label>
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ton mot de passe"
                  required
                  value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="auth-switch">
            Pas encore de compte ? <Link href="/inscription">S'inscrire gratuitement</Link>
          </p>
          <div className="auth-divider">
            <span>ou</span>
          </div>

          <a href={`${process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '')}/auth/google`} className="auth-btn-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuer avec Google
          </a>
          <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
            <Link href="/mot-de-passe-oublie" style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Mot de passe oublié ?</Link>
          </p>
          <p className="auth-footer-text">
            <a href="#">Conditions d'utilisation</a> · <a href="#">Confidentialité</a>
          </p>
        </div>

        <div className="auth-right">
         <Image
            src="/images/hero-student.png"
            alt="EduBF"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 45vw"
            className="auth-bg-img"
          />
          <div className="auth-right-overlay"></div>
        </div>
      </div>
    </div>
  )
}