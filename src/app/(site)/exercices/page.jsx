import Link from 'next/link'
import { apiServer } from '@/lib/api'
import { LIBELLES_TYPE_PLURIEL, TRIS, lireFiltres, urlExercices, de } from '@/lib/contenus'
import CarteContenu from '@/components/contenus/CarteContenu'
import CodeAcces from '@/components/contenus/CodeAcces'
import FiltresPliables from '@/components/contenus/FiltresPliables'
import '@/styles/contenus.css'
import '@/styles/exercices.css'

const PAR_PAGE = 12

async function charger(filtres) {
  const qs = new URLSearchParams({ facettes: '1', par_page: String(PAR_PAGE) })
  for (const cle of ['niveau', 'matiere', 'examen', 'type', 'q', 'tri']) if (filtres[cle]) qs.set(cle, filtres[cle])
  if (filtres.page > 1) qs.set('page', String(filtres.page))
  return apiServer(`/contenus?${qs}`)
}

// Les filtres « officiels » : ceux que le serveur a reconnus (adresses normalisées)
function filtresReconnus(selection, page = 1) {
  return {
    niveau: selection.niveau ? selection.niveau.slug : '',
    matiere: selection.matiere ? selection.matiere.slug : '',
    examen: selection.examen ? selection.examen.slug : '',
    type: selection.type || '',
    q: selection.q || '',
    tri: selection.tri && selection.tri !== 'recent' ? selection.tri : '',
    page,
  }
}

export async function generateMetadata({ searchParams }) {
  const filtres = lireFiltres(await searchParams)
  try {
    const data = await charger(filtres)
    const sel = data.selection
    let titre = sel.type ? LIBELLES_TYPE_PLURIEL[sel.type] : 'Exercices corrigés'
    if (sel.matiere && sel.matiere.nom) titre += ` ${de(sel.matiere.nom)}`
    if (sel.niveau && sel.niveau.nom) titre += ` — ${sel.niveau.nom}`
    if (sel.examen && sel.examen.nom) titre += ` — ${sel.examen.nom}`
    if (filtres.page > 1) titre += ` — page ${filtres.page}`

    let description = 'Exercices, devoirs et sujets d’examen corrigés'
    if (sel.matiere && sel.matiere.nom) description += ` ${de(sel.matiere.nom)}`
    if (sel.niveau && sel.niveau.nom) description += ` pour le niveau ${sel.niveau.nom}`
    if (sel.examen && sel.examen.nom) description += ` (${sel.examen.nom})`
    description += ' : des sujets détaillés avec corrigés pas à pas, gratuits sur EduBF.'

    // Pas d'indexation des recherches libres ni des pages vides
    const indexable = !sel.q && data.pagination.total > 0
    return {
      title: `${titre} — EduBF`,
      description,
      alternates: { canonical: urlExercices(filtresReconnus({ ...sel, q: null, tri: null }, filtres.page)) },
      robots: indexable ? undefined : { index: false, follow: true },
    }
  } catch {
    return { title: 'Exercices corrigés — EduBF', robots: { index: false } }
  }
}

const MAX_VISIBLES = 8

// Les premiers choix sont visibles ; le reste est dans « Voir les autres » (sans JavaScript).
// Un choix actif reste toujours visible.
function Groupe({ titre, liste, rendu, estActif }) {
  let visibles = liste.slice(0, MAX_VISIBLES)
  let autres = liste.slice(MAX_VISIBLES)
  const actifCache = autres.filter(estActif)
  if (actifCache.length) {
    visibles = [...visibles, ...actifCache]
    autres = autres.filter((x) => !estActif(x))
  }
  return (
    <div className="exo-groupe">
      <p className="exo-groupe-titre">{titre}</p>
      <div className="exo-chips">
        {visibles.map(rendu)}
        {autres.length > 0 && (
          <details className="exo-plus">
            <summary>Voir les autres ({autres.length})</summary>
            <div className="exo-chips exo-plus-liste">{autres.map(rendu)}</div>
          </details>
        )}
      </div>
    </div>
  )
}

function Chip({ href, actif, nom, n }) {
  return (
    <Link href={href} prefetch={false} className={`exo-chip${actif ? ' exo-chip-actif' : ''}`} aria-current={actif ? 'true' : undefined}>
      {nom}
      <span className="exo-chip-n">{n}</span>
    </Link>
  )
}

