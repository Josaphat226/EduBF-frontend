'use client'

import { useEffect } from 'react'
import { signaler } from '@/lib/contenus'

// Compte la consultation du sujet (une fois par visite). Aucun rendu.
export default function SuiviVue({ code }) {
  useEffect(() => {
    signaler(code, 'vue_sujet')
  }, [code])
  return null
}