'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function slugType(type) {
  return type.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')
}

function Spinner({ texte }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border, #E2E8F0)', borderTopColor: 'var(--accent)',
        animation: 'edubf-spin 0.8s linear infinite',
      }} />
      <style>{'@keyframes edubf-spin { to { transform: rotate(360deg) } }'}</style>
      <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>{texte}</p>
    </div>
  )
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Garde de route : l'ancien site n'en avait aucune ici (un visiteur non
  // connecté restait bloqué sur un chargement infini ou une erreur brute).
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion')
    }
  }, [authLoading, user, router])

  const [favoris, setFavoris] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!user) return
    api.get('/favoris')
      .then(res => setFavoris(res.data.favoris))
      .catch(err => setErreur(err.message))
  }, [user])

  if (authLoading || !user) {
    return <Spinner texte="Vérification..." />
  }

  if (erreur) return <div className="alert alert-error" role="alert" style={{ maxWidth: 600, margin: '2rem auto' }}>{erreur}</div>

  if (!favoris) {
    return <Spinner texte="Chargement de tes favoris..." />
  }

  return (
    <>
      <div className="contact-hero">
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
        <h1 className="docs-hero-title">Mes favoris</h1>
      </div>

      <div className="docs-tabs-bar">
        <span className="docs-tab active">Mes documents favoris</span>
      </div>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {favoris.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
            <h3 style={{ color: '#0F172A', marginBottom: '.5rem', fontSize: '1.1rem' }}>Aucun favori pour l'instant</h3>
            <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '.9rem' }}>Ajoute des documents à tes favoris pour les retrouver facilement.</p>
            <Link href="/documents" className="doc-btn-dl" style={{ textDecoration: 'none' }}>Parcourir les documents</Link>
          </div>
        ) : (
          <>
            <p style={{ color: '#94A3B8', fontSize: '.85rem', marginBottom: '1.2rem' }}>
              {favoris.length} document{favoris.length > 1 ? 's' : ''} en favori
            </p>
            <div className="docs-grid-new">
              {favoris.map(doc => (
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
                    <span className="doc-date-new">{new Date(doc.date_upload).toISOString().substring(0, 10)}</span>
                    <span className="doc-arrow-new">Voir →</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}