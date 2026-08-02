'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BF_VIEWBOX_W, BF_VIEWBOX_H, BF_OUTLINE_D, BF_REGIONS, BF_VILLES } from './bfMapData'

const HUB = BF_VILLES.find(v => v.hub)
const AUTRES = BF_VILLES.filter(v => !v.hub)

export default function BurkinaMap() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section className="bfmap-section">
      <div className="bfmap-glow" />

      <div className="bfmap-grid">

        <motion.div
          className="bfmap-intro"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '.75rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Partout au pays
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, margin: '.6rem 0 1rem', lineHeight: 1.15, color: '#fff' }}>
            Accessible depuis<br />chaque région
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
            De Ouagadougou à Bobo-Dioulasso, du Sahel au Sud-Ouest : les 13 régions du Burkina Faso, à portée de main.
          </p>
        </motion.div>

        <div ref={ref} className="bfmap-svg-wrap">
          <motion.svg
            viewBox={`0 0 ${BF_VIEWBOX_W} ${BF_VIEWBOX_H}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
            animate={{ rotate: [0, 0.6, 0, -0.6, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Les 13 régions administratives réelles */}
            {BF_REGIONS.map((r, i) => (
              <motion.path
                key={r.nom}
                d={r.d}
                className="bfmap-region"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.03 }}
              />
            ))}

            {/* Contour nationale appuyé */}
            <motion.path
              d={BF_OUTLINE_D}
              className="bfmap-outline"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />

            {AUTRES.map((v, i) => (
              <motion.line
                key={'ligne-' + v.nom}
                x1={HUB.x} y1={HUB.y} x2={v.x} y2={v.y}
                stroke="rgba(245,158,11,0.45)"
                strokeWidth="1"
                strokeDasharray="4 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1, delay: 0.9 + i * 0.1 }}
              />
            ))}

            {AUTRES.map((v, i) => (
              <motion.circle
                key={'flux-' + v.nom}
                r="2.2"
                fill="var(--accent)"
                initial={{ opacity: 0 }}
                animate={inView ? {
                  cx: [HUB.x, v.x],
                  cy: [HUB.y, v.y],
                  opacity: [0, 1, 1, 0],
                } : {}}
                transition={{
                  duration: 2.2,
                  delay: 1.8 + i * 0.15,
                  repeat: Infinity,
                  repeatDelay: AUTRES.length * 0.4,
                }}
              />
            ))}

            {AUTRES.map((v, i) => (
              <motion.g
                key={v.nom}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
              >
                <motion.circle
                  cx={v.x} cy={v.y} r="8"
                  fill="var(--accent)"
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: [0.35, 0, 0.35], r: [5, 13, 5] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
                />
                <circle cx={v.x} cy={v.y} r="3" fill="#fff" />
                <text x={v.x} y={v.y - 10} textAnchor="middle" className="bfmap-city-label">
                  {v.nom}
                </text>
              </motion.g>
            ))}

            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              <motion.circle
                cx={HUB.x} cy={HUB.y} r="11"
                fill="var(--accent)"
                animate={{ opacity: [0.4, 0, 0.4], r: [8, 20, 8] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
              <circle cx={HUB.x} cy={HUB.y} r="5.5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
              <text x={HUB.x} y={HUB.y - 16} textAnchor="middle" className="bfmap-hub-label">
                {HUB.nom}
              </text>
            </motion.g>
          </motion.svg>
        </div>
      </div>
    </section>
  )
}