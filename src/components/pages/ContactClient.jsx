'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function ContactClient() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' })
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await api.post('/contact', form)
      setEnvoye(true)
      setForm({ nom: '', email: '', sujet: '', message: '' })
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <div className="contact-hero">
        <div className="aide-blob-l"></div>
        <div className="aide-blob-r"></div>
        <div className="aide-blob-sm"></div>
        <h1 className="aide-hero-title">Contacte-nous</h1>
        <p className="contact-hero-sub">On est là pour t'aider. Envoie-nous un message !</p>
      </div>

      <div className="contact-wrapper">

        <div className="contact-info-row">
          <div className="contact-info-item">
            <div className="contact-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <div>
              <div className="contact-info-label">Adresse</div>
              <div className="contact-info-val">Ouagadougou, Burkina Faso</div>
            </div>
          </div>

          <a href="mailto:contact@edubf.net" className="contact-info-item" style={{ textDecoration: 'none' }}>
            <div className="contact-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </div>
            <div>
              <div className="contact-info-label">Email</div>
              <div className="contact-info-val">contact@edubf.net</div>
            </div>
          </a>

          <a href="https://wa.me/22655478758" target="_blank" rel="noopener noreferrer" className="contact-info-item" style={{ textDecoration: 'none' }}>
            <div className="contact-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z" /></svg>
            </div>
            <div>
              <div className="contact-info-label">WhatsApp</div>
              <div className="contact-info-val">+226 55 47 87 58</div>
            </div>
          </a>

          <div className="contact-info-item">
            <div className="contact-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
            </div>
            <div>
              <div className="contact-info-label">Disponibilité</div>
              <div className="contact-info-val">Lun - Ven, 8h - 17h</div>
            </div>
          </div>
        </div>

        <div className="contact-form-wrap">
          <h2 className="contact-form-heading">Envoie-nous un message</h2>
          <p className="contact-form-sub">On te répondra dans les 24 heures.</p>

          <form className="contact-form-grid" onSubmit={handleSubmit}>
            <div className="contact-field">
              <label>Nom complet</label>
              <input
                type="text"
                placeholder="Ouédraogo Moussa"
                required
                value={form.nom}
                onChange={e => handleChange('nom', e.target.value)}
              />
            </div>
            <div className="contact-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="exemple@gmail.com"
                required
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
              />
            </div>
            <div className="contact-field contact-field-full">
              <label>Sujet</label>
              <select value={form.sujet} onChange={e => handleChange('sujet', e.target.value)}>
                <option value="">-- Choisir un sujet --</option>
                <option>Question sur un document</option>
                <option>Problème technique</option>
                <option>Suggestion d'amélioration</option>
                <option>Signaler un contenu</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="contact-field contact-field-full">
              <label>Message</label>
              <textarea
                rows="5"
                placeholder="Écris ton message ici..."
                required
                value={form.message}
                onChange={e => handleChange('message', e.target.value)}
              ></textarea>
            </div>
            <div className="contact-field contact-field-full">
              <button type="submit" className="contact-submit" disabled={envoi}>
                {envoi ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
              {envoye && (
                <div className="contact-success" role="alert">
                  Message envoyé ! On te répondra bientôt.
                </div>
              )}
              {erreur && (
                <div className="alert alert-error" role="alert" style={{ marginTop: '.8rem' }}>{erreur}</div>
              )}
            </div>
          </form>
        </div>

      </div>
    </>
  )
}
