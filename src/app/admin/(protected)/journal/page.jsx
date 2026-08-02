'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AdminJournal() {
  const [actions, setActions] = useState(null)

  useEffect(() => {
    api.get('/admin/journal').then(res => setActions(res.data.actions))
  }, [])

  if (!actions) return null

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Journal des actions</h1>
          <p className="admin-page-sub">Traçabilité de toutes les actions administrateurs</p>
        </div>
      </div>

      <div className="admin-table-card">
        <table>
          <thead>
            <tr><th>Admin</th><th>Action</th><th>Cible</th><th>Détails</th><th>Date</th></tr>
          </thead>
          <tbody>
            {actions.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>Aucune action enregistrée.</td></tr>
            )}
            {actions.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 700, color: '#0F172A' }}>{a.admin_nom}</td>
                <td>
                  <span className={`badge badge-${a.action === 'suppression' ? 'red' : a.action === 'creation' ? 'green' : 'blue'}`}>
                    {a.action}
                  </span>
                </td>
                <td style={{ color: '#64748B' }}>{a.cible} #{a.cible_id}</td>
                <td style={{ fontSize: '.82rem', color: '#475569', maxWidth: 300 }}>{a.details}</td>
                <td style={{ color: '#94A3B8', fontSize: '.82rem' }}>{new Date(a.date_action).toISOString().substring(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}