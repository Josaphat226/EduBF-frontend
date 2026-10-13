'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const VIDE = { id: null, titre: '', sujet: '', message: '', bouton_texte: '', bouton_lien: '', cible: 'utilisateurs' }

const LIBELLES_CIBLE = {
  utilisateurs: 'Utilisateurs inscrits',
  newsletter: 'Abonnés newsletter',
  tous: 'Utilisateurs + newsletter',
}

const STATUTS = {
  brouillon: { texte: 'Brouillon', fond: '#F1F5F9', couleur: '#475569' },
  en_cours: { texte: 'En cours', fond: '#FFF7ED', couleur: '#C2410C' },
  en_pause: { texte: 'En pause', fond: '#FEF9C3', couleur: '#A16207' },
  terminee: { texte: 'Terminée', fond: '#F0FDF4', couleur: '#15803D' },
  annulee: { texte: 'Annulée', fond: '#FEF2F2', couleur: '#B91C1C' },
}

const champ = {
  width: '100%', padding: '.6rem .8rem', border: '1px solid #CBD5E1', borderRadius: 8,
  fontFamily: 'inherit', fontSize: '.9rem', boxSizing: 'border-box', background: '#fff', color: '#0F172A',
}
const etiquette = { display: 'block', fontWeight: 700, fontSize: '.82rem', margin: '0 0 .35rem', color: '#334155' }
const petit = { padding: '.3rem .65rem', fontSize: '.78rem' }

function messageErreur(err) {
  return err?.response?.data?.error || 'Une erreur est survenue.'
}