export default async function PageExercices({ searchParams }) {
  const filtres = lireFiltres(await searchParams)
  const data = await charger(filtres)
  const { contenus, pagination, selection, facettes } = data
  const courant = filtresReconnus(selection)
  const aDesFiltres = Boolean(courant.niveau || courant.matiere || courant.examen || courant.type || courant.q)
  // Pas de cadre de filtres vide quand il n'y a encore aucun contenu
  const aDesChoix = Boolean(facettes && (facettes.niveaux.length || facettes.matieres.length || facettes.types.length || facettes.examens.length))
  // Cliquer sur un choix déjà actif le retire ; changer un filtre revient toujours à la page 1
  const lien = (cle, valeur, actif) => urlExercices({ ...courant, [cle]: actif ? '' : valeur })
  const triActuel = courant.tri || 'recent'
  // Pastilles des filtres actifs (cliquer retire le filtre)
  const pastilles = []
  if (selection.niveau && selection.niveau.nom) pastilles.push({ cle: 'niveau', texte: selection.niveau.nom })
  if (selection.matiere && selection.matiere.nom) pastilles.push({ cle: 'matiere', texte: selection.matiere.nom })
  if (courant.type) pastilles.push({ cle: 'type', texte: LIBELLES_TYPE_PLURIEL[courant.type] })
  if (selection.examen && selection.examen.nom) pastilles.push({ cle: 'examen', texte: selection.examen.nom })
  if (courant.q) pastilles.push({ cle: 'q', texte: `« ${courant.q} »` })
  const lienPage = (p) => urlExercices({ ...courant, page: p })

  return (
    <>
      <div className="docs-hero">
        <div className="docs-blob-l"></div>
        <div className="docs-blob-r"></div>
        <div className="docs-blob-sm"></div>
        <h1 className="docs-hero-title">Exercices corrigés</h1>
        <form className="docs-search-wrap" role="search" action="/exercices" method="get">
          {courant.niveau && <input type="hidden" name="niveau" value={courant.niveau} />}
          {courant.matiere && <input type="hidden" name="matiere" value={courant.matiere} />}
          {courant.type && <input type="hidden" name="type" value={courant.type} />}
          {courant.examen && <input type="hidden" name="examen" value={courant.examen} />}
          {courant.tri && <input type="hidden" name="tri" value={courant.tri} />}
          <input type="text" name="q" defaultValue={courant.q} placeholder="Rechercher un exercice, une notion..." aria-label="Rechercher un exercice" maxLength={100} />
          <button type="submit" aria-label="Rechercher">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>

      <main className="exo-page">
        <header className="exo-entete">
          <p className="exo-intro">Des exercices, devoirs et sujets d’examen créés par EduBF, avec un corrigé détaillé pour chaque question. Gratuit, à lire en ligne.</p>
          <CodeAcces />
        </header>

        {aDesChoix && (
          <FiltresPliables nb={pastilles.filter((p) => p.cle !== 'q').length}>
            <section className="exo-filtres" aria-label="Filtres">
              {facettes.niveaux.length > 0 && (
                <Groupe titre="Niveau" liste={facettes.niveaux} estActif={(x) => courant.niveau === x.slug}
                  rendu={(x) => <Chip key={x.slug} nom={x.nom} n={x.n} actif={courant.niveau === x.slug} href={lien('niveau', x.slug, courant.niveau === x.slug)} />} />
              )}
              {facettes.matieres.length > 0 && (
                <Groupe titre="Matière" liste={facettes.matieres} estActif={(x) => courant.matiere === x.slug}
                  rendu={(x) => <Chip key={x.slug} nom={x.nom} n={x.n} actif={courant.matiere === x.slug} href={lien('matiere', x.slug, courant.matiere === x.slug)} />} />
              )}
              {facettes.types.length > 0 && (
                <Groupe titre="Type" liste={facettes.types} estActif={(x) => courant.type === x.valeur}
                  rendu={(x) => <Chip key={x.valeur} nom={LIBELLES_TYPE_PLURIEL[x.valeur]} n={x.n} actif={courant.type === x.valeur} href={lien('type', x.valeur, courant.type === x.valeur)} />} />
              )}
              {facettes.examens.length > 0 && (
                <Groupe titre="Examen" liste={facettes.examens} estActif={(x) => courant.examen === x.slug}
                  rendu={(x) => <Chip key={x.slug} nom={x.nom} n={x.n} actif={courant.examen === x.slug} href={lien('examen', x.slug, courant.examen === x.slug)} />} />
              )}
            </section>
          </FiltresPliables>
        )}

        {pastilles.length > 0 && (
          <div className="exo-actifs" aria-label="Filtres actifs">
            {pastilles.map((p) => (
              <Link key={p.cle} href={lien(p.cle, '', true)} prefetch={false} className="exo-pastille" aria-label={`Retirer le filtre ${p.texte}`}>
                {p.texte} <span aria-hidden="true">✕</span>
              </Link>
            ))}
            <Link href="/exercices" prefetch={false} className="exo-tout-effacer">Tout effacer</Link>
          </div>
        )}

        <section aria-labelledby="exo-resultats">
          <div className="exo-resume">
            <h2 id="exo-resultats" className="exo-resume-titre">
              {pagination.total === 0 && contenus.length === 0 ? 'Aucun résultat' : `${pagination.total} résultat${pagination.total > 1 ? 's' : ''}`}
            </h2>
            {pagination.total > 1 && (
              <nav className="exo-tri" aria-label="Trier les résultats">
                <span>Trier :</span>
                {Object.entries(TRIS).map(([cle, nom]) => (
                  <Link key={cle} href={urlExercices({ ...courant, tri: cle })} prefetch={false} className={`exo-tri-lien${triActuel === cle ? ' exo-tri-actif' : ''}`} aria-current={triActuel === cle ? 'true' : undefined}>{nom}</Link>
                ))}
              </nav>
            )}
          </div>

          {contenus.length > 0 ? (
            <div className="exo-grille">
              {contenus.map((c) => <CarteContenu key={c.code} c={c} />)}
            </div>
          ) : aDesFiltres ? (
            <div className="exo-vide">
              <p>Aucun exercice ne correspond à ces critères.</p>
              <Link href="/exercices" className="exo-bouton" prefetch={false}>Voir tous les exercices</Link>
            </div>
          ) : (
            <div className="exo-vide">
              <p>Les premiers exercices corrigés arrivent bientôt.</p>
              <p>En attendant, retrouvez tous les sujets en PDF dans la bibliothèque.</p>
              <Link href="/documents" className="exo-bouton">Voir les documents</Link>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav className="exo-pagination" aria-label="Pagination">
              {pagination.page > 1
                ? <Link href={lienPage(pagination.page - 1)} rel="prev" prefetch={false}>← Précédent</Link>
                : <span aria-hidden="true" />}
              <span>Page {pagination.page} sur {pagination.totalPages}</span>
              {pagination.page < pagination.totalPages
                ? <Link href={lienPage(pagination.page + 1)} rel="next" prefetch={false}>Suivant →</Link>
                : <span aria-hidden="true" />}
            </nav>
          )}
        </section>
      </main>
    </>
  )
}