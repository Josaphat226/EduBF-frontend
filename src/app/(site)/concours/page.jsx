'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import {
  Cpu, Sigma, Zap, Megaphone, Brain, Globe2, Code2, HeartPulse,
  GraduationCap, Scale, TrendingUp, BookText, Landmark, Languages,
  FlaskConical, Map, Dna, Atom, School, FileText,
} from 'lucide-react'

import { ConcoursGridSkeleton } from '@/components/ui/Skeleton'

const ICONES_PAR_DOMAINE = {
  'Informatique': Cpu,
  'Mathématiques': Sigma,
  'Électronique': Zap,
  'Marketing & Management': Megaphone,
  'Logic Tests': Brain,
  'Culture Générale': Globe2,
  'Programmation': Code2,
  'Santé & Médecine': HeartPulse,
  'Sciences de l\'Éducation': GraduationCap,
  'Droit': Scale,
  'Économie': TrendingUp,
  'Langue Française': BookText,
  'Histoire': Landmark,
  'Anglais': Languages,
  'Chimie': FlaskConical,
  'Géographie': Map,
  'Biologie': Dna,
  'Physique': Atom,
  'Didactique': School,
}

export default function ConcoursPage() {
  const [domaines, setDomaines] = useState(null)

  useEffect(() => {
    api.get('/concours/domaines').then(res => setDomaines(res.data.domaines)).catch(() => setDomaines([]))
  }, [])

  return (
    <>
      <div className="docs-hero">
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
       <h1 className="docs-hero-title">QCM</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '-.8rem', marginBottom: '1.4rem', position: 'relative' }}>
          Entraîne-toi et améliore tes connaissances.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.8rem', flexWrap: 'wrap', position: 'relative' }}>
          <Link href="/concours/entrainement" className="hero-btn-main" style={{ textDecoration: 'none' }}>
            Entraînement personnalisé
          </Link>
          <Link
            href="/concours/mes-sessions"
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '.7rem 1.4rem', borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 700, fontSize: '.9rem',
              textDecoration: 'none',
            }}
          >
            Mes sessions
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 3rem' }}>
        {!domaines ? (
          <ConcoursGridSkeleton />
        ) : domaines.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun domaine disponible pour l'instant.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '1.1rem' }}>
            {domaines.map((d, i) => {
              const Icone = ICONES_PAR_DOMAINE[d.nom] || FileText
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <Link
                    href={`/concours/${d.id}`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.7rem',
                      padding: '1.6rem 1rem', borderRadius: 18, background: 'var(--bg-card)',
                      border: '1px solid var(--border)', textDecoration: 'none', textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, background: 'var(--accent-soft, rgba(245,158,11,0.12))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icone size={22} strokeWidth={1.75} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--text)' }}>{d.nom}</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                      {d.nb_series} série{d.nb_series > 1 ? 's' : ''}
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}