export default function AdminCampagnes() {
  const [data, setData] = useState(null)
  const [formulaire, setFormulaire] = useState(null)
  const [enCoursEnvoi, setEnCoursEnvoi] = useState(false)
  const [info, setInfo] = useState('')
  const [erreur, setErreur] = useState('')
  const [apercu, setApercu] = useState(null)

  const charger = useCallback(() => {
    api.get('/admin/campagnes').then(res => setData(res.data)).catch(() => {})
  }, [])

  useEffect(() => { charger() }, [charger])

  const aDesEnvoisEnCours = !!data?.campagnes.some(c => c.statut === 'en_cours')
  useEffect(() => {
    if (!aDesEnvoisEnCours) return
    const t = setInterval(charger, 10000)
    return () => clearInterval(t)
  }, [aDesEnvoisEnCours, charger])

  function notifier(message, estErreur = false) {
    setInfo(estErreur ? '' : message)
    setErreur(estErreur ? message : '')
  }

  function modifier(c) {
    setFormulaire({
      id: c.id, titre: c.titre, sujet: c.sujet, message: c.message,
      bouton_texte: c.bouton_texte || '', bouton_lien: c.bouton_lien || '', cible: c.cible,
    })
    notifier('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enregistrer(e) {
    e.preventDefault()
    setEnCoursEnvoi(true)
    try {
      const { id, ...corps } = formulaire
      if (id) await api.put(`/admin/campagnes/${id}`, corps)
      else await api.post('/admin/campagnes', corps)
      setFormulaire(null)
      notifier('Brouillon enregistré.')
      charger()
    } catch (err) {
      notifier(messageErreur(err), true)
    } finally {
      setEnCoursEnvoi(false)
    }
  }

  async function voirApercu(c) {
    try {
      const res = await api.get(`/admin/campagnes/${c.id}/apercu`)
      setApercu(res.data.html)
    } catch (err) {
      notifier(messageErreur(err), true)
    }
  }

  async function tester(c) {
    const adresse = prompt('Envoyer un test à quelle adresse e-mail ?')
    if (!adresse) return
    try {
      await api.post(`/admin/campagnes/${c.id}/test`, { email: adresse })
      notifier(`E-mail de test envoyé à ${adresse}.`)
    } catch (err) {
      notifier(messageErreur(err), true)
    }
  }

  async function lancer(c) {
    try {
      const res = await api.get('/admin/campagnes/destinataires', { params: { cible: c.cible } })
      const total = res.data.total
      if (total === 0) return notifier('Aucun destinataire pour cette campagne.', true)
      const limite = data.quota.limite
      const jours = Math.ceil(total / limite)
      const duree = jours > 1 ? `L'envoi s'étalera sur environ ${jours} jours (limite de ${limite} e-mails par jour) et continuera automatiquement.` : 'L\'envoi démarre tout de suite.'
      if (!confirm(`Envoyer « ${c.sujet} » à ${total} personne${total > 1 ? 's' : ''} ?\n\n${duree}\n\nCette action ne peut pas être annulée pour les e-mails déjà partis.`)) return
      await api.post(`/admin/campagnes/${c.id}/lancer`)
      notifier('Campagne lancée.')
      charger()
    } catch (err) {
      notifier(messageErreur(err), true)
    }
  }

  async function action(c, chemin, confirmation, methode = 'post') {
    if (confirmation && !confirm(confirmation)) return
    try {
      if (methode === 'delete') await api.delete(`/admin/campagnes/${c.id}`)
      else await api.post(`/admin/campagnes/${c.id}/${chemin}`)
      notifier('')
      charger()
    } catch (err) {
      notifier(messageErreur(err), true)
    }
  }

  if (!data) return null
  const { campagnes, quota } = data

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Campagnes e-mail</h1>
          <p className="admin-page-sub">
            Envoyés aujourd'hui : {quota.utilises} / {quota.limite}. Les envois continuent automatiquement chaque jour jusqu'à la fin.
          </p>
        </div>
        {!formulaire && (
          <button className="btn-admin btn-admin-primary" onClick={() => { setFormulaire({ ...VIDE }); notifier('') }}>
            + Nouvelle campagne
          </button>
        )}
      </div>

      {info && <div style={{ background: '#F0FDF4', color: '#15803D', padding: '.7rem 1rem', borderRadius: 8, marginBottom: '1rem', fontWeight: 600 }}>{info}</div>}
      {erreur && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '.7rem 1rem', borderRadius: 8, marginBottom: '1rem', fontWeight: 600 }}>{erreur}</div>}

      {formulaire && (
        <form onSubmit={enregistrer} className="admin-table-card" style={{ padding: '1.4rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>{formulaire.id ? 'Modifier le brouillon' : 'Nouvelle campagne'}</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={etiquette}>Titre (visible seulement par toi)</label>
            <input style={champ} maxLength={150} required value={formulaire.titre}
              onChange={e => setFormulaire({ ...formulaire, titre: e.target.value })} placeholder="Ex : Annonce nouveauté concours" />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={etiquette}>Sujet de l'e-mail</label>
            <input style={champ} maxLength={200} required value={formulaire.sujet}
              onChange={e => setFormulaire({ ...formulaire, sujet: e.target.value })} placeholder="Ex : Les concours arrivent sur EduBF" />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={etiquette}>Message (laisse une ligne vide entre deux paragraphes)</label>
            <textarea style={{ ...champ, minHeight: 200, resize: 'vertical' }} maxLength={5000} required value={formulaire.message}
              onChange={e => setFormulaire({ ...formulaire, message: e.target.value })} />
            <div style={{ fontSize: '.75rem', color: '#94A3B8', marginTop: '.25rem' }}>{formulaire.message.length} / 5000</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={etiquette}>Texte du bouton (facultatif)</label>
              <input style={champ} maxLength={60} value={formulaire.bouton_texte}
                onChange={e => setFormulaire({ ...formulaire, bouton_texte: e.target.value })} placeholder="Ex : Découvrir" />
            </div>
            <div>
              <label style={etiquette}>Lien du bouton</label>
              <input style={champ} maxLength={500} value={formulaire.bouton_lien}
                onChange={e => setFormulaire({ ...formulaire, bouton_lien: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={etiquette}>Destinataires</label>
            <select style={champ} value={formulaire.cible} onChange={e => setFormulaire({ ...formulaire, cible: e.target.value })}>
              {Object.entries(LIBELLES_CIBLE).map(([valeur, libelle]) => <option key={valeur} value={valeur}>{libelle}</option>)}
            </select>
            <div style={{ fontSize: '.75rem', color: '#94A3B8', marginTop: '.25rem' }}>Les personnes désabonnées sont retirées automatiquement. Le nombre exact s'affiche au moment du lancement.</div>
          </div>

          <div style={{ display: 'flex', gap: '.6rem' }}>
            <button type="submit" className="btn-admin btn-admin-primary" disabled={enCoursEnvoi}>
              {enCoursEnvoi ? 'Enregistrement...' : 'Enregistrer le brouillon'}
            </button>
            <button type="button" className="btn-admin btn-admin-ghost" onClick={() => setFormulaire(null)}>Annuler</button>
          </div>
        </form>
      )}

      <div className="admin-table-card">
        <table>
          <thead>
            <tr><th>Campagne</th><th>Destinataires</th><th>Statut</th><th>Progression</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {campagnes.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>Aucune campagne pour le moment.</td></tr>
            )}
            {campagnes.map(c => {
              const s = STATUTS[c.statut] || STATUTS.brouillon
              const total = c.total_destinataires || 0
              const pct = total ? Math.min(100, Math.round((c.nb_envoyes / total) * 100)) : 0
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '.88rem' }}>{c.titre}</div>
                    <div style={{ fontSize: '.75rem', color: '#94A3B8' }}>{c.sujet}</div>
                    {c.derniere_erreur && <div style={{ fontSize: '.73rem', color: '#B91C1C', marginTop: '.2rem' }}>Dernière erreur : {c.derniere_erreur}</div>}
                  </td>
                  <td style={{ fontSize: '.82rem', color: '#475569' }}>{LIBELLES_CIBLE[c.cible]}</td>
                  <td><span style={{ background: s.fond, color: s.couleur, padding: '.25rem .7rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>{s.texte}</span></td>
                  <td style={{ minWidth: 150 }}>
                    {c.statut === 'brouillon' ? <span style={{ color: '#94A3B8' }}>—</span> : (
                      <>
                        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#FF6B35,#F59E0B)' }} />
                        </div>
                        <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.25rem' }}>{c.nb_envoyes} / {total} ({pct} %)</div>
                      </>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                      <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => voirApercu(c)}>Aperçu</button>
                      <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => tester(c)}>Test</button>
                      {c.statut === 'brouillon' && (
                        <>
                          <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => modifier(c)}>Modifier</button>
                          <button className="btn-admin btn-admin-primary" style={petit} onClick={() => lancer(c)}>Lancer</button>
                          <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => action(c, null, 'Supprimer ce brouillon ?', 'delete')}>Supprimer</button>
                        </>
                      )}
                      {c.statut === 'en_cours' && (
                        <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => action(c, 'pause')}>Pause</button>
                      )}
                      {c.statut === 'en_pause' && (
                        <button className="btn-admin btn-admin-primary" style={petit} onClick={() => action(c, 'reprendre')}>Reprendre</button>
                      )}
                      {(c.statut === 'en_cours' || c.statut === 'en_pause') && (
                        <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => action(c, 'annuler', 'Annuler cette campagne ? Les e-mails déjà envoyés ne peuvent pas être rappelés.')}>Annuler</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {apercu && (
        <div onClick={() => setApercu(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 640, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.8rem 1rem', borderBottom: '1px solid #E2E8F0' }}>
              <strong>Aperçu de l'e-mail</strong>
              <button className="btn-admin btn-admin-ghost" style={petit} onClick={() => setApercu(null)}>Fermer</button>
            </div>
            <iframe title="Aperçu" sandbox="" srcDoc={apercu} style={{ width: '100%', height: '70vh', border: 0 }} />
          </div>
        </div>
      )}
    </>
  )
}