'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'

const CYCLES = ['BEPC', 'BAC', 'BEP', 'CAP', 'BTS']
const STATUTS = [
  { value: 'publie', label: '✅ Publié' },
  { value: 'en_attente', label: '⏳ En attente' },
  { value: 'brouillon', label: '📝 Brouillon' },
  { value: 'archive', label: '📦 Archivé' },
]
const TYPES = ['Cours', 'Devoir', 'Sujet officiel', 'Corrigé', 'TD / TP', 'Résumé']

export default function AdminDocuments() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState(null)
  const [apercu, setApercu] = useState(null)

  const filtres = {
    q: searchParams.get('q') || '',
    cycle: searchParams.get('cycle') || '',
    statut: searchParams.get('statut') || '',
    type_document: searchParams.get('type_document') || '',
  }
  const page = parseInt(searchParams.get('page') || '1')

  const charger = useCallback(() => {
    api.get('/admin/documents', { params: { ...filtres, page } }).then(res => setData(res.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => { charger() }, [charger])

  function setSearchParamsObj(paramsObjOrURLSearchParams) {
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
    setSearchParamsObj(next)
  }

  function goPage(p) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('page', p)
    setSearchParamsObj(next)
  }

  async function changerStatut(id, statut) {
    await api.patch(`/admin/documents/${id}/statut`, { statut })
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement ce document ?')) return
    await api.delete(`/admin/documents/${id}`)
    charger()
  }

  async function ouvrirApercu(doc) {
    setApercu(doc)
  }

  if (!data) return null
  const { documents, pagination } = data

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Documents</h1>
          <p className="admin-page-sub">{pagination.total} document{pagination.total > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/admin/documents/nouveau" className="btn-admin btn-admin-primary">+ Nouveau document</Link>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-filters-form">
          <div className="admin-filter-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              defaultValue={filtres.q}
              placeholder="Rechercher un document..."
              onKeyDown={e => { if (e.key === 'Enter') updateFiltre('q', e.target.value) }}
            />
          </div>
          <select value={filtres.cycle} onChange={e => updateFiltre('cycle', e.target.value)}>
            <option value="">Tous les cycles</option>
            {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtres.statut} onChange={e => updateFiltre('statut', e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filtres.type_document} onChange={e => updateFiltre('type_document', e.target.value)}>
            <option value="">Tous les types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(filtres.q || filtres.cycle || filtres.statut || filtres.type_document) && (
            <button className="btn-admin btn-admin-ghost" onClick={() => setSearchParamsObj({})}>Réinitialiser</button>
          )}
        </div>
      </div>

      <div className="admin-table-card">
        <table>
          <thead>
            <tr><th>Document</th><th>Cycle</th><th>Matière</th><th>Type</th><th>Statut</th><th>Téléch.</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>Aucun document trouvé.</td></tr>
            )}
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div style={{ fontWeight: 700, color: '#0F172A', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.titre}</div>
                  {doc.serie_filiere && <div style={{ fontSize: '.75rem', color: '#94A3B8', marginTop: '.15rem' }}>{doc.serie_filiere}</div>}
                </td>
                <td><span className="badge badge-blue">{doc.cycle}</span></td>
                <td style={{ color: '#64748B', fontSize: '.85rem' }}>{doc.matiere}</td>
                <td><span className="badge badge-gray">{doc.type_document}</span></td>
                <td>
                  <select
                    value={doc.statut}
                    onChange={e => changerStatut(doc.id, e.target.value)}
                    className={`statut-select statut-${doc.statut}`}
                  >
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>
                <td style={{ fontWeight: 700, color: '#959cad' }}>{doc.nb_telechargements}</td>
                <td style={{ color: '#94A3B8', fontSize: '.82rem' }}>{new Date(doc.date_upload).toISOString().substring(0, 10)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                    <button onClick={() => ouvrirApercu(doc)} className="btn-icon" title="Aperçu">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <Link href={`/admin/documents/${doc.id}/editer`} className="btn-icon" title="Modifier">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </Link>
                    <button onClick={() => supprimer(doc.id)} className="btn-icon btn-icon-danger" title="Supprimer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" /><path d="M10,11v6" /><path d="M14,11v6" /><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="admin-pagination">
          {pagination.page > 1 && <button className="page-btn" onClick={() => goPage(pagination.page - 1)}>← Précédent</button>}
          <div className="page-info">Page {pagination.page} / {pagination.totalPages}</div>
          {pagination.page < pagination.totalPages && <button className="page-btn" onClick={() => goPage(pagination.page + 1)}>Suivant →</button>}
        </div>
      )}

      {apercu && (
        <div className="apercu-modal open">
          <div className="apercu-overlay" onClick={() => setApercu(null)}></div>
          <div className="apercu-content">
            <div className="apercu-header">
              <span className="apercu-titre">{apercu.titre}</span>
              <button onClick={() => setApercu(null)} className="apercu-close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <iframe title="Aperçu" src={apercu.fichier_url} className="apercu-iframe"></iframe>
          </div>
        </div>
      )}
    </>
  )
}