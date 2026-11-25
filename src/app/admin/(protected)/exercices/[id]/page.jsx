'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import FormulaireInformations from '@/components/admin/contenus/FormulaireInformations'
import EditeurSujet from '@/components/admin/contenus/EditeurSujet'
import { ContexteMedias } from '@/components/admin/contenus/contexte'
import SujetLecture from '@/components/contenus/SujetLecture'
import { formulaireDepuis, etatContenu, libelleType } from '@/components/admin/contenus/informations'
import { synchroniserBareme } from '@/components/contenus/editeur/structure'
import '@/styles/contenus.css'
import '@/styles/editeur.css'

const LIBELLES_VERSION = { brouillon: 'Brouillon', relue: 'Relue', publiee: 'Publiée', archivee: 'Archivée' }
const dateFr = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '')

// Ajoute à chaque figure son adresse complète, pour l'aperçu
function avecUrls(x, base) {
  if (Array.isArray(x)) return x.map((v) => avecUrls(v, base))
  if (x && typeof x === 'object') {
    const o = {}
    for (const [k, v] of Object.entries(x)) o[k] = avecUrls(v, base)
    if (o.type === 'figure' && o.attrs && o.attrs.src) o.attrs = { ...o.attrs, url: base + o.attrs.src }
    return o
  }
  return x
}

function Problemes({ erreurs = [], avertissements = [] }) {
  if (!erreurs.length && !avertissements.length) return null
  return (
    <>
      {erreurs.length > 0 && (
        <div className="ctn-alerte ctn-alerte-erreur"><strong>À corriger ({erreurs.length}) :</strong>
          <ul className="ed-liste">{erreurs.map((e, i) => <li key={i}>{e.libelle ? `${e.libelle} — ` : ''}{e.message}</li>)}</ul></div>
      )}
      {avertissements.length > 0 && (
        <div className="ctn-alerte ctn-alerte-attention"><strong>À vérifier ({avertissements.length}) :</strong>
          <ul className="ed-liste">{avertissements.map((e, i) => <li key={i}>{e.libelle ? `${e.libelle} — ` : ''}{e.message}</li>)}</ul></div>
      )}
    </>
  )
}

