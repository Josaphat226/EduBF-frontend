'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import dynamic from 'next/dynamic'

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer'), {
  ssr: false,
  // Pendant que le code du lecteur PDF se télécharge, on affiche exactement
  // le même message que pendant la récupération de l'URL du document —
  // ça supprime le "trou" vide entre les deux étapes de chargement.
  loading: () => (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: '#1E293B', borderRadius: 14, marginBottom: '1.2rem' }}>
      Chargement de l'aperçu...
    </div>
  ),
})

function slugType(type) {
  return type.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')
}

export default function DocumentClient({ id, initialData, introuvableInitial }) {
  const { user } = useAuth()

  const [document] = useState(initialData?.document || null)
  const [commentaires, setCommentaires] = useState(initialData?.commentaires || [])
  const [similaires] = useState(initialData?.similaires || [])
  const [estFavori, setEstFavori] = useState(initialData?.estFavori || false)
  const [introuvable] = useState(introuvableInitial)

  const [noteChoisie, setNoteChoisie] = useState('')
  const [contenu, setContenu] = useState('')
  const [envoiCommentaire, setEnvoiCommentaire] = useState(false)
  const [messageCommentaire, setMessageCommentaire] = useState('')
  const [erreurCommentaire, setErreurCommentaire] = useState('')
  const [favoriEnCours, setFavoriEnCours] = useState(false)

  const [pdfUrl, setPdfUrl] = useState(null)
  const [chargementPdf, setChargementPdf] = useState(false)

  // Charge automatiquement l'aperçu du PDF dès l'arrivée sur la page,
  // si l'utilisateur est connecté.
  useEffect(() => {
    if (!user || !document) return

    let annule = false

    // On lance le téléchargement du code du lecteur PDF (react-pdf) EN MÊME
    // TEMPS que la récupération de l'URL du document, au lieu de l'un après
    // l'autre. Next.js met le résultat en cache : quand le composant
    // PDFViewer sera vraiment affiché plus bas, il n'aura souvent plus rien
    // à télécharger, ce qui accélère nettement l'affichage.
    import('@/components/pdf/PDFViewer')

    setChargementPdf(true)
    api.get(`/documents/${id}/lire`)
      .then(res => {
        if (!annule) setPdfUrl(res.data.url)
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setChargementPdf(false)
      })

    // Si le composant est démonté avant la fin de la requête (changement de
    // page rapide, etc.), on ignore le résultat au lieu de mettre à jour un
    // composant qui n'est plus affiché.
    return () => {
      annule = true
    }
  }, [user, document, id])


  if (introuvable || !document) {
    return (
      <div className="docs-empty-new" style={{ margin: '4rem auto', maxWidth: 480 }}>
        <div className="docs-empty-icon">📂</div>
        <h3>Document introuvable</h3>
        <p><Link href="/documents">Retourner à la liste des documents</Link>.</p>
      </div>
    )
  }

  async function toggleFavori() {
    if (favoriEnCours) return
    setFavoriEnCours(true)

    // Optimistic UI : on bascule l'affichage immediatement, avant la reponse serveur
    const etatPrecedent = estFavori
    setEstFavori(!etatPrecedent)

    try {
      const res = await api.post(`/documents/${id}/favori`)
      setEstFavori(res.data.action === 'added')
    } catch {
      // Echec reel : on annule le changement optimiste
      setEstFavori(etatPrecedent)
    } finally {
      setFavoriEnCours(false)
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault()
    setErreurCommentaire('')
    setEnvoiCommentaire(true)
    try {
      const res = await api.post(`/documents/${id}/commentaires`, {
        contenu,
        note: noteChoisie || null,
      })
      setMessageCommentaire(res.data.message)
      setNoteChoisie('')
      setContenu('')
    } catch (err) {
      setErreurCommentaire(err.message)
    } finally {
      setEnvoiCommentaire(false)
    }
  }

async function handleTelecharger(e) {
    e.preventDefault()
    try {
      const res = await api.get(`/documents/${id}/telecharger`)

      // Déclenche le téléchargement sans ouvrir de nouvel onglet ni quitter
      // la page : un lien invisible avec l'attribut "download", cliqué par
      // le code, puis aussitôt retiré. Le backend force déjà le
      // téléchargement (download: true côté Supabase), donc ça suffit.
      // Attention : on utilise "window.document" et pas juste "document",
      // parce que "document" tout seul, dans ce fichier, désigne l'état
      // React du document (titre, id...) et pas la page du navigateur.
      const lien = window.document.createElement('a')
      lien.href = res.data.url
      lien.download = ''
      window.document.body.appendChild(lien)
      lien.click()
      window.document.body.removeChild(lien)
    } catch (err) {
      console.error('Erreur téléchargement:', err.message)
    }
  }

  return (
    <div className="doc-page-wrapper">
      <div className="doc-hero">
        <div className="doc-blob-l"></div>
        <div className="doc-blob-r"></div>
        <div className="doc-hero-inner">
          <Link href="/documents" className="doc-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
            Retour aux documents
          </Link>
          <div className="doc-hero-type">{document.type_document}</div>
          <h1 className="doc-hero-title">{document.titre}</h1>
          <div className="doc-hero-tags">
            <span className="doc-htag">{document.cycle}</span>
            {document.serie_filiere && <span className="doc-htag">{document.serie_filiere}</span>}
            <span className="doc-htag">{document.matiere}</span>
            {document.annee_scolaire && <span className="doc-htag doc-htag-year">{document.annee_scolaire}</span>}
          </div>
        </div>
      </div>

      <div className="doc-tabs-bar">
        <span className="doc-tab active">Document</span>
      </div>

      <div className="doc-content">
        <div className="doc-main">

          {user ? (
            chargementPdf ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: '#1E293B', borderRadius: 14, marginBottom: '1.2rem' }}>
                Chargement de l'aperçu...
              </div>
            ) : pdfUrl ? (
              <div style={{ marginBottom: '1.2rem' }}>
                <PDFViewer url={pdfUrl} title={document.titre} embedded />
              </div>
            ) : (
              <div className="doc-preview-card">
                <div className="doc-preview-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                </div>
                <div className="doc-preview-info">
                  <div className="doc-preview-name">{document.titre}.pdf</div>
                  {document.description && <p className="doc-preview-desc">{document.description}</p>}
                </div>
              </div>
            )
          ) : (
            <div className="doc-preview-card">
              <div className="doc-preview-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
              </div>
              <div className="doc-preview-info">
                <div className="doc-preview-name">{document.titre}.pdf</div>
                {document.description && <p className="doc-preview-desc">{document.description}</p>}
              </div>
            </div>
          )}

          {user ? (
            <div className="doc-actions">
              <button className={`doc-btn-favori ${estFavori ? 'active' : ''}`} onClick={toggleFavori} disabled={favoriEnCours}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={estFavori ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span>{estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
              </button>
              <a href="#" className="doc-btn-dl" onClick={handleTelecharger}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Télécharger le PDF
              </a>
            </div>
          ) : (
            <div className="doc-login-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p>Connecte-toi pour lire ou télécharger ce document.</p>
              <div className="doc-login-btns">
                <Link href={`/connexion?next=/documents/${id}`} className="doc-btn-dl">Se connecter</Link>
                <Link href={`/inscription?next=/documents/${id}`} className="doc-btn-outline">S'inscrire gratuitement</Link>
              </div>
            </div>
          )}

          {similaires.length > 0 && (
            <div className="doc-similaires-card">
              <div className="doc-similaires-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                Documents similaires
              </div>
              <div className="doc-similaires-grid">
                {similaires.map(s => (
                  <Link href={`/documents/${s.id}`} className="doc-similaire-item" key={s.id}>
                    <span className={`doc-sim-type doc-type-${slugType(s.type_document)}`}>{s.type_document}</span>
                    <div className="doc-sim-titre">{s.titre}</div>
                    <div className="doc-sim-meta">
                      <span>{s.cycle}</span>
                      {s.serie_filiere && <span>{s.serie_filiere}</span>}
                      <span>{s.matiere}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="doc-comments-card">
            <div className="doc-comments-title">
              Commentaires
              <span className="doc-comments-count">{commentaires.length}</span>
            </div>

            {commentaires.length === 0 ? (
              <p className="doc-no-comments">Aucun commentaire pour le moment. Sois le premier !</p>
            ) : (
              <div className="doc-comments-list">
                {commentaires.map(c => (
                  <div className="doc-comment-item" key={c.id}>
                    <div className="doc-comment-avatar">{c.nom_complet.charAt(0).toUpperCase()}</div>
                    <div className="doc-comment-body">
                      <div className="doc-comment-header">
                        <strong>{c.nom_complet}</strong>
                        <span className="doc-comment-date">{new Date(c.date_publication).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {c.note && (
                        <div className="doc-comment-stars">
                          {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} className={i <= c.note ? 'star-on' : 'star-off'}>★</span>
                          ))}
                        </div>
                      )}
                      <p className="doc-comment-text">{c.contenu}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user ? (
              <div className="doc-comment-form">
                <div className="doc-comment-form-title">Laisser un commentaire</div>
                {messageCommentaire && <div className="alert alert-success" role="alert" style={{ marginBottom: '.8rem' }}>{messageCommentaire}</div>}
{erreurCommentaire && <div className="alert alert-error" role="alert" style={{ marginBottom: '.8rem' }}>{erreurCommentaire}</div>}
                <form onSubmit={handleCommentSubmit}>
                  <div className="doc-form-group">
                    <label>Note (optionnel)</label>
                    <select
                      className="doc-form-select"
                      value={noteChoisie}
                      onChange={e => setNoteChoisie(e.target.value)}
                    >
                      <option value="">— Pas de note —</option>
                      <option value="5">★★★★★  Excellent</option>
                      <option value="4">★★★★☆  Bien</option>
                      <option value="3">★★★☆☆  Moyen</option>
                      <option value="2">★★☆☆☆  Passable</option>
                      <option value="1">★☆☆☆☆  Mauvais</option>
                    </select>
                  </div>
                  <div className="doc-form-group">
                    <label>Commentaire *</label>
                    <textarea
                      rows="3"
                      placeholder="Ton avis sur ce document..."
                      required
                      minLength={5}
                      maxLength={500}
                      className="doc-form-textarea"
                      value={contenu}
                      onChange={e => setContenu(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="doc-btn-dl" disabled={envoiCommentaire} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {envoiCommentaire ? 'Envoi...' : 'Publier'}
                  </button>
                </form>
              </div>
            ) : (
              <p className="doc-login-comment">
                <Link href={`/connexion?next=/documents/${id}`}>Connecte-toi</Link> pour laisser un commentaire.
              </p>
            )}
          </div>
        </div>

        <aside className="doc-aside">
          <div className="doc-info-card">
            <div className="doc-info-title">Informations</div>
            <div className="doc-info-list">
              <div className="doc-info-item">
                <span className="doc-info-label">Type</span>
                <span className="doc-info-val">{document.type_document}</span>
              </div>
              <div className="doc-info-item">
                <span className="doc-info-label">Cycle</span>
                <span className="doc-info-val">{document.cycle}</span>
              </div>
              {document.serie_filiere && (
                <div className="doc-info-item">
                  <span className="doc-info-label">Filière</span>
                  <span className="doc-info-val">{document.serie_filiere}</span>
                </div>
              )}
              <div className="doc-info-item">
                <span className="doc-info-label">Matière</span>
                <span className="doc-info-val">{document.matiere}</span>
              </div>
              {document.annee_scolaire && (
                <div className="doc-info-item">
                  <span className="doc-info-label">Année</span>
                  <span className="doc-info-val">{document.annee_scolaire}</span>
                </div>
              )}
              <div className="doc-info-item">
                <span className="doc-info-label">Publié le</span>
                <span className="doc-info-val">{new Date(document.date_upload).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="doc-info-item">
                <span className="doc-info-label">Téléchargements</span>
                <span className="doc-info-val doc-info-dl">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  {document.nb_telechargements}
                </span>
              </div>
            </div>
          </div>

          <div className="doc-aside-actions">
            {user ? (
              <a href="#" className="doc-btn-dl" style={{ display: 'flex', justifyContent: 'center' }} onClick={handleTelecharger}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Télécharger le PDF
              </a>
            ) : (
                  <Link href={`/connexion?next=/documents/${id}`} className="doc-btn-dl" style={{ display: 'flex', justifyContent: 'center' }}>
                Se connecter pour accéder
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
