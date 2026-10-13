'use client'

import { useEffect, useState } from 'react'
import { CLE_CONSENTEMENT, lireConsentement } from '@/lib/analytics'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_ID) return
    setVisible(lireConsentement() === null)
    const rouvrir = () => setVisible(true)
    window.addEventListener('edubf-rouvrir-consentement', rouvrir)
    return () => window.removeEventListener('edubf-rouvrir-consentement', rouvrir)
  }, [])

  function choisir(valeur) {
    try { localStorage.setItem(CLE_CONSENTEMENT, valeur) } catch {}
    window.dispatchEvent(new Event('edubf-consentement'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="consent-banner" role="dialog" aria-label="Cookies">
      <div className="consent-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
        </svg>
      </div>
      <div className="consent-body">
        <strong>Ta vie privée compte</strong>
        <p>Nous mesurons l'audience pour améliorer EduBF. Pas de publicité.</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="consent-btn" onClick={() => choisir('refuse')}>Refuser</button>
        <button type="button" className="consent-btn primary" onClick={() => choisir('accepte')}>Accepter</button>
      </div>
    </div>
  )
}