'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'

export default function AdminUsers() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState(null)

  const filtres = { q: searchParams.get('q') || '', statut: searchParams.get('statut') || '' }
  const page = parseInt(searchParams.get('page') || '1')

  const charger = useCallback(() => {
    api.get('/admin/utilisateurs', { params: { ...filtres, page } }).then(res => setData(res.data))
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

  async function suspendre(id) {
    if (!confirm('Suspendre cet utilisateur ?')) return
    await api.post(`/admin/utilisateurs/${id}/suspendre`)
    charger()
  }

  async function reactiver(id) {
    await api.post(`/admin/utilisateurs/${id}/reactiver`)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return
    await api.delete(`/admin/utilisateurs/${id}`)
    charger()
  }

  if (!data) return null
  const { users, pagination } = data

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Utilisateurs</h1>
          <p className="admin-page-sub">{pagination.total} utilisateur{pagination.total > 1 ? 's' : ''} inscrits</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-filters-form">
          <div className="admin-filter-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              defaultValue={filtres.q}
              placeholder="Rechercher un utilisateur..."
              onKeyDown={e => { if (e.key === 'Enter') updateFiltre('q', e.target.value) }}
            />
          </div>
          <select value={filtres.statut} onChange={e => updateFiltre('statut', e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="actif">✅ Actif</option>
            <option value="suspendu">🚫 Suspendu</option>
          </select>
          {(filtres.q || filtres.statut) && (
            <button className="btn-admin btn-admin-ghost" onClick={() => setSearchParamsObj({})}>Réinitialiser</button>
          )}
        </div>
      </div>

      <div className="admin-table-card">
        <table>
          <thead>
            <tr><th>Utilisateur</th><th>Email</th><th>Filière</th><th>Statut</th><th>Inscription</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>Aucun utilisateur trouvé.</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                    <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#FF6B35,#F59E0B)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.82rem', fontWeight: 800, flexShrink: 0 }}>
                      {u.nom_complet.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '.88rem' }}>{u.nom_complet}</div>
                      <div style={{ fontSize: '.73rem', color: '#94A3B8' }}>#{u.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#475569', fontSize: '.85rem' }}>{u.email}</td>
                <td style={{ color: '#64748B', fontSize: '.82rem' }}>{u.filiere_preferee || '—'}</td>
                <td>
                  {u.statut === 'actif' ? (
                    <span style={{ background: '#F0FDF4', color: '#15803D', padding: '.25rem .7rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>✅ Actif</span>
                  ) : (
                    <span style={{ background: '#FEF2F2', color: '#B91C1C', padding: '.25rem .7rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>🚫 Suspendu</span>
                  )}
                </td>
                <td style={{ color: '#94A3B8', fontSize: '.82rem' }}>{new Date(u.date_inscription).toISOString().substring(0, 10)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    {u.statut === 'actif' ? (
                      <button onClick={() => suspendre(u.id)} className="btn-icon btn-icon-warning" title="Suspendre">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                      </button>
                    ) : (
                      <button onClick={() => reactiver(u.id)} className="btn-icon btn-icon-success" title="Réactiver">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>
                      </button>
                    )}
                    <button onClick={() => supprimer(u.id)} className="btn-icon btn-icon-danger" title="Supprimer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" /><path d="M10,11v6" /><path d="M14,11v6" /></svg>
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
    </>
  )
}