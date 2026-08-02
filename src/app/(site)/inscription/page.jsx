'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const NIVEAUX_DATA = {
  college: {
    classes: ['6ème', '5ème', '4ème', '3ème (BEPC)'],
    filieres: [],
  },
  lycee: {
    classes: ['Seconde', 'Première', 'Terminale'],
    filieres: ['BAC A', 'BAC B', 'BAC C', 'BAC D', 'BAC E', 'BAC F1', 'BAC F2', 'BAC F3', 'BAC F4', 'BAC G1', 'BAC G2', 'BAC H'],
  },
  superieur: {
    classes: ['1ère année', '2ème année', '3ème année', 'Licence', 'Master'],
    filieres: [
      'BTS Informatique de Gestion', 'BTS Comptabilité et Gestion', 'BTS Électrotechnique',
      'BTS Génie Civil', 'BTS Commerce International', 'BTS Secrétariat de Direction',
      'BTS Maintenance Industrielle', 'BTS Banque et Finance', 'BEP Électrotechnique',
      'BEP Génie Civil', 'BEP Comptabilité', 'BEP Informatique', 'CAP Maçonnerie',
      'CAP Menuiserie', 'CAP Électricité', 'CAP Commerce',
    ],
  },
}

export default function Register() {
  const { register } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom_complet: '', email: '', mot_de_passe: '',
    niveau_scolaire: '', classe: '', filiere: '',
  })

  const niveauInfo = form.niveau_scolaire ? NIVEAUX_DATA[form.niveau_scolaire] : null

  function handleNiveauChange(niveau) {
    setForm(f => ({ ...f, niveau_scolaire: niveau, classe: '', filiere: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      await register(form.nom_complet, form.email, form.mot_de_passe)
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
          <Link href="/" className="auth-logo">
            <img src="/images/logo.png" alt="EduBF" style={{ height: 38, width: 'auto' }} />
          </Link>

          <div className="auth-form-box">
            <h1 className="auth-title">Créer un compte</h1>
            <p className="auth-subtitle">Inscris-toi et accède à tous les documents gratuitement</p>

            {erreur && <div className="alert alert-error" role="alert">{erreur}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  placeholder="Ex: Ouédraogo Moussa"
                  required
                  value={form.nom_complet}
                  onChange={e => setForm({ ...form, nom_complet: e.target.value })}
                />
              </div>

              <div className="auth-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="exemple@gmail.com"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="auth-form-group">
                <label>Mot de passe *</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
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

              <div className="auth-form-group">
                <label>Niveau scolaire *</label>
                <select
                  required
                  value={form.niveau_scolaire}
                  onChange={e => handleNiveauChange(e.target.value)}
                >
                  <option value="">-- Choisir ton niveau --</option>
                  <option value="college">Collège</option>
                  <option value="lycee">Lycée</option>
                  <option value="superieur">Supérieur</option>
                </select>
              </div>

              {niveauInfo && (
                <div className="auth-form-group">
                  <label>Classe *</label>
                  <select
                    required
                    value={form.classe}
                    onChange={e => setForm({ ...form, classe: e.target.value })}
                  >
                    <option value="">-- Choisir ta classe --</option>
                    {niveauInfo.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {niveauInfo && niveauInfo.filieres.length > 0 && (
                <div className="auth-form-group">
                  <label>Filière / Série</label>
                  <select
                    value={form.filiere}
                    onChange={e => setForm({ ...form, filiere: e.target.value })}
                  >
                    <option value="">-- Choisir ta filière --</option>
                    {niveauInfo.filieres.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Inscription...' : "S'inscrire gratuitement"}
              </button>
            </form>

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
              S'inscrire avec Google
            </a>

            <p className="auth-switch">
              Déjà un compte ? <Link href="/connexion">Se connecter</Link>
            </p>
          </div>

          <p className="auth-footer-text">
            <a href="#">Conditions d'utilisation</a> · <a href="#">Confidentialité</a>
          </p>
        </div>

        <div className="auth-right">
          <img src="/images/hero-student.png" alt="EduBF" className="auth-bg-img" />
          <div className="auth-right-overlay"></div>

          <div className="auth-float-card auth-float-top">
            <div className="auth-float-dot" style={{ background: '#F59E0B' }}></div>
            <div>
              <div className="auth-float-title">Examens nationaux</div>
              <div className="auth-float-sub">BEPC · BAC · BEP · CAP · BTS</div>
            </div>
          </div>

          <div className="auth-float-card auth-float-mid">
            <div className="auth-float-dot" style={{ background: '#10B981' }}></div>
            <div>
              <div className="auth-float-title">Documents gratuits</div>
              <div className="auth-float-sub">Cours · Devoirs · Corrigés</div>
            </div>
          </div>

          <div className="auth-float-avatars">
            <div className="auth-av" style={{ background: '#2563EB' }}>A</div>
            <div className="auth-av" style={{ background: '#F59E0B' }}>B</div>
            <div className="auth-av" style={{ background: '#10B981' }}>C</div>
            <div className="auth-av" style={{ background: '#EF4444' }}>D</div>
            <span className="auth-av-text">+500 élèves inscrits</span>
          </div>
        </div>
      </div>
    </div>
  )
}