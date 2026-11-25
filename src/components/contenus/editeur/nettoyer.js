// Passage entre l'éditeur (TipTap) et le format stocké (schema-v1.json).
//
// TipTap ajoute des valeurs nulles, des attributs par défaut et un paragraphe vide à la fin
// du document ; le format stocké est volontairement plus strict (champs inconnus refusés).
// nettoyerDocument() convertit « ce que produit l'éditeur » en « ce que le serveur accepte ».

const ATTRS_AUTORISES = {
  heading: ['level'],
  orderedList: ['start'],
  tableCell: ['colspan', 'rowspan'],
  tableHeader: ['colspan', 'rowspan'],
  formuleInline: ['latex'],
  formuleBloc: ['latex'],
  figure: ['src', 'alt', 'legende', 'credit', 'largeur_pct'],
  graphique: ['graphique_type', 'titre', 'axe_x', 'axe_y', 'series'],
  zoneReponse: ['lignes'],
}

// Valeurs par défaut de TipTap qu'il est inutile de stocker
const VALEURS_PAR_DEFAUT = {
  orderedList: { start: 1 },
  tableCell: { colspan: 1, rowspan: 1 },
  tableHeader: { colspan: 1, rowspan: 1 },
}

const estVide = (v) =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0) ||
  (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)

// Retire récursivement null, undefined, chaînes vides, tableaux et objets vides
function epurer(valeur) {
  if (Array.isArray(valeur)) return valeur.map(epurer).filter((v) => !estVide(v))
  if (valeur && typeof valeur === 'object') {
    const sortie = {}
    for (const [cle, v] of Object.entries(valeur)) {
      const propre = epurer(v)
      if (!estVide(propre)) sortie[cle] = propre
    }
    return sortie
  }
  return valeur
}

function nettoyerAttrs(type, attrs) {
  const autorises = ATTRS_AUTORISES[type]
  if (!autorises || !attrs) return undefined
  const defauts = VALEURS_PAR_DEFAUT[type] || {}
  const sortie = {}
  for (const cle of autorises) {
    if (attrs[cle] === undefined || attrs[cle] === null) continue
    if (defauts[cle] !== undefined && attrs[cle] === defauts[cle]) continue
    const propre = epurer(attrs[cle])
    if (!estVide(propre)) sortie[cle] = propre
  }
  return Object.keys(sortie).length ? sortie : undefined
}

function nettoyerNoeud(noeud) {
  if (noeud.type === 'text') {
    if (!noeud.text) return null
    const marques = (noeud.marks || []).map((m) => ({ type: m.type }))
    return marques.length ? { type: 'text', text: noeud.text, marks: marques } : { type: 'text', text: noeud.text }
  }
  const sortie = { type: noeud.type }
  const attrs = nettoyerAttrs(noeud.type, noeud.attrs)
  if (attrs) sortie.attrs = attrs
  if (Array.isArray(noeud.content)) {
    const enfants = noeud.content.map(nettoyerNoeud).filter(Boolean)
    if (enfants.length) sortie.content = enfants
  }
  return sortie
}

const paragrapheVide = (n) => n.type === 'paragraph' && !n.content

// Document de l'éditeur -> document stocké.
// Les paragraphes vides du début et de la fin disparaissent (TipTap en ajoute un à la fin
// pour pouvoir continuer à écrire après une figure) ; un document sans contenu devient content: [].
export function nettoyerDocument(doc) {
  const enfants = ((doc && doc.content) || []).map(nettoyerNoeud).filter(Boolean)
  while (enfants.length && paragrapheVide(enfants[enfants.length - 1])) enfants.pop()
  while (enfants.length && paragrapheVide(enfants[0])) enfants.shift()
  return { type: 'doc', content: enfants }
}

// Document stocké -> document que l'éditeur sait ouvrir (il exige au moins un bloc).
export function preparerPourEditeur(doc) {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  return doc
}