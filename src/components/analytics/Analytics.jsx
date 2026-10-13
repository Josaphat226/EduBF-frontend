'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { lireConsentement } from '@/lib/analytics'

export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
  const [actif, setActif] = useState(false)

  useEffect(() => {
    const maj = () => {
      const accepte = lireConsentement() === 'accepte'
      setActif(accepte)
      // Si le visiteur refuse après avoir accepté, on coupe aussi la mesure déjà chargée.
      if (id) window[`ga-disable-${id}`] = !accepte
    }
    maj()
    window.addEventListener('edubf-consentement', maj)
    return () => window.removeEventListener('edubf-consentement', maj)
  }, [id])

  if (!id || !actif) return null
  return <GoogleAnalytics gaId={id} />
}