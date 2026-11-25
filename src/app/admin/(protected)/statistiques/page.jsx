'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Chart from 'chart.js/auto'
import { api } from '@/lib/api'

const PERIODES = [
  { jours: 7, nom: '7 jours' },
  { jours: 30, nom: '30 jours' },
  { jours: 90, nom: '3 mois' },
  { jours: 365, nom: '1 an' },
]
const ONGLETS = [
  { cle: 'apercu', nom: 'Vue d’ensemble' },
  { cle: 'utilisateurs', nom: 'Utilisateurs' },
  { cle: 'contenus', nom: 'Contenus' },
  { cle: 'recherche', nom: 'Recherches' },
  { cle: 'concours', nom: 'Concours' },
]
const C = { jaune: '#F59E0B', vert: '#10B981', violet: '#8B5CF6', bleu: '#0EA5E9', gris: '#64748B' }
const LIBELLE_SOURCE = { google: 'Google', moteur: 'Autre moteur de recherche', facebook: 'Facebook', whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X (Twitter)', telegram: 'Telegram', direct: 'Accès direct', autre: 'Autre site' }
const LIBELLE_APPAREIL = { mobile: 'Téléphone', tablette: 'Tablette', ordinateur: 'Ordinateur' }
const LIBELLE_ACTION = { vue: 'Consultations', telechargement: 'Téléchargements', lecture: 'Lectures', commentaire: 'Commentaires', favori: 'Favoris' }

const jourCourt = (iso) => `${iso.substring(8, 10)}/${iso.substring(5, 7)}`
const dateFr = (v) => (v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

function duree(s) {
  s = Math.round(Number(s) || 0)
  if (s < 60) return `${s} s`
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`
}

function Carte({ valeur, libelle, aide, couleur }) {
  return (
    <div className="admin-stat-card" title={aide}>
      <div className="stat-info">
        <div className="stat-number" style={couleur ? { color: couleur } : undefined}>{valeur}</div>
        <div className="stat-label">{libelle}</div>
      </div>
    </div>
  )
}

function Vide({ texte = 'Pas encore de données sur cette période.' }) {
  return <p style={{ color: '#94A3B8', fontSize: '0.85rem', padding: '0.5rem 0', margin: 0 }}>{texte}</p>
}

function Barres({ lignes, couleur, libelle = (x) => x }) {
  const max = Math.max(1, ...lignes.map((l) => l.n))
  if (!lignes.length) return <Vide />
  return (
    <div style={{ display: 'grid', gap: '0.6rem' }}>
      {lignes.map((l) => (
        <div key={l.nom}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
            <span style={{ fontWeight: 600 }}>{libelle(l.nom)}</span><span style={{ color: '#64748B' }}>{l.n}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: '#F1F5F9' }}>
            <div style={{ width: `${Math.max(3, (l.n / max) * 100)}%`, height: '100%', borderRadius: 999, background: couleur }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Graphique({ type = 'line', labels, series, legende = false, hauteur = 110 }) {
  const ref = useRef(null)
  const cle = JSON.stringify([type, labels, series])
  useEffect(() => {
    if (!ref.current) return
    const graphique = new Chart(ref.current.getContext('2d'), {
      type,
      data: {
        labels,
        datasets: series.map((s) => type === 'bar'
          ? { label: s.label, data: s.valeurs, backgroundColor: s.couleur, borderRadius: 4 }
          : { label: s.label, data: s.valeurs, borderColor: s.couleur, backgroundColor: s.couleur, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: 0.35 }),
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: legende, position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0, color: '#94A3B8', font: { size: 11 } }, grid: { color: '#F1F5F9' } },
          x: { ticks: { color: '#94A3B8', font: { size: 11 }, maxTicksLimit: 12 }, grid: { display: false } },
        },
      },
    })
    return () => graphique.destroy()
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} height={hauteur}></canvas>
}

function Encadre({ titre, sous, children, style }) {
  return (
    <div className="chart-card" style={style}>
      <div className="card-header"><div><div className="card-title">{titre}</div>{sous && <div className="card-subtitle">{sous}</div>}</div></div>
      {children}
    </div>
  )
}

function Tableau({ titre, colonnes, lignes, vide = 'Aucune donnée sur cette période.' }) {
  return (
    <div className="admin-table-card" style={{ marginTop: '1.25rem' }}>
      <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}><div className="card-title">{titre}</div></div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr>{colonnes.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {lignes.map((l, i) => <tr key={i} onClick={l.onClick} style={l.onClick ? { cursor: 'pointer' } : undefined}>{l.cellules.map((c, k) => <td key={k}>{c}</td>)}</tr>)}
            {lignes.length === 0 && <tr><td colSpan={colonnes.length} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>{vide}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Onglets
function Apercu({ d }) {
  const r = d.resume
  return (
    <>
      {!d.suivi_depuis
        ? <div className="alert alert-error" style={{ marginBottom: '1rem' }}>Aucune visite n’a encore été enregistrée. Les chiffres de visiteurs commenceront à apparaître dès les prochaines visites.</div>
        : <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0 0 1rem' }}>Suivi des visiteurs actif depuis le {d.suivi_depuis.split('-').reverse().join('/')}. Vos propres passages en tant qu’administrateur ne sont jamais comptés.</p>}
      <div className="admin-stats-grid">
        <Carte valeur={d.en_ligne} libelle="En ligne maintenant" couleur={C.vert} aide="Visiteurs actifs ces 2 dernières minutes." />
        <Carte valeur={r.visiteurs} libelle="Visiteurs" couleur={C.jaune} aide="Personnes différentes (un navigateur = un visiteur)." />
        <Carte valeur={r.visites} libelle="Visites" aide="Une visite = une série de pages sans pause de 30 minutes." />
        <Carte valeur={r.pages} libelle="Pages vues" />
      </div>
      <div className="admin-stats-grid">
        <Carte valeur={duree(r.temps_moyen)} libelle="Temps moyen par visite" couleur={C.violet} aide="Temps réellement passé, onglet visible à l'écran." />
        <Carte valeur={r.pages_par_visite} libelle="Pages par visite" />
        <Carte valeur={`${r.taux_rebond} %`} libelle="Quittent après 1 page" aide="Visites où une seule page a été consultée." />
        <Carte valeur={r.connectes} libelle="Visiteurs connectés" aide="Visiteurs qui avaient un compte et étaient connectés." />
      </div>
      <div className="admin-stats-grid">
        <Carte valeur={r.nouveaux} libelle="Nouveaux visiteurs" aide="Jamais vus avant cette période." />
        <Carte valeur={r.anciens} libelle="Visiteurs qui reviennent" aide="Déjà venus avant cette période." />
        <Carte valeur={d.telechargements.documents_total} libelle="Téléchargements de documents (total)" couleur={C.violet} aide="Total depuis le début, visiteurs inscrits ou non." />
        <Carte valeur={d.telechargements.exercices_periode} libelle="Exercices téléchargés (période)" />
      </div>

      <Encadre titre="Fréquentation par jour" sous="Visiteurs, visites et pages vues" style={{ marginBottom: '1.25rem' }}>
        <Graphique labels={d.serie.map((p) => jourCourt(p.jour))} legende series={[
          { label: 'Visiteurs', valeurs: d.serie.map((p) => p.visiteurs), couleur: C.jaune },
          { label: 'Visites', valeurs: d.serie.map((p) => p.visites), couleur: C.vert },
          { label: 'Pages vues', valeurs: d.serie.map((p) => p.pages), couleur: C.violet },
        ]} />
      </Encadre>

      <div className="admin-grid">
        <Encadre titre="Heures d’affluence" sous="Nombre de visites selon l’heure de la journée">
          <Graphique type="bar" labels={d.heures.map((h) => `${h.h}h`)} series={[{ label: 'Visites', valeurs: d.heures.map((h) => h.n), couleur: C.jaune }]} hauteur={150} />
        </Encadre>
        <div className="activity-card">
          <div className="card-header"><div><div className="card-title">Provenance</div><div className="card-subtitle">D’où viennent les visites</div></div></div>
          <Barres lignes={d.sources} couleur={C.jaune} libelle={(n) => LIBELLE_SOURCE[n] || n} />
          <div className="card-title" style={{ margin: '1.2rem 0 0.6rem' }}>Appareils</div>
          <Barres lignes={d.appareils} couleur={C.bleu} libelle={(n) => LIBELLE_APPAREIL[n] || n} />
        </div>
      </div>

      <Tableau titre="Pages les plus vues" colonnes={['Page', 'Vues', 'Visiteurs', 'Temps moyen']}
        lignes={d.pages.map((p) => ({ cellules: [<a key="a" href={p.chemin} target="_blank" rel="noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>{p.chemin}</a>, p.vues, p.visiteurs, duree(p.temps)] }))} />
    </>
  )
}

function FicheUtilisateur({ id, onFermer }) {
  const [f, setF] = useState(null)
  const [erreur, setErreur] = useState('')
  useEffect(() => {
    api.get(`/admin/statistiques/utilisateurs/${id}`).then((r) => setF(r.data)).catch((e) => setErreur(e.message || 'Erreur'))
  }, [id])
  return (
    <div role="dialog" aria-modal="true" onClick={onFermer} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', background: '#fff', color: '#0F172A', borderRadius: 16, padding: '1.4rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{f ? f.utilisateur.nom_complet : 'Utilisateur'}</h3>
          <button type="button" className="btn-admin btn-admin-secondary" onClick={onFermer}>Fermer</button>
        </div>
        {erreur && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{erreur}</div>}
        {!f && !erreur && <p style={{ color: '#64748B' }}>Chargement…</p>}
        {f && (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '0.8rem', fontSize: '0.88rem' }}>
            <p style={{ margin: 0, color: '#64748B' }}>{f.utilisateur.email} · {f.utilisateur.classe || 'classe non renseignée'}{f.utilisateur.filiere ? ` · ${f.utilisateur.filiere}` : ''}<br />Inscrit le {dateFr(f.utilisateur.date_inscription)}</p>
            <div className="admin-stats-grid" style={{ margin: 0 }}>
              <Carte valeur={f.resume.visites} libelle="Visites" />
              <Carte valeur={f.resume.pages} libelle="Pages vues" />
              <Carte valeur={duree(f.resume.secondes)} libelle="Temps total" />
              <Carte valeur={f.favoris} libelle="Favoris" />
            </div>
            <p style={{ margin: 0 }}><strong>Dernier passage :</strong> {dateFr(f.resume.dernier)}</p>
            <p style={{ margin: 0 }}><strong>Concours :</strong> {f.concours.seances} séance(s), {f.concours.terminees} terminée(s){f.concours.moyenne != null ? `, moyenne ${f.concours.moyenne} %` : ''} · <strong>Commentaires :</strong> {f.commentaires}</p>
            {f.actions.length > 0 && <p style={{ margin: 0 }}><strong>Actions sur les documents :</strong> {f.actions.map((a) => `${LIBELLE_ACTION[a.action] || a.action} : ${a.n}`).join(' · ')}</p>}
            {f.documents.length > 0 && (
              <div><strong>Documents les plus utilisés</strong><ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>{f.documents.map((x) => <li key={x.id}>{x.titre} ({x.n})</li>)}</ul></div>
            )}
            <div><strong>Dernières pages visitées</strong>
              {f.pages.length === 0 ? <Vide texte="Aucune page enregistrée pour cet utilisateur." /> : (
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>{f.pages.map((p, i) => <li key={i}>{p.chemin} <span style={{ color: '#94A3B8' }}>· {dateFr(p.created_at)} · {duree(p.secondes)}</span></li>)}</ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Utilisateurs({ d }) {
  const [fiche, setFiche] = useState(null)
  const r = d.resume
  return (
    <>
      <div className="admin-stats-grid">
        <Carte valeur={r.total} libelle="Inscrits au total" couleur={C.jaune} />
        <Carte valeur={r.nouveaux} libelle="Nouveaux inscrits" couleur={C.bleu} />
        <Carte valeur={r.actifs} libelle="Inscrits actifs" aide="Inscrits connectés qui ont visité le site sur la période." />
        <Carte valeur={r.visiteurs ? `${Math.round((r.reviennent / r.visiteurs) * 100)} %` : '0 %'} libelle="Visiteurs fidèles" aide="Visiteurs venus lors de 2 visites différentes ou plus." />
      </div>
      <Encadre titre="Inscriptions par jour" style={{ marginBottom: '1.25rem' }}>
        <Graphique type="bar" labels={d.serie.map((p) => jourCourt(p.jour))} series={[{ label: 'Nouveaux inscrits', valeurs: d.serie.map((p) => p.n), couleur: C.bleu }]} />
      </Encadre>
      <div className="admin-grid">
        <div className="activity-card"><div className="card-header"><div className="card-title">Par classe</div></div><Barres lignes={d.classes} couleur={C.jaune} /></div>
        <div className="activity-card"><div className="card-header"><div className="card-title">Par filière</div></div><Barres lignes={d.filieres} couleur={C.vert} /></div>
      </div>
      <Tableau titre="Inscrits les plus actifs (cliquez sur une ligne pour voir la fiche)" colonnes={['Nom', 'Classe', 'Visites', 'Pages', 'Temps passé', 'Dernier passage']}
        vide="Aucune activité d’inscrit enregistrée sur cette période."
        lignes={d.top.map((u) => ({ onClick: () => setFiche(u.id), cellules: [<strong key="n">{u.nom}</strong>, u.classe || '—', u.visites, u.pages, duree(u.secondes), dateFr(u.dernier)] }))} />
      {fiche && <FicheUtilisateur id={fiche} onFermer={() => setFiche(null)} />}
    </>
  )
}

function Contenus({ d }) {
  const r = d.resume
  return (
    <>
      <div className="admin-stats-grid">
        <Carte valeur={r.documents_publies} libelle="Documents publiés" />
        <Carte valeur={r.telechargements_total} libelle="Téléchargements (total)" couleur={C.violet} aide="Depuis le début, tous visiteurs." />
        <Carte valeur={r.favoris} libelle="Ajouts en favoris" />
        <Carte valeur={r.commentaires} libelle="Commentaires" />
      </div>
      <div className="admin-stats-grid">
        <Carte valeur={r.documents_jamais_vus} libelle="Documents jamais consultés" aide="Aucune visite sur la période (le suivi des pages commence à son activation)." />
        <Carte valeur={r.exercices_jamais_vus} libelle="Exercices jamais consultés" />
        <Carte valeur={r.telechargements_inscrits} libelle="Téléchargements par des inscrits" aide="Téléchargements effectués par des utilisateurs connectés, sur la période." />
      </div>
      <div className="admin-grid">
        <div className="activity-card"><div className="card-header"><div><div className="card-title">Consultations par catégorie</div><div className="card-subtitle">Documents</div></div></div><Barres lignes={d.categories} couleur={C.jaune} /></div>
      </div>
      <Tableau titre="Documents les plus consultés" colonnes={['Titre', 'Catégorie', 'Vues', 'Visiteurs', 'Temps moyen', 'Téléch.', 'Favoris']}
        lignes={d.documents_vus.map((x) => ({ cellules: [<Link key="l" href={`/documents/${x.id}`} target="_blank" style={{ color: 'inherit', fontWeight: 600 }}>{x.titre}</Link>, x.categorie || '—', x.vues, x.visiteurs, duree(x.temps), x.telechargements, x.favoris] }))} />
      <Tableau titre="Documents les plus téléchargés (depuis le début)" colonnes={['Titre', 'Catégorie', 'Téléchargements']}
        lignes={d.documents_telecharges.map((x) => ({ cellules: [<strong key="t">{x.titre}</strong>, x.categorie || '—', x.telechargements] }))} />
      <Tableau titre="Exercices corrigés les plus consultés" colonnes={['Titre', 'Matière', 'Sujet', 'Corrigé', 'PDF']}
        lignes={d.exercices.map((x) => ({ cellules: [<Link key="l" href={`/s/${x.code}`} target="_blank" style={{ color: 'inherit', fontWeight: 600 }}>{x.titre}</Link>, x.matiere, x.vues, x.corriges, x.telechargements] }))} />
    </>
  )
}

function Recherches({ d }) {
  const r = d.resume
  const origine = (o) => (o === 'exercices' ? 'Exercices' : 'Documents')
  return (
    <>
      <div className="admin-stats-grid">
        <Carte valeur={r.recherches} libelle="Recherches effectuées" couleur={C.jaune} />
        <Carte valeur={r.sans_resultat} libelle="Sans aucun résultat" couleur="#EF4444" aide="Ce que les visiteurs cherchent et que vous n’avez pas encore." />
        <Carte valeur={r.recherches ? `${Math.round((r.sans_resultat / r.recherches) * 100)} %` : '0 %'} libelle="Part sans résultat" />
      </div>
      <Tableau titre="Recherches sans résultat : les sujets à ajouter" colonnes={['Recherche', 'Où', 'Fois']}
        vide="Aucune recherche sans résultat sur cette période."
        lignes={d.sans_resultat.map((x) => ({ cellules: [<strong key="t">{x.terme}</strong>, origine(x.origine), x.n] }))} />
      <Tableau titre="Recherches les plus fréquentes" colonnes={['Recherche', 'Où', 'Fois', 'Résultats trouvés']}
        lignes={d.top.map((x) => ({ cellules: [<strong key="t">{x.terme}</strong>, origine(x.origine), x.n, x.resultats] }))} />
    </>
  )
}

function Concours({ d }) {
  const r = d.resume
  return (
    <>
      <div className="admin-stats-grid">
        <Carte valeur={r.lancees} libelle="Séances lancées" couleur={C.jaune} />
        <Carte valeur={r.terminees} libelle="Séances terminées" couleur={C.vert} />
        <Carte valeur={`${r.taux_achevement} %`} libelle="Taux d’achèvement" />
        <Carte valeur={r.moyenne == null ? '—' : `${r.moyenne} %`} libelle="Score moyen" aide="Moyenne des séances terminées." />
      </div>
      <div className="admin-stats-grid"><Carte valeur={r.participants} libelle="Participants différents" /></div>
      <Encadre titre="Séances par jour" style={{ marginBottom: '1.25rem' }}>
        <Graphique type="bar" labels={d.serie.map((p) => jourCourt(p.jour))} series={[{ label: 'Séances', valeurs: d.serie.map((p) => p.n), couleur: C.jaune }]} />
      </Encadre>
      <Tableau titre="Domaines travaillés" colonnes={['Domaine', 'Réponses données', 'Taux de réussite']}
        lignes={d.domaines.map((x) => ({ cellules: [<strong key="n">{x.nom}</strong>, x.reponses, `${x.reussite} %`] }))} />
      <Tableau titre="Questions les plus ratées (au moins 3 réponses)" colonnes={['Question', 'Domaine', 'Réponses', 'Réussite']}
        lignes={d.ratees.map((x) => ({ cellules: [x.enonce, x.domaine, x.reponses, `${x.reussite} %`] }))} />
    </>
  )
}

const VUES = { apercu: Apercu, utilisateurs: Utilisateurs, contenus: Contenus, recherche: Recherches, concours: Concours }

export default function PageStatistiques() {
  const [onglet, setOnglet] = useState('apercu')
  const [jours, setJours] = useState(30)
  const [data, setData] = useState(null)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let annule = false
    setChargement(true)
    setErreur('')
    api.get(`/admin/statistiques/${onglet}`, { params: { jours } })
      .then((res) => { if (!annule) setData({ onglet, ...res.data }) })
      .catch((err) => { if (!annule) { setData(null); setErreur(err.message || 'Impossible de charger les statistiques.') } })
      .finally(() => { if (!annule) setChargement(false) })
    return () => { annule = true }
  }, [onglet, jours])

  const Vue = VUES[onglet]
  const pret = data && data.onglet === onglet

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Statistiques</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.88rem' }}>Ce que font les visiteurs sur EduBF.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }} role="group" aria-label="Période">
          {PERIODES.map((p) => (
            <button key={p.jours} type="button" onClick={() => setJours(p.jours)} aria-pressed={jours === p.jours}
              className={`btn-admin ${jours === p.jours ? 'btn-admin-primary' : 'btn-admin-secondary'}`}>{p.nom}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }} role="tablist">
        {ONGLETS.map((o) => (
          <button key={o.cle} type="button" role="tab" aria-selected={onglet === o.cle} onClick={() => setOnglet(o.cle)}
            className={`btn-admin ${onglet === o.cle ? 'btn-admin-primary' : 'btn-admin-secondary'}`}>{o.nom}</button>
        ))}
      </div>

      {erreur && <div className="alert alert-error">{erreur}</div>}
      {chargement && !pret && !erreur && <p style={{ color: '#64748B' }}>Chargement…</p>}
      {pret && <div style={{ opacity: chargement ? 0.55 : 1, transition: 'opacity .15s' }}><Vue d={data} /></div>}
    </>
  )
}