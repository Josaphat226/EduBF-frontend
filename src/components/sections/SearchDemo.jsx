'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'

const SUGGESTIONS = ['Mathématiques', 'Français', 'BAC', 'Physique']

export default function SearchDemo() {
  const [query, setQuery] = useState('')
  const [resultats, setResultats] = useState([])
  const [chargement, setChargement] = useState(true)

  // Recherche reelle sur l'API, avec un leger debounce pour ne pas
  // spammer le serveur a chaque frappe.
  useEffect(() => {
    setChargement(true)
    const t = setTimeout(() => {
      api.get('/documents', { params: { q: query, page: 1 } })
        .then(res => setResultats(res.data.documents.slice(0, 4)))
        .catch(() => setResultats([]))
        .finally(() => setChargement(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <section style={{ background: 'var(--bg-alt)', padding: '6rem 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '.75rem', letterSpacing: '.08em', textTransform: 'uppercase' }}
        >
          Essaie tout de suite
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ delay: 0.1 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: 'var(--text)', margin: '.6rem 0 2rem' }}
        >
          Ton document, en quelques lettres
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ delay: 0.2 }}
          style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Essaie : « Mathématiques »"
            style={{
              width: '100%', padding: '1rem 1.4rem', borderRadius: 999,
              border: '2px solid var(--border, #E2E8F0)', fontSize: '1rem',
              fontFamily: 'inherit', outline: 'none', background: 'var(--bg-card)',
              color: 'var(--text)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
            }}
          />
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                style={{
                  padding: '.4rem .9rem', borderRadius: 999, fontSize: '.8rem',
                  border: '1px solid rgba(245,158,11,0.4)', background: 'var(--accent-soft)',
                  color: 'var(--accent-hover)', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '2.5rem', textAlign: 'left', minHeight: 120 }}>
          {chargement ? (
            <p style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center' }}>Recherche...</p>
          ) : (
            <AnimatePresence mode="popLayout">
              {resultats.map(doc => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                >
                  <Link
                    href={`/documents/${doc.id}`}
                    style={{
                      display: 'block', textDecoration: 'none',
                      background: 'var(--bg-card)', borderRadius: 14, padding: '1.1rem',
                      boxShadow: '0 6px 20px rgba(15,23,42,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                      {doc.type_document}
                    </span>
                    <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)', margin: '.4rem 0' }}>
                      {doc.titre}
                    </h4>
                    <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      {doc.cycle}{doc.serie_filiere ? ` · ${doc.serie_filiere}` : ''}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {!chargement && resultats.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center' }}
            >
              {query ? `Aucun résultat pour « ${query} » — essaie un autre mot-clé.` : 'Aucun document pour le moment.'}
            </motion.p>
          )}
        </div>
      </div>
    </section>
  )
}