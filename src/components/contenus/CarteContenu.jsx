import Link from 'next/link'
import { libelleType, formaterPoints } from '@/lib/contenus'

// Carte d'un contenu dans la liste. Toute la carte est cliquable (le lien du titre est étiré par le CSS).
export default function CarteContenu({ c }) {
  const points = c.bareme_total != null ? formaterPoints(Number(c.bareme_total)) : ''
  const meta = [c.duree_minutes ? `${c.duree_minutes} min` : '', points].filter(Boolean).join(' · ')
  return (
    <article className="exo-carte">
      <p className="exo-carte-type">{libelleType(c.type)}</p>
      <h3 className="exo-carte-titre"><Link href={`/s/${c.code}`}>{c.titre}</Link></h3>
      <div className="exo-carte-pastilles">
        <span className="sujet-pastille sujet-pastille-accent">{c.matiere}</span>
              {c.niveau && <span className="sujet-pastille">{c.niveau}</span>}
        {c.examen && <span className="sujet-pastille">{c.examen}</span>}
      </div>
      {c.description && <p className="exo-carte-description">{c.description}</p>}
      {meta && <p className="exo-carte-meta">{meta}</p>}
    </article>
  )
}