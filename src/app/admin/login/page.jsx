'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', mot_de_passe: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      await login(form.email, form.mot_de_passe)
      router.push('/admin/tableau-de-bord')
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="form-card">
        <h2>Espace Administrateur</h2>

        {erreur && <div className="alert alert-error" role="alert">{erreur}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@edubf.bf"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              required
              value={form.mot_de_passe}
              onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Connexion...' : 'Connexion Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}