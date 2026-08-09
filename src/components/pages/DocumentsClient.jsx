'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { DocGridSkeleton } from '@/components/ui/Skeleton'

const MATIERES = [
  'Mathématiques', 'Français', 'Physique-Chimie', 'SVT', 'Histoire-Géographie',
  'Anglais', 'Philosophie', 'Informatique', 'Comptabilité', 'Économie', 'Électrotechnique',
]

const TYPES = ['Cours', 'Devoir', 'Composition', 'Sujet officiel', 'Corrigé', 'TD / TP', 'Résumé']

function slugType(type) {
  return type.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')
}

export default function DocumentsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filtres = {
    q: searchParams.get('q') || '',
    cycle: searchParams.get('cycle') || '',
    matiere: searchParams.get('matiere') || '',
    type_document: searchParams.get('type_document') || '',
  }
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [documents, setDocuments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    setChargement(true)
    api.get('/documents', { params: { ...filtres, page } })
      .then(res => {
        setDocuments(res.data.documents)
        setPagination(res.data.pagination)
        setErreur('')
      })
      .catch(err => setErreur(err.message))
      .finally(() => setChargement(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres.q, filtres.cycle, filtres.matiere, filtres.type_document, page])

  function setSearchParams(paramsObjOrURLSearchParams) {
    const next = paramsObjOrURLSearchParams instanceof URLSearchParams
      ? paramsObjOrURLSearchParams
      : new URLSearchParams(paramsObjOrURLSearchParams)
    router.push(`${pathname}?${next.toString()}`)
  }

  function updateFiltre(key, value) {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function goToPage(n) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('page', n)
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeFiltre(key) {
    updateFiltre(key, '')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = e.target.q.value
    updateFiltre('q', q)
  }

  const hasActiveTags = filtres.cycle || filtres.matiere || filtres.type_document

const [filtresOuverts, setFiltresOuverts] = useState(false)
  const nombreFiltresActifs = [filtres.cycle, filtres.matiere, filtres.type_document].filter(Boolean).length

  return (
    <>
      <div className="docs-hero">
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
        <h1 className="docs-hero-title">Tous les documents</h1>
        <form onSubmit={handleSearchSubmit} className="docs-search-wrap">
          <input type="text" name="q" defaultValue={filtres.q} placeholder="Rechercher un cours, un sujet, une matière..." />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </form>
      </div>

      <div className="docs-tabs-bar">
        <span className="docs-tab active">Tous les documents</span>
      </div>

    <div className="docs-page-layout">
        <button
          type="button"
          className={`docs-filtres-toggle-btn ${filtresOuverts ? 'open' : ''}`}
          onClick={() => setFiltresOuverts(o => !o)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Filtres
          {nombreFiltresActifs > 0 && <span className="docs-filtres-toggle-badge">{nombreFiltresActifs}</span>}
          <svg className="docs-filtres-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <aside className={`docs-sidebar-new ${filtresOuverts ? 'docs-sidebar-mobile-open' : ''}`}>
          <div className="docs-sidebar-header">
            <span>Filtres</span>
            <button
              type="button"
              className="docs-sidebar-reset"
              onClick={() => setSearchParams(filtres.q ? { q: filtres.q } : {})}
            >
              Réinitialiser
            </button>
          </div>

          <div className="docs-filter-group-new">
            <div className="docs-filter-label">Cycle / Examen</div>
            {[
              { value: '', label: 'Tous' },
              { value: 'BEPC', label: 'BEPC', badge: '3e' },
              { value: 'BAC', label: 'BAC', badge: 'Lycée' },
              { value: 'BEP', label: 'BEP', badge: 'Technique' },
              { value: 'CAP', label: 'CAP', badge: 'Pro' },
              { value: 'BTS', label: 'BTS', badge: 'Supérieur' },
            ].map(opt => (
              <div className="docs-radio-item" key={opt.value || 'tous'}>
                <label>
                  <input
                    type="radio"
                    name="cycle"
                    checked={filtres.cycle === opt.value}
                    onChange={() => updateFiltre('cycle', opt.value)}
                  />{' '}
                  <span>{opt.label}</span>
                </label>
                {opt.badge && <span className="docs-radio-badge-new">{opt.badge}</span>}
              </div>
            ))}
          </div>

          <div className="docs-filter-group-new">
            <div className="docs-filter-label">Matière</div>
            <select
              className="docs-filter-select"
              value={filtres.matiere}
              onChange={e => updateFiltre('matiere', e.target.value)}
            >
              <option value="">Toutes les matières</option>
              {MATIERES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="docs-filter-group-new">
            <div className="docs-filter-label">Type de document</div>
            <select
              className="docs-filter-select"
              value={filtres.type_document}
              onChange={e => updateFiltre('type_document', e.target.value)}
            >
              <option value="">Tous les types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </aside>

        <main className="docs-main-new">
          <div className="docs-results-bar-new">
            <span className="docs-results-count-new">
              <strong>{pagination.total}</strong> document{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
            </span>
            {hasActiveTags && (
              <div className="docs-active-tags">
                {filtres.cycle && (
                  <span className="docs-active-tag-new">
                    {filtres.cycle}
                    <button type="button" onClick={() => removeFiltre('cycle')}>×</button>
                  </span>
                )}
                {filtres.matiere && (
                  <span className="docs-active-tag-new">
                    {filtres.matiere}
                    <button type="button" onClick={() => removeFiltre('matiere')}>×</button>
                  </span>
                )}
                {filtres.type_document && (
                  <span className="docs-active-tag-new">
                    {filtres.type_document}
                    <button type="button" onClick={() => removeFiltre('type_document')}>×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {erreur && <div className="alert alert-error">{erreur}</div>}

          {chargement ? (
            <DocGridSkeleton />
          ) : documents.length === 0 ? (
            <div className="docs-empty-new">
              <div className="docs-empty-icon">📂</div>
              <h3>Aucun document trouvé</h3>
              <p>Essaie d'autres filtres ou <Link href="/documents">réinitialise la recherche</Link>.</p>
            </div>
          ) : (
            <>
              <div className="docs-grid-new">
                {documents.map(doc => (
                  <Link href={`/documents/${doc.id}`} className="doc-item-new" key={doc.id}>
                    <div className="doc-item-top-new">
                      <span className={`doc-type-new doc-type-${slugType(doc.type_document)}`}>
                        {doc.type_document}
                      </span>
                      <span className="doc-dl-new">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        {doc.nb_telechargements}
                      </span>
                    </div>
                    <div className="doc-title-new">{doc.titre}</div>
                    <div className="doc-tags-new">
                      <span className="doc-tag-new">{doc.cycle}</span>
                      {doc.serie_filiere && <span className="doc-tag-new">{doc.serie_filiere}</span>}
                      <span className="doc-tag-new">{doc.matiere}</span>
                      {doc.annee_scolaire && <span className="doc-tag-new doc-tag-year">{doc.annee_scolaire}</span>}
                    </div>
                    <div className="doc-footer-new">
                      <span className="doc-date-new">{doc.date_upload}</span>
                      <span className="doc-arrow-new">Voir →</span>
                    </div>
                  </Link>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="docs-pagination">
                  <button
                    type="button"
                    className="docs-page-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => goToPage(pagination.page - 1)}
                    style={pagination.page <= 1 ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
                  >
                    ← Précédent
                  </button>
                  <div className="docs-page-nums">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(n => (
                      <button
                        type="button"
                        key={n}
                        className={`docs-page-num ${n === pagination.page ? 'active' : ''}`}
                        onClick={() => goToPage(n)}
                        style={{ border: 'none', cursor: 'pointer', font: 'inherit' }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="docs-page-btn"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => goToPage(pagination.page + 1)}
                    style={pagination.page >= pagination.totalPages ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}