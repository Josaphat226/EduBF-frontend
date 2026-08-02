'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// Coordonnées en % du conteneur (0-100 x, 0-100 y). "side" indique de quel
// côté du point le texte se déploie : 'right' (texte étendu vers la droite,
// étapes 1 et 2) ou 'left' (texte qui se termine sous le point et s'étend
// vers la gauche — nécessaire pour l'étape 3, dont le point est proche du
// bord droit, sinon le texte déborderait).
const STEPS = [
  {
    n: '01',
    x: 10, y: 82,
    side: 'right',
    title: 'Choisis ton niveau',
    text: 'Collège, lycée ou supérieur — indique ta classe et ta filière pour ne voir que ce qui te concerne.',
  },
  {
    n: '02',
    x: 50, y: 50,
    side: 'right',
    title: 'Trouve ton document',
    text: 'Cours, sujets, corrigés et examens blancs classés par matière, triés selon ce qui marche le mieux pour toi.',
  },
  {
    n: '03',
    x: 88, y: 18,
    side: 'left',
    title: 'Télécharge et réussis',
    text: "Accès direct au PDF, sans détour. Reviens quand tu veux, tout reste disponible gratuitement.",
  },
]

// Le viewBox utilise le meme repere 0-100 x 0-100 que les positions
// ci-dessus (preserveAspectRatio="none"), pour que la courbe reste alignee
// avec les points quelle que soit la largeur/hauteur reelle du conteneur.
const PATH_D = `M ${STEPS[0].x} ${STEPS[0].y} C ${STEPS[0].x + 15} ${STEPS[0].y - 6}, ${STEPS[1].x - 12} ${STEPS[1].y + 12}, ${STEPS[1].x} ${STEPS[1].y} C ${STEPS[1].x + 12} ${STEPS[1].y - 8}, ${STEPS[2].x - 10} ${STEPS[2].y + 10}, ${STEPS[2].x} ${STEPS[2].y}`

function DesktopStepPoint({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const isRight = step.side === 'right'

  return (
    <div ref={ref} style={{ position: 'absolute', left: `${step.x}%`, top: `${step.y}%`, width: 0, height: 0 }}>
      <motion.div
        className="psteps-dot"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.35 }}
      />

      <motion.div
        className={`psteps-content ${isRight ? 'psteps-content-right' : 'psteps-content-left'}`}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.35 + 0.2 }}
      >
        <span className="psteps-num">{step.n}</span>
        <div className="psteps-text">
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </div>
      </motion.div>
    </div>
  )
}

function MobileStepItem({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <motion.div
      ref={ref}
      className="psteps-mobile-item"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
    >
      <div className="psteps-mobile-line" />
      <div className="psteps-mobile-num">{step.n}</div>
      <div className="psteps-mobile-text">
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </div>
    </motion.div>
  )
}

export default function ProcessSteps() {
  const pathRef = useRef(null)
  const inView = useInView(pathRef, { once: true, margin: '-20% 0px' })

  return (
    <section className="psteps-section">

      <motion.div
        className="psteps-intro"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20% 0px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="psteps-eyebrow">Simple, rapide, gratuit</span>
        <h2 className="psteps-heading">Trois étapes pour réussir</h2>
        <p className="psteps-desc">Pas d'inscription compliquée, pas de publicité qui bloque le téléchargement. EduBF va droit au but.</p>
      </motion.div>

      {/* ---- Version desktop / tablette : tracé courbe animé ---- */}
      <div className="psteps-desktop">
        <div ref={pathRef} className="psteps-curve-wrap">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            <motion.path
              d={PATH_D}
              vectorEffect="non-scaling-stroke"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </svg>

          {STEPS.map((step, i) => (
            <DesktopStepPoint key={step.n} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* ---- Version mobile : timeline verticale simple, garantie lisible ---- */}
      <div className="psteps-mobile">
        {STEPS.map((step, i) => (
          <MobileStepItem key={step.n} step={step} index={i} />
        ))}
      </div>
    </section>
  )
}