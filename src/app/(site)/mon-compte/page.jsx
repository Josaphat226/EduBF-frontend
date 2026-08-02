'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

const DATA_PROFIL = {
  college: {
    classes: ['6ème', '5ème', '4ème', '3ème (BEPC)'],
    filieres: [],
  },
  lycee: {
    classes: ['Seconde', 'Première', 'Terminale'],
    filieres: ['BAC A', 'BAC B', 'BAC C', 'BAC D', 'BAC E', 'BAC F1', 'BAC F2', 'BAC F3', 'BAC F4', 'BAC G1', 'BAC G2', 'BAC H'],
  },
  superieur: {
    classes: ['1ère année', '2ème année', '3ème année', 'Licence', 'Master'],
    filieres: [
      'BTS Informatique de Gestion', 'BTS Comptabilité et Gestion',
      'BTS Électrotechnique', 'BTS Génie Civil', 'BTS Commerce International',
      'BTS Secrétariat de Direction', 'BTS Maintenance Industrielle', 'BTS Banque et Finance',
      'BEP Électrotechnique', 'BEP Génie Civil', 'BEP Comptabilité', 'BEP Informatique',
      'CAP Maçonnerie', 'CAP Menuiserie', 'CAP Électricité', 'CAP Commerce',
    ],
  },
}