export default function FicheContenu() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('contenu')
  const [doc, setDoc] = useState(null)
  const [base, setBase] = useState('')
  const [etat, setEtat] = useState('enregistre') // enregistre | modifie | envoi | erreur
  const [verification, setVerification] = useState(null) // renvoyée à chaque enregistrement
  const [verifPub, setVerifPub] = useState(null) // « Vérifier » (règles de publication)
  const [probleme, setProbleme] = useState(null)
  const [info, setInfo] = useState('')
  const dernier = useRef(null)
  const envoye = useRef(null)
  const promesse = useRef(null)
  const minuteur = useRef(null)

  const charger = useCallback(async (reinit = true) => {
    try {
      const r = await api.get(`/admin/contenus/${id}`)
      setData(r.data)
      if (reinit) {
        const d = r.data.version_travail ? r.data.version_travail.contenu_json : null
        dernier.current = d; envoye.current = d
        setDoc(d); setEtat('enregistre')
      }
      setErreur('')
    } catch (e) { setErreur(e.message) }
  }, [id])

  useEffect(() => {
    charger()
    api.get('/admin/contenus/referentiels').then((r) => setBase(r.data.medias_url_base || '')).catch(() => {})
  }, [charger])

  // Enregistre le brouillon ; attend la fin d'un enregistrement en cours ; renvoie true si tout est enregistré
  const sauver = useCallback(async () => {
    clearTimeout(minuteur.current)
    while (dernier.current !== envoye.current) {
      if (promesse.current) { try { await promesse.current } catch (_) {} continue }
      const aEnvoyer = dernier.current
      setEtat('envoi')
      promesse.current = api.put(`/admin/contenus/${id}/brouillon`, { contenu_json: aEnvoyer })
        .then((r) => { envoye.current = aEnvoyer; setVerification(r.data.verification) })
        .finally(() => { promesse.current = null })
      try { await promesse.current } catch (e) { setEtat('erreur'); setErreur(e.message); return false }
    }
    setErreur('')
    setEtat(dernier.current === envoye.current ? 'enregistre' : 'modifie')
    return true
  }, [id])

  // Toute modification passe par ici : on recalcule le total des points, puis on programme l'enregistrement
  const appliquer = useCallback((f) => {
    setDoc((d) => { const s = synchroniserBareme(f(d)); dernier.current = s; return s })
  }, [])

  useEffect(() => {
    if (!doc || doc === envoye.current) return
    setEtat((e) => (e === 'envoi' ? e : 'modifie'))
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(sauver, 1500)
  }, [doc, sauver])

  useEffect(() => () => { clearTimeout(minuteur.current); if (dernier.current !== envoye.current) sauver() }, [sauver])
  useEffect(() => {
    const avant = (e) => { if (etat !== 'enregistre') { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', avant)
    return () => window.removeEventListener('beforeunload', avant)
  }, [etat])

  const apercu = useMemo(() => (doc ? avecUrls(doc, base) : null), [doc, base])

  async function agir(action, message) {
    setProbleme(null); setInfo('')
    if (!(await sauver())) return
    try {
      await api.post(`/admin/contenus/${id}/${action}`)
      setInfo(message); setVerifPub(null)
      await charger(true)
    } catch (e) { setProbleme({ texte: e.message, erreurs: (e.donnees && e.donnees.erreurs) || [] }) }
  }

  async function verifier() {
    setProbleme(null); setInfo('')
    if (!(await sauver())) return
    try { const r = await api.post(`/admin/contenus/${id}/valider`); setVerifPub(r.data) }
    catch (e) { setProbleme({ texte: e.message, erreurs: [] }) }
  }

  async function nouvelleVersion() {
    const note = prompt('Que modifiez-vous dans cette nouvelle version ? (obligatoire)')
    if (!note) return
    try { await api.post(`/admin/contenus/${id}/versions`, { note_modification: note }); await charger(true) }
    catch (e) { setErreur(e.message) }
  }

  async function enregistrerInfos(charge) {
    await api.put(`/admin/contenus/${id}`, charge)
    charger(false)
  }

  async function supprimer() {
    if (!confirm('Supprimer définitivement ce contenu et ses brouillons ?')) return
    try { await api.delete(`/admin/contenus/${id}`); router.push('/admin/exercices') }
    catch (e) { setErreur(e.message) }
  }

  if (!data) {
    return erreur ? <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreur}</div> : <p className="ctn-chargement">Chargement…</p>
  }

  const c = data.contenu
  const travail = data.version_travail
  const publiee = data.versions.find((v) => v.statut === 'publiee')
  const etatC = etatContenu({ actif: c.actif, version_publiee: publiee && publiee.numero, version_travail: travail && travail.numero, statut_travail: travail && travail.statut })
  const jamaisPublie = !data.versions.some((v) => v.statut === 'publiee' || v.statut === 'archivee')
  const LIB_ETAT = { enregistre: '✓ Enregistré', modifie: 'Modifications en attente…', envoi: 'Enregistrement…', erreur: '⚠ Échec de l’enregistrement' }
  const onglets = [['contenu', 'Contenu'], ['informations', 'Informations'], ['apercu', 'Aperçu'], ['publication', 'Publication']]

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{c.titre}</h1>
          <p className="admin-page-sub">
            {libelleType(c.type)} · EDU-{c.code} · <span className={`ctn-etat ctn-etat-${etatC.cle}`}>{etatC.libelle}</span>
            {doc && <span className={`ed-etat ed-etat-${etat}`}> · {LIB_ETAT[etat]}</span>}
          </p>
        </div>
        <div className="ctn-actions-ligne">
          {c.actif && publiee && <a href={`/s/${c.code}`} target="_blank" rel="noreferrer" className="btn-admin btn-admin-ghost">Voir en ligne</a>}
          <Link href="/admin/exercices" className="btn-admin btn-admin-ghost">← Liste</Link>
        </div>
      </div>

      {erreur && <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreur} {etat === 'erreur' && <button type="button" className="ctn-lien-action" onClick={sauver}>Réessayer</button>}</div>}
      {info && <div className="ctn-alerte ctn-alerte-ok" role="status">{info}</div>}

      <div className="ed-onglets" role="tablist">
        {onglets.map(([cle, nom]) => (
          <button type="button" role="tab" key={cle} aria-selected={onglet === cle} className={onglet === cle ? 'ed-onglet ed-onglet-actif' : 'ed-onglet'} onClick={() => setOnglet(cle)}>{nom}</button>
        ))}
      </div>

      {onglet === 'contenu' && (
        doc ? (
          <ContexteMedias.Provider value={base}>
            {verification && <Problemes erreurs={verification.erreurs} avertissements={[]} />}
            <EditeurSujet doc={doc} appliquer={appliquer} />
          </ContexteMedias.Provider>
        ) : (
          <div className="ctn-alerte ctn-alerte-info">
            Ce contenu est publié et aucune modification n’est en cours.{' '}
            <button type="button" className="btn-admin btn-admin-primary" onClick={nouvelleVersion}>Créer une nouvelle version pour le modifier</button>
          </div>
        )
      )}

      {onglet === 'informations' && (
        <div className="adoc-card"><FormulaireInformations initial={formulaireDepuis(data)} libelleBouton="Enregistrer les informations" onSubmit={enregistrerInfos} /></div>
      )}

      {onglet === 'apercu' && (
        apercu ? <div className="sujet-page" style={{ padding: 0 }}><SujetLecture code={null} document={apercu} /></div>
          : <p className="ctn-chargement">Aucun contenu en cours de rédaction à afficher.</p>
      )}

      {onglet === 'publication' && (
        <div className="adoc-card">
          <h3 className="adoc-section-title">Publication</h3>
          {probleme && <div className="ctn-alerte ctn-alerte-erreur" role="alert">{probleme.texte}<Problemes erreurs={probleme.erreurs} /></div>}
          {verifPub && (verifPub.ok && !verifPub.avertissements.length
            ? <div className="ctn-alerte ctn-alerte-ok">Tout est en ordre : total {verifPub.resume.total_points} points, {verifPub.resume.nb_questions} questions.</div>
            : <Problemes erreurs={verifPub.erreurs} avertissements={verifPub.avertissements} />)}
          <div className="ctn-actions-ligne" style={{ margin: '1rem 0' }}>
            {travail && <button type="button" className="btn-admin btn-admin-ghost" onClick={verifier}>Vérifier</button>}
            {travail && travail.statut === 'brouillon' && <button type="button" className="btn-admin btn-admin-primary" onClick={() => agir('relire', 'Version marquée comme relue.')}>Marquer comme relu</button>}
            {travail && travail.statut === 'relue' && <button type="button" className="btn-admin btn-admin-primary" onClick={() => agir('publier', 'Contenu publié.')}>Publier</button>}
            {!travail && <button type="button" className="btn-admin btn-admin-primary" onClick={nouvelleVersion}>Nouvelle version</button>}
          </div>
          <p className="ctn-aide">Étapes : rédiger, vérifier, marquer comme relu, puis publier. Modifier un texte déjà relu le repasse en brouillon.</p>
          <div className="admin-table-card">
            <table>
              <thead><tr><th>Version</th><th>État</th><th>Créée</th><th>Note</th></tr></thead>
              <tbody>{data.versions.map((v) => (
                <tr key={v.numero}><td>v{v.numero}</td><td><span className="badge badge-gray">{LIBELLES_VERSION[v.statut] || v.statut}</span></td><td className="ctn-date">{dateFr(v.date_creation)}</td><td className="ctn-classement">{v.note_modification || '—'}</td></tr>
              ))}</tbody>
            </table>
          </div>
          {(jamaisPublie || !c.actif) && <div style={{ marginTop: '1.25rem' }}><button type="button" className="btn-admin btn-admin-ghost ctn-lien-danger" onClick={supprimer}>Supprimer ce contenu</button></div>}
        </div>
      )}
    </>
  )
}