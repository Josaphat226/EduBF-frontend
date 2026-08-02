'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CYCLES = [
  {
    id: 'bepc',
    label: 'BEPC',
    titre: 'Collège — BEPC',
    desc: "Sujets officiels, corrigés et cours pour préparer le Brevet dans toutes les matières du collège.",
    matieres: ['Mathématiques', 'Français', 'SVT', 'Histoire-Géo', 'Anglais'],
  },
  {
    id: 'bac',
    label: 'BAC',
    titre: 'Lycée — Baccalauréat',
    desc: 'Toutes les séries (A, C, D, E...) avec sujets récents, examens blancs et corrigés détaillés.',
    matieres: ['Mathématiques', 'Physique-Chimie', 'Philosophie', 'SVT', 'Économie'],
  },
  {
    id: 'bts',
    label: 'BTS',
    titre: 'Supérieur — BTS',
    desc: "Informatique, Comptabilité, Commerce international : les ressources qui suivent chaque filière du supérieur.",
    matieres: ['Informatique', 'Comptabilité', 'Gestion', 'Droit', 'Anglais des affaires'],
  },
]

export default function ExamsSection() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % CYCLES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const cycle = CYCLES[active]

  return (
    <section style={{ background: 'var(--bg)', padding: '6rem 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '.75rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Un niveau pour chacun
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: 'var(--text)', margin: '.6rem 0 0' }}>
            Tous les examens du pays
          </h2>
        </motion.div>

        {/* Onglets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.6rem', marginBottom: '2.5rem' }}>
          {CYCLES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActive(i)}
              style={{
                position: 'relative', padding: '.6rem 1.6rem', borderRadius: 999, border: 'none',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
                color: active === i ? '#fff' : 'var(--text-secondary)',
                background: 'transparent', zIndex: 1,
              }}
            >
              {active === i && (
                <motion.span
                  layoutId="exam-tab-bg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--accent)', zIndex: -1 }}
                />
              )}
              {c.label}
            </button>
          ))}
        </div>

        {/* Panneau animé */}
        <div style={{ position: 'relative', minHeight: 260 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={cycle.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              style={{
                background: 'var(--bg-card)', borderRadius: 24, padding: '2.5rem',
                boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 .8rem' }}>
                  {cycle.titre}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', lineHeight: 1.7, margin: 0 }}>
                  {cycle.desc}
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {cycle.matieres.map((m, i) => (
                  <motion.span
                    key={m}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    style={{
                      padding: '.5rem 1rem', borderRadius: 999, fontSize: '.82rem', fontWeight: 600,
                      background: 'var(--accent-soft)', color: 'var(--accent-hover)',
                    }}
                  >
                    {m}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Barre de progression auto-avance */}
        <div style={{ display: 'flex', gap: '.4rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          {CYCLES.map((c, i) => (
            <div key={c.id} style={{ width: 40, height: 3, borderRadius: 2, background: 'var(--bg-alt)', overflow: 'hidden' }}>
              {active === i && (
                <motion.div
                  key={active}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  style={{ height: '100%', background: 'var(--accent)', transformOrigin: 'left' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}