function niveauFromClasse(classe) {
  if (DATA_PROFIL.college.classes.includes(classe)) return 'college'
  if (DATA_PROFIL.lycee.classes.includes(classe)) return 'lycee'
  if (DATA_PROFIL.superieur.classes.includes(classe)) return 'superieur'
  return ''
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

export default function Profile() {
  const { user, loading: authLoading, updateUser } = useAuth()
  const router = useRouter()

  // Garde de route : redirige proprement si non connecté, au lieu d'afficher
  // un message statique ou de rester bloqué comme dans l'ancien site.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion')
    }
  }, [authLoading, user, router])

  const [profil, setProfil] = useState(null)
  const [stats, setStats] = useState({ total_commentaires: 0, total_notes: 0, total_favoris: 0 })
  const [commentaires, setCommentaires] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)

  useEffect(() => {
    if (!user) return
    api.get('/auth/profile/full')
      .then(res => {
        setProfil(res.data.user)
        setStats(res.data.stats)
        setCommentaires(res.data.commentaires)
      })
      .catch(err => setErreur(err.message))
      .finally(() => setChargement(false))
  }, [user])

  const [tab, setTab] = useState('profil')
  const [editOpen, setEditOpen] = useState(false)
  const [niveau, setNiveau] = useState('')
  const [form, setForm] = useState({ nom_complet: '', classe: '', filiere: '' })

  useEffect(() => {
    if (!profil) return
    setNiveau(niveauFromClasse(profil.classe))
    setForm({
      nom_complet: profil.nom_complet || '',
      classe: profil.classe || '',
      filiere: profil.filiere || '',
    })
  }, [profil])

  // Pendant la vérification de l'authentification ou la redirection en cours
  if (authLoading || !user) {
    return <Spinner texte="Vérification..." />
  }

  if (chargement) {
    return <Spinner texte="Chargement de ton profil..." />
  }
  if (erreur) return <div className="alert alert-error" role="alert" style={{ maxWidth: 600, margin: '2rem auto' }}>{erreur}</div>

  const profilAffiche = profil || user
  const options = niveau ? DATA_PROFIL[niveau] : { classes: [], filieres: [] }

  function handleNiveauChange(value) {
    setNiveau(value)
    setForm(prev => ({ ...prev, classe: '', filiere: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnregistrement(true)
    setErreur('')
    try {
      const res = await api.put('/auth/profile', form)
      updateUser(res.data.user)
      setProfil(prev => ({ ...prev, ...res.data.user }))
      setEditOpen(false)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <>
      <div className="contact-hero" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg,#FF6B35,#F59E0B)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.8rem', fontWeight: 900, flexShrink: 0, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
              {profilAffiche.nom_complet.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>Mon compte</h1>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.95rem', margin: '.3rem 0 0', fontWeight: 600 }}>
                {profilAffiche.nom_complet}
              </p>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.85rem', margin: '.15rem 0 0' }}>
                {profilAffiche.classe || 'Classe non renseignée'}
                {profilAffiche.filiere && <> · {profilAffiche.filiere}</>}
              </p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '40px', padding: '0.6rem 1.4rem', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              ✏️ Modifier mon profil
            </button>
          </div>
        </div>
      </div>

      <div className="docs-tabs-bar">
        <a className={`docs-tab ${tab === 'profil' ? 'active' : ''}`} href="#" onClick={e => { e.preventDefault(); setTab('profil') }}>📋 Mon profil</a>
        <a className={`docs-tab ${tab === 'commentaires' ? 'active' : ''}`} href="#" onClick={e => { e.preventDefault(); setTab('commentaires') }}>💬 Mes commentaires</a>
      </div>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {tab === 'profil' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B' }}>{stats.total_commentaires}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Commentaires postés</div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B' }}>{stats.total_notes}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Notes attribuées</div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B' }}>{stats.total_favoris}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Documents favoris</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Informations du compte</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Nom complet</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profilAffiche.nom_complet}</div>
                </div>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Adresse email</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{profilAffiche.email}</div>
                </div>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Classe / Niveau</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profilAffiche.classe || 'Non renseigné'}</div>
                </div>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Filière / Série</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profilAffiche.filiere || 'Non renseignée'}</div>
                </div>
                <div style={{ padding: '1.2rem 1.5rem', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Statut du compte</div>
                  <div><span style={{ display: 'inline-block', background: '#10B98120', color: '#10B981', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>✅ Actif</span></div>
                </div>
                <div style={{ padding: '1.2rem 1.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Membre depuis</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {profilAffiche.date_inscription
                      ? new Date(profilAffiche.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'commentaires' && (
          <div>
            {commentaires.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Aucun commentaire pour le moment</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Les commentaires que tu laisseras sur les documents apparaîtront ici.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {commentaires.map(c => (
                  <div key={c.id} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '1.2rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <Link href={`/documents/${c.document_id}`} style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F59E0B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        📄 {c.titre_document}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {c.visible === 1 ? (
                          <span style={{ background: '#10B98120', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>✅ Publié</span>
                        ) : (
                          <span style={{ background: '#F59E0B20', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>⏳ En attente</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.date_publication).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    {c.note && (
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <span key={i} style={{ color: i <= c.note ? '#F59E0B' : '#E2E8F0' }}>★</span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{c.contenu}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editOpen && (
        <div style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <div onClick={() => setEditOpen(false)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}></div>
          <div style={{ position: 'relative', background: 'var(--bg-card)', width: '90%', maxWidth: '520px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', padding: '1.3rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>✏️ Modifier mon profil</h3>
              <button onClick={() => setEditOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.8rem' }}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>NOM COMPLET</label>
                <input
                  type="text"
                  value={form.nom_complet}
                  onChange={e => setForm(prev => ({ ...prev, nom_complet: e.target.value }))}
                  style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>NIVEAU SCOLAIRE</label>
                <select
                  value={niveau}
                  onChange={e => handleNiveauChange(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="">-- Choisir --</option>
                  <option value="college">Collège</option>
                  <option value="lycee">Lycée</option>
                  <option value="superieur">Supérieur</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>CLASSE</label>
                <select
                  value={form.classe}
                  onChange={e => setForm(prev => ({ ...prev, classe: e.target.value }))}
                  style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="">-- Choisir --</option>
                  {options.classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>FILIÈRE / SÉRIE</label>
                <select
                  value={form.filiere}
                  onChange={e => setForm(prev => ({ ...prev, filiere: e.target.value }))}
                  style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                >
                  <option value="">-- Choisir --</option>
                  {options.filieres.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <button type="submit" disabled={enregistrement} style={{ width: '100%', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.8rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {enregistrement ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}