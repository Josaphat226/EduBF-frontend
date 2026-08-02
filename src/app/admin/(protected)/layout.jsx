'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { api } from '@/lib/api'

export default function AdminLayout({ children }) {
  const { admin, loading, logout } = useAdminAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [badges, setBadges] = useState({ totalDocs: 0, commentairesAttente: 0 })

  useEffect(() => {
    if (!admin) return
    api.get('/admin/dashboard')
      .then(res => setBadges({
        totalDocs: res.data.stats.total_documents,
        commentairesAttente: res.data.stats.commentaires_en_attente,
      }))
      .catch(() => {})
  }, [admin])

  useEffect(() => {
    if (!loading && !admin) router.push('/admin/login')
  }, [loading, admin, router])

  if (loading) return null
  if (!admin) return null

  const isActive = (path) => pathname === path

  async function handleLogout() {
    await logout()
    router.push('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">E</div>
          <div>
            <div className="sidebar-logo-text">EduBF</div>
            <div className="sidebar-logo-sub">Administration</div>
          </div>
        </div>

        <div className="sidebar-section-label">GÉNÉRAL</div>
        <nav className="sidebar-nav">
          <Link href="/admin/tableau-de-bord" className={`sidebar-link ${isActive('/admin/tableau-de-bord') ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            Dashboard
          </Link>
          <Link href="/admin/documents" className={`sidebar-link ${isActive('/admin/documents') ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
            Documents
            <span className="sidebar-badge">{badges.totalDocs}</span>
          </Link>
          <Link href="/admin/documents/nouveau" className={`sidebar-link ${isActive('/admin/documents/nouveau') ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            Nouveau document
          </Link>
        </nav>

        <div className="sidebar-section-label">GESTION</div>
        <nav className="sidebar-nav">
          <Link href="/admin/utilisateurs" className={`sidebar-link ${isActive('/admin/utilisateurs') ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Utilisateurs
          </Link>
          <Link href="/admin/commentaires" className={`sidebar-link ${isActive('/admin/commentaires') ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Commentaires
            {badges.commentairesAttente > 0 && <span className="sidebar-badge danger">{badges.commentairesAttente}</span>}
          </Link>
          <Link href="/admin/journal" className={`sidebar-link ${isActive('/admin/journal') ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
            Journal
          </Link>
        </nav>

        <div className="sidebar-section-label">COMPTE</div>
        <nav className="sidebar-nav">
          <a href="/" className="sidebar-link" target="_blank" rel="noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            Voir le site
          </a>
          <button onClick={handleLogout} className="sidebar-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Déconnexion
          </button>
        </nav>

        <div className="sidebar-admin-info">
          <div className="sidebar-avatar">{admin.nom.charAt(0).toUpperCase()}</div>
          <div>
            <div className="sidebar-admin-name">{admin.nom}</div>
            <div className="sidebar-admin-role">Administrateur</div>
          </div>
        </div>
      </aside>

      <div className={`admin-main ${collapsed ? 'expanded' : ''}`}>
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div className="topbar-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Rechercher..." />
            </div>
          </div>
          <div className="topbar-right">
            <Link href="/admin/commentaires" className="topbar-icon-btn" title="Commentaires en attente">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {badges.commentairesAttente > 0 && <span className="topbar-badge">{badges.commentairesAttente}</span>}
            </Link>
            <div className="topbar-admin">
              <div className="topbar-avatar">{admin.nom.charAt(0).toUpperCase()}</div>
              <div className="topbar-admin-info">
                <div className="topbar-admin-name">{admin.nom}</div>
                <div className="topbar-admin-role">Administrateur</div>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}