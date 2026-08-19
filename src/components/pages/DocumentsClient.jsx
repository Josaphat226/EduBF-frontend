'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, BookOpen, PenLine, ClipboardCheck, BadgeCheck, Library, GraduationCap } from 'lucide-react'
import { api } from '@/lib/api'
import { Skeleton, DocGridSkeleton } from '@/components/ui/Skeleton'

function slugType(type) {
  return (type || '').toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')
}

const ICONES_CATEGORIES = {
  'sujets-examen': FileText,
  'cours': BookOpen,
  'exercices': PenLine,
  'td-tp': ClipboardCheck,
  'corriges': BadgeCheck,
  'livres-manuels': Library,
  'memoires-theses': GraduationCap,
}

const TEINTES_CATEGORIES = {
  'sujets-examen': { bg: 'rgba(37,99,235,0.08)', fg: '#2563EB' },
  'cours': { bg: 'rgba(245,158,11,0.10)', fg: '#D97706' },
  'exercices': { bg: 'rgba(16,185,129,0.10)', fg: '#059669' },
  'td-tp': { bg: 'rgba(139,92,246,0.10)', fg: '#7C3AED' },
  'corriges': { bg: 'rgba(236,72,153,0.09)', fg: '#DB2777' },
  'livres-manuels': { bg: 'rgba(14,165,233,0.10)', fg: '#0284C7' },
  'memoires-theses': { bg: 'rgba(234,88,12,0.10)', fg: '#EA580C' },
}

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function DocumentsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filtres = {
    q: searchParams.get('q') || '',
    categorie_id: searchParams.get('categorie_id') || '',
    examen_id: searchParams.get('examen_id') || '',
    serie_id: searchParams.get('serie_id') || '',
    matiere_id: searchParams.get('matiere_id') || '',
    type_precis_id: searchParams.get('type_precis_id') || '',
  }
  const page = parseInt(searchParams.get('page') || '1')

  // Vue "accueil catégories" tant qu'aucune catégorie n'est choisie et qu'il n'y a pas de recherche
  const vueListe = !!(filtres.categorie_id || filtres.q)

  const [categories, setCategories] = useState(null)
  const [examens, setExamens] = useState([])
  const [series, setSeries] = useState([])
  const [matieres, setMatieres] = useState([])
  const [typesDocument, setTypesDocument] = useState([])
  const [documents, setDocuments] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Charge les 7 catégories une fois (utilisé pour la vue accueil ET pour retrouver
  // le nom de la catégorie active dans la vue liste)
  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.categories)).catch(() => setCategories([]))
  }, [])

  const categorieActive = categories?.find(c => String(c.id) === filtres.categorie_id)
  const estExamenLike = categorieActive && ['sujets-examen', 'corriges'].includes(categorieActive.slug)

  // Charge les référentiels contextuels selon la catégorie active
  useEffect(() => {
    if (!vueListe) return
    api.get('/types-document', { params: { categorie_id: filtres.categorie_id || undefined } })
      .then(res => setTypesDocument(res.data.types_document)).catch(() => setTypesDocument([]))

    if (estExamenLike) {
      api.get('/examens').then(res => setExamens(res.data.examens)).catch(() => setExamens([]))
    } else {
      api.get('/matieres').then(res => setMatieres(res.data.matieres)).catch(() => setMatieres([]))
    }
  }, [vueListe, filtres.categorie_id, estExamenLike])

  // Charge les séries dès qu'un examen est sélectionné
  useEffect(() => {
    if (!filtres.examen_id) { setSeries([]); return }
    api.get('/series', { params: { examen_id: filtres.examen_id } })
      .then(res => setSeries(res.data.series)).catch(() => setSeries([]))
  }, [filtres.examen_id])

  // Charge les documents (vue liste uniquement)
  const chargerDocuments = useCallback(() => {
    if (!vueListe) return
    setDocuments(null)
    api.get('/documents', { params: { ...filtres, page } })
      .then(res => { setDocuments(res.data.documents); setPagination(res.data.pagination) })
      .catch(() => setDocuments([]))
  }, [vueListe, JSON.stringify(filtres), page])

  useEffect(() => { chargerDocuments() }, [chargerDocuments])

  function updateFiltre(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    // Choisir une nouvelle catégorie réinitialise les filtres contextuels (examen/série/matière)
    if (key === 'categorie_id') { next.delete('examen_id'); next.delete('serie_id'); next.delete('matiere_id'); next.delete('type_precis_id') }
    if (key === 'examen_id') { next.delete('serie_id') }
    router.push(`${pathname}?${next.toString()}`)
  }

  function goPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    router.push(`${pathname}?${next.toString()}`)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    updateFiltre('q', e.target.q.value)
  }

  const hasActiveTags = filtres.examen_id || filtres.serie_id || filtres.matiere_id || filtres.type_precis_id

  return (
    <>
      <div className="docs-hero">
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
        <h1 className="docs-hero-title">
          {vueListe ? (categorieActive ? categorieActive.nom : 'Résultats de recherche') : 'Tous les documents'}
        </h1>
        <form onSubmit={handleSearchSubmit} className="docs-search-wrap">
          <input type="text" name="q" defaultValue={filtres.q} placeholder="Rechercher un cours, un sujet, une matière..." />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </form>
      </div>

      {/* ---- VUE ACCUEIL : les 7 grandes cartes ---- */}
      {!vueListe && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
          {!categories ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.2rem' }}>
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} style={{ height: 172 }} />)}
            </div>
          ) : (
            <motion.div
              variants={cardContainer}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem' }}
            >
              {categories.map(cat => {
                const Icone = ICONES_CATEGORIES[cat.slug] || DocumentTextIcon
                const teinte = TEINTES_CATEGORIES[cat.slug] || { bg: 'var(--bg-alt)', fg: 'var(--text-secondary)' }
                return (
                  <motion.button
                    key={cat.id}
                    variants={cardItem}
                    onClick={() => updateFiltre('categorie_id', String(cat.id))}
                    whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '.9rem',
                      padding: '1.8rem 1.6rem', borderRadius: 20, background: 'var(--bg-card)',
                      border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(15,23,42,0.14)'; e.currentTarget.style.borderColor = 'transparent' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <motion.span
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      style={{
                        width: 52, height: 52, borderRadius: 15, background: teinte.bg, color: teinte.fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icone size={26} strokeWidth={1.6} />
                    </motion.span>
                    <div>
                      <div style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                        {cat.nom}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '.25rem' }}>
                        {cat.nb_documents} document{cat.nb_documents > 1 ? 's' : ''}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* ---- VUE LISTE : filtres + résultats ---- */}
      {vueListe && (
        <>
          <div className="docs-tabs-bar">
            <button className="docs-tab" onClick={() => updateFiltre('categorie_id', '')} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
              ← Toutes les catégories
            </button>
            <span className="docs-tab active">{categorieActive ? categorieActive.nom : 'Recherche'}</span>
          </div>

          <div className="docs-page-layout">
            <aside className="docs-sidebar-new">
              <div className="docs-sidebar-header">
                <span>Filtres</span>
                <button
                  type="button"
                  className="docs-sidebar-reset"
                  onClick={() => router.push(`${pathname}?categorie_id=${filtres.categorie_id}${filtres.q ? `&q=${filtres.q}` : ''}`)}
                >
                  Réinitialiser
                </button>
              </div>

              {estExamenLike ? (
                <>
                  <div className="docs-filter-group-new">
                    <div className="docs-filter-label">Examen</div>
                    {examens.map(ex => (
                      <div className="docs-radio-item" key={ex.id}>
                        <label>
                          <input type="radio" name="examen" checked={filtres.examen_id === String(ex.id)} onChange={() => updateFiltre('examen_id', String(ex.id))} />{' '}
                          <span>{ex.nom}</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {series.length > 0 && (
                    <div className="docs-filter-group-new">
                      <div className="docs-filter-label">Série / Filière</div>
                      <select className="docs-filter-select" value={filtres.serie_id} onChange={e => updateFiltre('serie_id', e.target.value)}>
                        <option value="">Toutes les séries</option>
                        {series.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div className="docs-filter-group-new">
                  <div className="docs-filter-label">Matière</div>
                  <select className="docs-filter-select" value={filtres.matiere_id} onChange={e => updateFiltre('matiere_id', e.target.value)}>
                    <option value="">Toutes les matières</option>
                    {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                </div>
              )}

              {typesDocument.length > 0 && (
                <div className="docs-filter-group-new">
                  <div className="docs-filter-label">Type de document</div>
                  <select className="docs-filter-select" value={filtres.type_precis_id} onChange={e => updateFiltre('type_precis_id', e.target.value)}>
                    <option value="">Tous les types</option>
                    {typesDocument.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>
              )}
            </aside>

            <main className="docs-main-new">
              <div className="docs-results-bar-new">
                <span className="docs-results-count-new">
                  <strong>{pagination.total}</strong> document{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
                </span>
                {hasActiveTags && (
                  <div className="docs-active-tags">
                    {filtres.examen_id && examens.find(e => String(e.id) === filtres.examen_id) && (
                      <span className="docs-active-tag-new">
                        {examens.find(e => String(e.id) === filtres.examen_id).nom}
                        <button type="button" onClick={() => updateFiltre('examen_id', '')}>×</button>
                      </span>
                    )}
                    {filtres.matiere_id && matieres.find(m => String(m.id) === filtres.matiere_id) && (
                      <span className="docs-active-tag-new">
                        {matieres.find(m => String(m.id) === filtres.matiere_id).nom}
                        <button type="button" onClick={() => updateFiltre('matiere_id', '')}>×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {documents === null ? (
                <DocGridSkeleton count={6} />
              ) : documents.length === 0 ? (
                <div className="docs-empty-new">
                  <div className="docs-empty-icon">📂</div>
                  <h3>Aucun document trouvé</h3>
                  <p>Essaie d'autres filtres ou <Link href="/documents">réinitialise la recherche</Link>.</p>
                </div>
              ) : (
                <div className="docs-grid-new">
                  {documents.map(doc => (
                    <Link href={`/documents/${doc.id}`} className="doc-item-new" key={doc.id}>
                      <div className="doc-item-top-new">
                        <span className={`doc-type-new doc-type-${slugType(doc.type_precis_nom)}`}>
                          {doc.type_precis_nom || 'Document'}
                        </span>
                        <span className="doc-dl-new">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          {doc.nb_telechargements}
                        </span>
                      </div>
                      <div className="doc-title-new">{doc.titre}</div>
                      <div className="doc-tags-new">
                        {doc.examen_nom && <span className="doc-tag-new">{doc.examen_nom}</span>}
                        {doc.categorie_nom && <span className="doc-tag-new">{doc.categorie_nom}</span>}
                        {doc.annee && <span className="doc-tag-new doc-tag-year">{doc.annee}</span>}
                      </div>
                      <div className="doc-footer-new">
                        <span className="doc-date-new">{new Date(doc.date_upload).toISOString().substring(0, 10)}</span>
                        <span className="doc-arrow-new">Voir →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="docs-pagination-new">
                  {pagination.page > 1 && <button className="page-btn" onClick={() => goPage(pagination.page - 1)}>← Précédent</button>}
                  <div className="page-info">Page {pagination.page} / {pagination.totalPages}</div>
                  {pagination.page < pagination.totalPages && <button className="page-btn" onClick={() => goPage(pagination.page + 1)}>Suivant →</button>}
                </div>
              )}
            </main>
          </div>
        </>
      )}
    </>
  )
}