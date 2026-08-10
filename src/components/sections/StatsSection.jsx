'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

function Counter({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: 1600, bounce: 0 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) motionVal.set(value)
  }, [inView, value, motionVal])

  useEffect(() => {
    const unsub = spring.on('change', v => setDisplay(Math.round(v)))
    return unsub
  }, [spring])

  return (
    <span ref={ref}>
      {display.toLocaleString('fr-FR')}{suffix}
    </span>
  )
}

export default function StatsSection({ totalDocs = 0 }) {
  const STATS = [
    { value: totalDocs, suffix: '+', label: 'Documents disponibles' },
    { value: 13, suffix: '', label: 'Régions couvertes' },
    { value: 18000, suffix: '+', label: 'Téléchargements' },
    { value: 100, suffix: '%', label: 'Accessible partout' },
  ]

  return (
    <section style={{ background: 'var(--text)', padding: '5rem 0' }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem',
        textAlign: 'center',
      }}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--accent)' }}>
              <Counter value={s.value} suffix={s.suffix} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '.9rem', marginTop: '.4rem' }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}