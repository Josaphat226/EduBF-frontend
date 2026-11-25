import katex from 'katex'
import 'katex/dist/katex.min.css'
import Graphique from './Graphique'

// Affiche un texte riche du format EduBF (document TipTap + nœuds propres : formules,
// figures, graphiques, zones de réponse). Aucun HTML brut saisi par un auteur n'est
// jamais injecté : tout est reconstruit nœud par nœud à partir du JSON.
// Seul le rendu des formules passe par dangerouslySetInnerHTML : c'est la sortie de
// KaTeX (mode « trust » désactivé), qui échappe le texte d'entrée.

function Formule({ latex, bloc }) {
  const html = katex.renderToString(latex, {
    displayMode: bloc,
    throwOnError: false,
    output: 'htmlAndMathml',
  })
  return bloc
    ? <div className="sujet-formule" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />
}

function marquer(texte, marques) {
  let el = texte
  for (const m of marques || []) {
    if (m.type === 'bold') el = <strong>{el}</strong>
    else if (m.type === 'italic') el = <em>{el}</em>
    else if (m.type === 'underline') el = <u>{el}</u>
    else if (m.type === 'subscript') el = <sub>{el}</sub>
    else if (m.type === 'superscript') el = <sup>{el}</sup>
  }
  return el
}

function Enfants({ noeuds }) {
  return (noeuds || []).map((n, i) => <Noeud key={i} n={n} />)
}

function Noeud({ n }) {
  const a = n.attrs || {}
  switch (n.type) {
    case 'text':
      return marquer(n.text, n.marks)
    case 'paragraph':
      return <p><Enfants noeuds={n.content} /></p>
    case 'hardBreak':
      return <br />
    case 'heading': {
      // Le titre de la page est un h1, les parties des h2, les exercices des h3 :
      // les intertitres du texte descendent donc d'un cran.
      const Titre = a.level === 4 ? 'h5' : 'h4'
      return <Titre className="sujet-intertitre"><Enfants noeuds={n.content} /></Titre>
    }
    case 'bulletList':
      return <ul><Enfants noeuds={n.content} /></ul>
    case 'orderedList':
      return <ol start={a.start > 1 ? a.start : undefined}><Enfants noeuds={n.content} /></ol>
    case 'listItem':
      return <li><Enfants noeuds={n.content} /></li>
    case 'blockquote':
      return <blockquote><Enfants noeuds={n.content} /></blockquote>
    case 'horizontalRule':
      return <hr />
    case 'table':
      return (
        <div className="sujet-tableau">
          <table><tbody><Enfants noeuds={n.content} /></tbody></table>
        </div>
      )
    case 'tableRow':
      return <tr><Enfants noeuds={n.content} /></tr>
    case 'tableHeader':
      return <th scope="col" colSpan={a.colspan > 1 ? a.colspan : undefined} rowSpan={a.rowspan > 1 ? a.rowspan : undefined}><Enfants noeuds={n.content} /></th>
    case 'tableCell':
      return <td colSpan={a.colspan > 1 ? a.colspan : undefined} rowSpan={a.rowspan > 1 ? a.rowspan : undefined}><Enfants noeuds={n.content} /></td>
    case 'formuleInline':
      return <Formule latex={a.latex} bloc={false} />
    case 'formuleBloc':
      return <Formule latex={a.latex} bloc />
    case 'figure':
      if (!a.url) return null
      return (
        <figure className="sujet-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.url} alt={a.alt} loading="lazy" decoding="async" style={a.largeur_pct ? { width: `${a.largeur_pct}%` } : undefined} />
          {(a.legende || a.credit) && (
            <figcaption>
              {a.legende}
              {a.credit && <span className="sujet-credit"> {a.legende ? '· ' : ''}{a.credit}</span>}
            </figcaption>
          )}
        </figure>
      )
    case 'graphique':
      return <Graphique attrs={a} />
    case 'zoneReponse':
      return (
        <div className="sujet-zone-reponse" aria-hidden="true">
          {Array.from({ length: a.lignes || 3 }, (_, i) => <div key={i} />)}
        </div>
      )
    default:
      return null
  }
}

export default function Riche({ doc }) {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) return null
  return (
    <div className="sujet-riche">
      <Enfants noeuds={doc.content} />
    </div>
  )
}