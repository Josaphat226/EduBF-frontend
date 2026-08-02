'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Chart from 'chart.js/auto'
import { api } from '@/lib/api'
import { useAdminAuth } from '@/context/AdminAuthContext'

const AVATAR_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AdminDashboard() {
  const { admin } = useAdminAuth()
  const [data, setData] = useState(null)
  const [erreur, setErreur] = useState('')
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(err => setErreur(err.message))
  }, [])

  useEffect(() => {
    if (!data || !canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.chartData.labels,
        datasets: [{
          label: 'Téléchargements',
          data: data.chartData.values,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#2563EB',
          pointRadius: 4,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { color: '#94A3B8', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [data])

  if (erreur) return <div className="alert alert-error">{erreur}</div>
  if (!data) return null

  const { stats, documents, derniers_users } = data

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-blob-l"></div>
        <div className="welcome-blob-r"></div>
        <div className="welcome-blob-sm"></div>
        <div className="welcome-text">
          <h2>Bonjour, {admin.nom.split(' ')[0]} !</h2>
          <p>Voici ce qui se passe sur EduBF aujourd'hui.</p>
        </div>
        <div className="welcome-stats">
          <div className="welcome-stat"><span className="w-number">{stats.total_documents}</span><span className="w-label">Documents</span></div>
          <div className="welcome-stat"><span className="w-number">{stats.total_users}</span><span className="w-label">Utilisateurs</span></div>
          <div className="welcome-stat"><span className="w-number">{stats.total_telechargements}</span><span className="w-label">Téléchargements</span></div>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-box blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
          </div>
          <div className="stat-info"><div className="stat-number">{stats.total_documents}</div><div className="stat-label">Documents publiés</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-box green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <div className="stat-info"><div className="stat-number">{stats.total_users}</div><div className="stat-label">Utilisateurs inscrits</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-box orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </div>
          <div className="stat-info"><div className="stat-number">{stats.total_telechargements}</div><div className="stat-label">Téléchargements</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-box red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          <div className="stat-info"><div className="stat-number">{stats.commentaires_en_attente}</div><div className="stat-label">Commentaires en attente</div></div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Téléchargements par matière</div>
              <div className="card-subtitle">Répartition des documents les plus téléchargés</div>
            </div>
          </div>
          <canvas ref={canvasRef} height="200"></canvas>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <div>
              <div className="card-title">Derniers inscrits</div>
              <div className="card-subtitle">Activité récente</div>
            </div>
            <Link href="/admin/utilisateurs" style={{ fontSize: '0.8rem', color: '#2563EB', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          {derniers_users.map((u, i) => (
            <div className="activity-item" key={u.id}>
              <div className="activity-avatar" style={{ background: AVATAR_COLORS[i % 5] }}>{u.nom_complet.charAt(0).toUpperCase()}</div>
              <div className="activity-info">
                <div className="activity-name">{u.nom_complet}</div>
                <div className="activity-action">{u.email}</div>
              </div>
              <div className="activity-time">{new Date(u.date_inscription).toISOString().substring(0, 10)}</div>
            </div>
          ))}
          {derniers_users.length === 0 && (
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Aucun utilisateur inscrit.</p>
          )}
        </div>
      </div>

      <div className="admin-table-card">
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Derniers documents ajoutés</div>
          <Link href="/admin/documents" style={{ fontSize: '0.8rem', color: '#2563EB', textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        <table>
          <thead>
            <tr><th>Titre</th><th>Cycle</th><th>Matière</th><th>Type</th><th>Téléch.</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.titre}</td>
                <td><span className="badge badge-blue">{doc.cycle}</span></td>
                <td>{doc.matiere}</td>
                <td><span className="badge badge-gray">{doc.type_document}</span></td>
                <td>{doc.nb_telechargements}</td>
                <td style={{ color: '#94A3B8' }}>{new Date(doc.date_upload).toISOString().substring(0, 10)}</td>
                <td><Link href={`/admin/documents/${doc.id}/editer`} style={{ color: '#2563EB', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600 }}>Éditer</Link></td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>Aucun document.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}