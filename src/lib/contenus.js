import { api } from '@/lib/api'

export const LIBELLES_TYPE = {
  exercice: 'Exercice',
  serie_exercices: 'Série d’exercices',
  devoir: 'Devoir',
  composition: 'Composition',
  sujet_examen: 'Sujet d’examen',
}

export function libelleType(type) {
  return LIBELLES_TYPE[type] || 'Exercice'
}

// En français le pluriel commence à 2 : 0.5 -> « 0,5 pt », 1.5 -> « 1,5 pt », 2 -> « 2 pts »
export function formaterPoints(p) {
  if (p == null || Number.isNaN(Number(p))) return ''
  const n = Number(p)
  return `${String(n).replace('.', ',')} ${n >= 2 ? 'pts' : 'pt'}`
}

export const LIBELLES_TYPE_PLURIEL = {
  exercice: 'Exercices',
  serie_exercices: 'Séries d’exercices',
  devoir: 'Devoirs',
  composition: 'Compositions',
  sujet_examen: 'Sujets d’examen',
}

// ---------------------------------------------------------------------------
// Page « Exercices » : filtres dans l'adresse (lisibles, partageables, indexables)
//   /exercices?niveau=3e&matiere=mathematiques&type=devoir&q=racines&page=2
// ---------------------------------------------------------------------------
const CLES_FILTRES = ['niveau', 'matiere', 'type', 'examen', 'q', 'tri']

export const TRIS = { recent: 'Plus récents', ancien: 'Plus anciens', titre: 'Titre (A→Z)' }

// Lit les paramètres d'adresse fournis par Next.js (une valeur répétée arrive sous forme de liste)
export function lireFiltres(searchParams = {}) {
  const premier = (v) => (Array.isArray(v) ? v[0] : v)
  const f = {}
  for (const cle of CLES_FILTRES) {
    const v = premier(searchParams[cle])
    f[cle] = typeof v === 'string' && v.trim() ? v.trim().slice(0, cle === 'q' ? 100 : 80) : ''
  }

    if (!Object.hasOwn(TRIS, f.tri)) f.tri = ''
  const page = parseInt(premier(searchParams.page), 10)
  f.page = Number.isInteger(page) && page > 1 ? Math.min(page, 1000) : 1
  return f
}

// Construit l'adresse /exercices?… (paramètres vides et page 1 omis)
export function urlExercices(f = {}) {
  const qs = new URLSearchParams()
  for (const cle of CLES_FILTRES) if (f[cle] && !(cle === 'tri' && f[cle] === 'recent')) qs.set(cle, f[cle])
  if (f.page > 1) qs.set('page', String(f.page))
  const texte = qs.toString()
  return texte ? `/exercices?${texte}` : '/exercices'
}

// « de Mathématiques » / « d’Anglais »
export function de(nom) {
  return /^[AEIOUYÀÂÉÈÊÎÔÛH]/i.test(nom) ? `d’${nom}` : `de ${nom}`
}

// Code saisi à la main -> code valide ou null. Accepte « edu-k7m2qx », « K7M2 QX », « K7M2QX ».
const FORMAT_CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/
export function normaliserCode(saisie) {
  const brut = String(saisie || '').toUpperCase().replace(/[\s-]/g, '')
  if (FORMAT_CODE.test(brut)) return brut
  const sansPrefixe = brut.replace(/^EDU/, '')
  return FORMAT_CODE.test(sansPrefixe) ? sansPrefixe : null
}

// Totaux affichés à côté des titres. Même règle que le validateur côté serveur :
// un total indiqué explicitement l'emporte, sinon c'est la somme des éléments inclus.
export function totalQuestion(q) {
  if (q.points != null) return q.points
  if (q.sous_questions) return q.sous_questions.reduce((s, sq) => s + totalQuestion(sq), 0)
  return 0
}

export function totalExercice(ex) {
  if (ex.points != null) return ex.points
  if (ex.questions) return ex.questions.reduce((s, q) => s + totalQuestion(q), 0)
  return 0
}

export function totalPartie(partie) {
  if (partie.points != null) return partie.points
  return partie.exercices.reduce((s, ex) => s + totalExercice(ex), 0)
}

// Numérotation automatique des questions : « 1. », « a) », « i) »
const ROMAINS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
export function etiquetteQuestion(q, index, profondeur) {
  if (q.etiquette) return q.etiquette
  if (profondeur === 0) return `${index + 1}.`
  if (profondeur === 1) return `${String.fromCharCode(97 + (index % 26))})`
  return `${ROMAINS[index] || index + 1})`
}

// Suivi des consultations : une seule fois par contenu et par type pour une même visite.
// Silencieux : une panne du suivi ne doit jamais gêner la lecture.
const dejaSignale = new Set()
export function signaler(code, type) {
   if (typeof window === 'undefined' || !code) return
  const cle = `${code}|${type}`
  if (dejaSignale.has(cle)) return
  dejaSignale.add(cle)
  api.post(`/contenus/${code}/evenements`, { type }).catch(() => {})
}