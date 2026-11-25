import { libelleType } from '@/lib/contenus'

function Pastille({ children, accent }) {
  return children ? <span className={`sujet-pastille${accent ? ' sujet-pastille-accent' : ''}`}>{children}</span> : null
}

function dateFr(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' }
}

export default function EnteteContenu({ contenu: c }) {
  const bareme = c.bareme_total != null ? Number(c.bareme_total) : null
  return (
    <header className="sujet-entete">
      <p className="sujet-type">{libelleType(c.type)}</p>
      <h1 className="sujet-titre">{c.titre}</h1>
      <div className="sujet-pastilles">
        <Pastille accent>{c.matiere}</Pastille>
        <Pastille>{c.niveau}</Pastille>
        <Pastille>{c.examen}</Pastille>
        {c.series.map((s) => <Pastille key={s}>{s}</Pastille>)}
        <Pastille>{c.annee_scolaire}</Pastille>
        <Pastille>{c.difficulte && `Niveau ${c.difficulte}`}</Pastille>
        <Pastille>{c.duree_minutes && `${c.duree_minutes} min`}</Pastille>
        <Pastille>{bareme && `/ ${String(bareme).replace('.', ',')} pts`}</Pastille>
      </div>
      {c.chapitres.length > 0 && (
        <p className="sujet-chapitres">Chapitre{c.chapitres.length > 1 ? 's' : ''} : {c.chapitres.join(' · ')}</p>
      )}
      {c.description && <p className="sujet-description">{c.description}</p>}
    </header>
  )
}

export function PiedContenu({ contenu: c }) {
  return (
    <footer className="sujet-pied">
      {c.origine === 'externe' && c.source_nom && (
        <p>
          Source : {c.source_url
            ? <a href={c.source_url} target="_blank" rel="noopener noreferrer nofollow">{c.source_nom}</a>
            : c.source_nom}
          {c.licence && ` · ${c.licence}`}
        </p>
      )}
      {c.origine === 'edubf' && <p>Contenu original EduBF.</p>}
      <p className="sujet-pied-ref">
        Référence EDU-{c.code} · version {c.version.numero}
        {c.version.date_publication && ` · publiée le ${dateFr(c.version.date_publication)}`}
      </p>
    </footer>
  )
}