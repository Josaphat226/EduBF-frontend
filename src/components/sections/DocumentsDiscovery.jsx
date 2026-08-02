'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

function DocCard({ doc, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.55, delay: (index % 3) * 0.12 }}
      whileHover={{ y: -6, rotate: index % 2 === 0 ? -1 : 1 }}
    >
      <Link
        href={`/documents/${doc.id}`}
        style={{
          display: 'block', textDecoration: 'none', background: 'var(--bg-card)',
          borderRadius: 18, padding: '1.4rem', height: '100%',
          boxShadow: '0 10px 30px rgba(15,23,42,0.07)', border: '1px solid rgba(15,23,42,0.04)',
        }}
      >
        <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {doc.type_document}
        </span>
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text)', margin: '.5rem 0 .6rem', lineHeight: 1.3 }}>
          {doc.titre}
        </h4>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', background: 'var(--bg-alt)', padding: '.2rem .6rem', borderRadius: 999 }}>{doc.cycle}</span>
          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', background: 'var(--bg-alt)', padding: '.2rem .6rem', borderRadius: 999 }}>{doc.matiere}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.78rem', color: 'var(--text-muted)' }}>
          <span>{doc.nb_telechargements} téléchargements</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Voir →</span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function DocumentsDiscovery({ documents = [] }) {
  const DOCS = documents.slice(0, 6)
  return (
    <section style={{ background: 'var(--bg-alt)', padding: '6rem 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '.75rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Fraîchement ajoutés
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: 'var(--text)', margin: '.6rem 0 0' }}>
            Des milliers de documents à explorer
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.3rem' }}>
          {DOCS.map((doc, i) => (
            <DocCard key={doc.id} doc={doc} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}