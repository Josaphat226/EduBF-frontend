'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { lireConsentement } from '@/lib/analytics'

// Statistiques d'audience maison : anonymes (identifiant tiré au hasard, aucune adresse IP),
// jamais pour les administrateurs (le serveur les ignore) et jamais si le visiteur a refusé.
const CLE_VISITEUR = 'edubf-visiteur'
const CLE_SESSION = 'edubf-session'
const PAUSE_SESSION_MS = 30 * 60 * 1000 // 30 min sans activité = nouvelle visite
const BATTEMENT_MS = 30 * 1000

function aleatoire() {
  try {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID().replace(/-/g, '').slice(0, 24)
  } catch {}
  return Math.random().toString(36).slice(2, 14) + Date.now().toString(36)
}

function lireVisiteur() {
  try {
    let id = localStorage.getItem(CLE_VISITEUR)
    if (!id || !/^[A-Za-z0-9_-]{8,40}$/.test(id)) { id = aleatoire(); localStorage.setItem(CLE_VISITEUR, id) }
    return id
  } catch { return null }
}

// Renvoie { id, premiere } ; « premiere » vaut true quand une nouvelle visite commence.
function lireSession() {
  const maintenant = Date.now()
  try {
    const brut = JSON.parse(sessionStorage.getItem(CLE_SESSION) || 'null')
    if (brut && brut.id && maintenant - brut.dernier < PAUSE_SESSION_MS) {
      sessionStorage.setItem(CLE_SESSION, JSON.stringify({ id: brut.id, dernier: maintenant }))
      return { id: brut.id, premiere: false }
    }
    const id = aleatoire()
    sessionStorage.setItem(CLE_SESSION, JSON.stringify({ id, dernier: maintenant }))
    return { id, premiere: true }
  } catch { return null }
}

export default function SuiviVisites() {
  const pathname = usePathname()
  const etat = useRef({ chemin: null, id: null })

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    if (lireConsentement() === 'refuse') return
    const visiteur = lireVisiteur()
    if (!visiteur) return
    const e = etat.current

    // Une seule « page vue » par changement de page (même si React rejoue l'effet)
    if (e.chemin !== pathname) {
      const session = lireSession()
      if (!session) return
      e.chemin = pathname
      e.id = null
      const chemin = pathname
      let utm = ''
      try { utm = new URLSearchParams(window.location.search).get('utm_source') || '' } catch {}
      api.post('/stats/vue', {
        visiteur, session: session.id, chemin, premiere: session.premiere,
        referrer: session.premiere ? document.referrer : '', utm: session.premiere ? utm : '',
      }).then((res) => { if (e.chemin === chemin && res.data && res.data.id) e.id = res.data.id }).catch(() => {})
    }

    // Temps réellement passé : un « battement » toutes les 30 s tant que la page est visible
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible' || !e.id) return
      lireSession() // prolonge la visite en cours
      api.post('/stats/battement', { id: e.id, visiteur, secondes: BATTEMENT_MS / 1000 }).catch(() => {})
    }, BATTEMENT_MS)
    return () => clearInterval(t)
  }, [pathname])

  return null
}