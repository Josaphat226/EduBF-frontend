'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'

export default function AdminComments() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState(null)

  const filtre = searchParams.get('filtre') || 'attente'
  const q = searchParams.get('q') || ''

  const charger = useCallback(() => {
    api.get('/admin/commentaires', { params: { filtre, q } }).then(res => setData(res.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => { charger() }, [charger])

  function setFiltre(f) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('filtre', f)
    router.push(`${pathname}?${next.toString()}`)
  }

  async function approuver(id) {
    await api.post(`/admin/commentaires/${id}/approuver`)
    charger()
  }
  async function masquer(id) {
    await api.post(`/admin/commentaires/${id}/masquer`)
    charger()
  }
  async function supprimer(id) {
    if (!confirm('Supprimer ce commentaire ?')) return
    await api.delete(`/admin/commentaires/${id}`)
    charger()
  }

  if (!data) return null
  const { commentaires, stats } = data

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Commentaires</h1>
          <p className="admin-page-sub">{stats.total} commentaire{stats.total > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.8rem' }}>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setFiltre('attente')} className={`btn-admin ${filtre === 'attente' ? 'btn-admin-primary' : 'btn-admin-secondary'}`}>
              ⏳ En attente <span style={{ background: 'rgba(0,0,0,.1)', padding: '.1rem .45rem', borderRadius: 10, fontSize: '.75rem', marginLeft: '.3rem' }}>{stats.attente}</span>
            </button>
            <button onClick={() => setFiltre('approuves')} className={`btn-admin ${filtre === 'approuves' ? 'btn-admin-primary' : 'btn-admin-secondary'}`}>
              ✅ Approuvés <span style={{ background: 'rgba(0,0,0,.1)', padding: '.1rem .45rem', borderRadius: 10, fontSize: '.75rem', marginLeft: '.3rem' }}>{stats.approuves}</span>
            </button>
            <button onClick={() => setFiltre('tous')} className={`btn-admin ${filtre === 'tous' ? 'btn-admin-primary' : 'btn-admin-secondary'}`}>
              Tous <span style={{ background: 'rgba(0,0,0,.1)', padding: '.1rem .45rem', borderRadius: 10, fontSize: '.75rem', marginLeft: '.3rem' }}>{stats.total}</span>
            </button>
          </div>
          <div className="admin-filter-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              defaultValue={q}
              placeholder="Rechercher..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const next = new URLSearchParams(searchParams.toString())
                  next.set('q', e.target.value)
                  router.push(`${pathname}?${next.toString()}`)
                }
              }}
            />
          </div>
        </div>
      </div>

      {commentaires.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', color: '#94A3B8' }}>
          Aucun commentaire dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
          {commentaires.map(c => (
            <div className="comment-admin-card" key={c.id}>
              <div className="comment-admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                  <div className="comment-avatar">{c.nom_complet.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#0F172A' }}>{c.nom_complet}</div>
                    <div style={{ fontSize: '.75rem', color: '#94A3B8' }}>sur "{c.titre_document}"</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                  {c.visible === 1 ? (
                    <span style={{ background: '#F0FDF4', color: '#15803D', padding: '.2rem .7rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>✅ Approuvé</span>
                  ) : (
                    <span style={{ background: '#FFF7ED', color: '#B45309', padding: '.2rem .7rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>⏳ En attente</span>
                  )}
                  <span style={{ fontSize: '.78rem', color: '#94A3B8' }}>{new Date(c.date_publication).toISOString().substring(0, 10)}</span>
                </div>
              </div>

              {c.note && (
                <div style={{ margin: '.5rem 0', fontSize: '.88rem' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ color: i <= c.note ? '#F59E0B' : '#E2E8F0' }}>★</span>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '.88rem', color: '#475569', background: '#F8FAFC', borderRadius: 8, padding: '.8rem 1rem', margin: '.5rem 0 .8rem', borderLeft: '3px solid #E2E8F0' }}>
                "{c.contenu}"
              </p>

              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {c.visible === 0 ? (
                  <button onClick={() => approuver(c.id)} className="btn-admin btn-admin-primary" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }}>✅ Approuver</button>
                ) : (
                  <button onClick={() => masquer(c.id)} className="btn-admin btn-admin-secondary" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }}>🚫 Masquer</button>
                )}
                <button onClick={() => supprimer(c.id)} className="btn-admin btn-admin-danger" style={{ fontSize: '.8rem', padding: '.4rem .9rem' }}>🗑️ Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}