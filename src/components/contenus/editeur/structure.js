// Moteur de structure d'un sujet : ajouter, déplacer, dupliquer, supprimer des parties,
// exercices, questions et sous-questions, sans jamais produire un document invalide.
//
// Toutes les fonctions sont « pures » : elles renvoient un NOUVEAU document et ne modifient
// jamais celui qu'on leur donne (indispensable pour l'état React et l'annulation).
// Les éléments sont désignés par leur identifiant stable (id), jamais par leur position.

const PROFONDEUR_MAX_QUESTIONS = 3 // question > sous-question > sous-sous-question (comme le validateur)

export function nouvelId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export const docVide = () => ({ type: 'doc', content: [] })

export function nouvelleQuestion() {
  return { id: nouvelId(), enonce: docVide() }
}

export function nouvelExercice() {
  return { id: nouvelId(), enonce: docVide() }
}

export function nouvellePartie() {
  return { id: nouvelId(), exercices: [nouvelExercice()] }
}

export function documentVierge() {
  return { version_schema: 1, parties: [nouvellePartie()] }
}

// ---------------------------------------------------------------------------
// Localisation : chemin d'un élément (partie, exercice, question ou annexe) à partir de son id
// ---------------------------------------------------------------------------

const ENFANTS = [
  ['exercices', 'exercice'],
  ['questions', 'question'],
  ['sous_questions', 'question'],
]

// Retourne [{ cle, index }, …] depuis la racine, ou null
export function chemin(doc, id) {
  const chercher = (noeud, pas) => {
    for (const [cle] of ENFANTS) {
      const liste = noeud[cle]
      if (!Array.isArray(liste)) continue
      for (let i = 0; i < liste.length; i++) {
        const etape = [...pas, { cle, index: i }]
        if (liste[i].id === id) return etape
        const plus = chercher(liste[i], etape)
        if (plus) return plus
      }
    }
    for (const annexes of [noeud.annexes]) {
      if (!Array.isArray(annexes)) continue
      for (let i = 0; i < annexes.length; i++) if (annexes[i].id === id) return [...pas, { cle: 'annexes', index: i }]
    }
    return null
  }
  for (let i = 0; i < doc.parties.length; i++) {
    if (doc.parties[i].id === id) return [{ cle: 'parties', index: i }]
    const trouve = chercher(doc.parties[i], [{ cle: 'parties', index: i }])
    if (trouve) return trouve
  }
  return null
}

function lire(doc, etapes) {
  let courant = doc
  for (const { cle, index } of etapes) courant = courant[cle][index]
  return courant
}

// Réécrit le chemin en ne copiant que ce qui change (le reste du document est partagé)
function ecrire(noeud, etapes, transformer) {
  if (etapes.length === 0) return transformer(noeud)
  const [{ cle, index }, ...reste] = etapes
  const liste = noeud[cle].slice()
  liste[index] = ecrire(liste[index], reste, transformer)
  return { ...noeud, [cle]: liste }
}

// Modifie la liste qui CONTIENT l'élément d'id donné (ou la liste enfant d'un parent)
function surListe(doc, etapesParent, cle, transformer) {
  return ecrire(doc, etapesParent, (parent) => {
    const nouvelle = transformer((parent[cle] || []).slice())
    const copie = { ...parent }
    if (nouvelle.length) copie[cle] = nouvelle
    else delete copie[cle]
    return copie
  })
}

export function trouver(doc, id) {
  const etapes = chemin(doc, id)
  return etapes ? lire(doc, etapes) : null
}

// Profondeur d'une question : 0 = question, 1 = sous-question, 2 = sous-sous-question
export function profondeur(doc, id) {
  const etapes = chemin(doc, id)
  if (!etapes) return -1
  return etapes.filter((e) => e.cle === 'questions' || e.cle === 'sous_questions').length - 1
}

export function typeDe(doc, id) {
  const etapes = chemin(doc, id)
  if (!etapes) return null
  const cle = etapes[etapes.length - 1].cle
  return cle === 'parties' ? 'partie' : cle === 'exercices' ? 'exercice' : cle === 'annexes' ? 'annexe' : 'question'
}

// ---------------------------------------------------------------------------
// Modification d'un élément (texte, points, titre…). Une valeur undefined supprime le champ.
// ---------------------------------------------------------------------------

// Champs que chaque type d'élément accepte (le reste serait refusé par le format) :
// un champ hors de cette liste est ignoré, ce qui protège contre une erreur de l'interface.
const CHAMPS_AUTORISES = {
  partie: ['titre', 'consignes', 'annexes', 'duree_minutes', 'points', 'exercices'],
  exercice: ['etiquette', 'titre', 'enonce', 'annexes', 'duree_minutes', 'points', 'questions', 'corrige'],
  question: ['etiquette', 'enonce', 'points', 'verification', 'sous_questions', 'corrige'],
  annexe: ['titre', 'source', 'doc'],
}

export function modifier(doc, id, patch) {
  const etapes = chemin(doc, id)
  if (!etapes) return doc
  const autorises = CHAMPS_AUTORISES[typeDe(doc, id)]
  return ecrire(doc, etapes, (noeud) => {
    const copie = { ...noeud }
    for (const [cle, valeur] of Object.entries(patch)) {
      if (!autorises.includes(cle)) continue
      if (valeur === undefined || valeur === null || valeur === '') delete copie[cle]
      else copie[cle] = valeur
    }
    return copie
  })
}

// ---------------------------------------------------------------------------
// Ajout
// ---------------------------------------------------------------------------

export function ajouterPartie(doc, apresId = null) {
  const nouvelle = nouvellePartie()
  const parties = doc.parties.slice()
  const i = apresId ? parties.findIndex((p) => p.id === apresId) : -1
  parties.splice(i >= 0 ? i + 1 : parties.length, 0, nouvelle)
  return { ...doc, parties }
}

export function ajouterExercice(doc, partieId, apresId = null) {
  const etapes = chemin(doc, partieId)
  if (!etapes || typeDe(doc, partieId) !== 'partie') return doc
  return surListe(doc, etapes, 'exercices', (liste) => {
    const i = apresId ? liste.findIndex((e) => e.id === apresId) : -1
    liste.splice(i >= 0 ? i + 1 : liste.length, 0, nouvelExercice())
    return liste
  })
}

// Ajoute une question à un exercice, ou une sous-question à une question (3 niveaux maximum)
export function ajouterQuestion(doc, parentId, apresId = null) {
  const etapes = chemin(doc, parentId)
  if (!etapes) return doc
  const type = typeDe(doc, parentId)
  let cle
  if (type === 'exercice') cle = 'questions'
  else if (type === 'question') {
    if (profondeur(doc, parentId) + 1 >= PROFONDEUR_MAX_QUESTIONS) return doc
    cle = 'sous_questions'
  } else return doc
  const avec = surListe(doc, etapes, cle, (liste) => {
    const i = apresId ? liste.findIndex((q) => q.id === apresId) : -1
    liste.splice(i >= 0 ? i + 1 : liste.length, 0, nouvelleQuestion())
    return liste
  })
  // Un parent n'a pas de points à lui : son total est la somme de ses enfants (sinon le serveur refuse le sujet)
  return lire(doc, etapes).points != null ? modifier(avec, parentId, { points: undefined }) : avec
}

export function peutAjouterSousQuestion(doc, questionId) {
  return typeDe(doc, questionId) === 'question' && profondeur(doc, questionId) + 1 < PROFONDEUR_MAX_QUESTIONS
}

export function ajouterAnnexe(doc, id) {
  const type = typeDe(doc, id)
  if (type !== 'partie' && type !== 'exercice') return doc
  const etapes = chemin(doc, id)
  return surListe(doc, etapes, 'annexes', (liste) => {
    liste.push({ id: nouvelId(), titre: 'Document', doc: docVide() })
    return liste
  })
}

// Un corrigé existe d'abord sous la forme d'une réponse vide à remplir
export function ajouterCorrige(doc, id) {
  const noeud = trouver(doc, id)
  const type = typeDe(doc, id)
  if (!noeud || noeud.corrige || (type !== 'exercice' && type !== 'question')) return doc // ni partie, ni annexe
  return modifier(doc, id, { corrige: { reponse_attendue: docVide() } })
}

export function retirerCorrige(doc, id) {
  return modifier(doc, id, { corrige: undefined })
}

// ---------------------------------------------------------------------------
// Saisie des points : seulement sur les « feuilles » (question sans sous-question, exercice sans
// question). Le total d'un parent est toujours calculé, jamais saisi.
// ---------------------------------------------------------------------------

export function peutDefinirPoints(doc, id) {
  const type = typeDe(doc, id)
  const noeud = trouver(doc, id)
  if (!noeud) return false
  if (type === 'question') return !noeud.sous_questions
  if (type === 'exercice') return !noeud.questions
  return false
}

// Points valides : positifs, multiples de 0,25, 1000 au plus (même règle que le format)
export function pointsValides(valeur) {
  const n = Number(valeur)
  return Number.isFinite(n) && n >= 0 && n <= 1000 && Math.abs(n * 4 - Math.round(n * 4)) < 1e-9
}

// Renvoie le document inchangé si l'élément n'est pas une feuille ou si la valeur est invalide.
// Une valeur vide retire les points.
export function definirPoints(doc, id, valeur) {
  if (!peutDefinirPoints(doc, id)) return doc
  if (valeur === '' || valeur === null || valeur === undefined) return modifier(doc, id, { points: undefined })
  if (!pointsValides(valeur)) return doc
  return modifier(doc, id, { points: Number(valeur) })
}

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

export function peutSupprimer(doc, id) {
  const etapes = chemin(doc, id)
  if (!etapes) return false
  const dernier = etapes[etapes.length - 1]
  if (dernier.cle === 'parties') return doc.parties.length > 1
  if (dernier.cle === 'exercices') return lire(doc, etapes.slice(0, -1)).exercices.length > 1
  return true // questions, sous-questions et annexes peuvent toujours être retirées
}

export function supprimer(doc, id) {
  if (!peutSupprimer(doc, id)) return doc
  const etapes = chemin(doc, id)
  const { cle, index } = etapes[etapes.length - 1]
  const parent = etapes.slice(0, -1)
  const apres = surListe(doc, parent, cle, (liste) => { liste.splice(index, 1); return liste })
  return corrigerExercice(apres, parent)
}

// Un exercice doit avoir un énoncé ou des questions : s'il n'a plus de questions, on lui redonne un énoncé
function corrigerExercice(doc, etapesParent) {
  if (etapesParent.length === 0) return doc
  const parent = lire(doc, etapesParent)
  const dernier = etapesParent[etapesParent.length - 1]
  if (dernier.cle === 'exercices' && !parent.enonce && !parent.questions) {
    return ecrire(doc, etapesParent, (ex) => ({ ...ex, enonce: docVide() }))
  }
  return doc
}

// ---------------------------------------------------------------------------
// Déplacement et duplication
// ---------------------------------------------------------------------------

export function peutDeplacer(doc, id, sens) {
  const etapes = chemin(doc, id)
  if (!etapes) return false
  const { cle, index } = etapes[etapes.length - 1]
  const parent = etapes.length === 1 ? doc : lire(doc, etapes.slice(0, -1))
  const taille = parent[cle].length
  return sens === 'haut' ? index > 0 : index < taille - 1
}

export function deplacer(doc, id, sens) {
  if (!peutDeplacer(doc, id, sens)) return doc
  const etapes = chemin(doc, id)
  const { cle, index } = etapes[etapes.length - 1]
  const cible = sens === 'haut' ? index - 1 : index + 1
  return surListe(doc, etapes.slice(0, -1), cle, (liste) => {
    ;[liste[index], liste[cible]] = [liste[cible], liste[index]]
    return liste
  })
}

// Copie profonde avec de NOUVEAUX identifiants pour l'élément et tout ce qu'il contient
// (sinon deux éléments auraient le même id, ce que le validateur refuse)
export function cloner(noeud) {
  const copie = (x) => {
    if (Array.isArray(x)) return x.map(copie)
    if (x && typeof x === 'object') {
      const sortie = {}
      for (const [k, v] of Object.entries(x)) sortie[k] = k === 'id' && typeof v === 'string' ? nouvelId() : copie(v)
      return sortie
    }
    return x
  }
  const c = copie(noeud)
  // Les réponses d'un QCM font référence aux identifiants de leurs propositions : on garde le lien
  if (noeud.verification && noeud.verification.mode === 'qcm') {
    const table = new Map(noeud.verification.propositions.map((p, i) => [p.id, c.verification.propositions[i].id]))
    c.verification.correctes = noeud.verification.correctes.map((id) => table.get(id) || id)
  }
  for (const [cle] of ENFANTS) {
    if (Array.isArray(noeud[cle])) c[cle] = noeud[cle].map((enfant) => cloner(enfant))
  }
  return c
}

export function dupliquer(doc, id) {
  const etapes = chemin(doc, id)
  if (!etapes) return doc
  const original = lire(doc, etapes)
  const { cle, index } = etapes[etapes.length - 1]
  const copie = cloner(original)
  if (original.titre) copie.titre = `${original.titre} (copie)`
  return surListe(doc, etapes.slice(0, -1), cle, (liste) => { liste.splice(index + 1, 0, copie); return liste })
}

// ---------------------------------------------------------------------------
// Points : même règle que le serveur (un total indiqué l'emporte sur la somme des éléments)
// ---------------------------------------------------------------------------

function totalQuestion(q) {
  if (q.points != null) return q.points
  return (q.sous_questions || []).reduce((s, sq) => s + totalQuestion(sq), 0)
}
function totalExercice(ex) {
  if (ex.points != null) return ex.points
  return (ex.questions || []).reduce((s, q) => s + totalQuestion(q), 0)
}
function totalPartie(p) {
  if (p.points != null) return p.points
  return p.exercices.reduce((s, ex) => s + totalExercice(ex), 0)
}

export function totalDocument(doc) {
  return doc.parties.reduce((s, p) => s + totalPartie(p), 0)
}

// Le barème total de l'en-tête est TOUJOURS la somme des points : l'auteur ne le saisit jamais,
// il ne peut donc pas devenir faux (le serveur refuse un total différent de la somme).
// Renvoie le même document (même référence) s'il n'y a rien à changer.
export function synchroniserBareme(doc) {
  const total = totalDocument(doc)
  const actuel = doc.entete ? doc.entete.bareme_total : undefined
  if (total > 0 ? actuel === total : actuel === undefined) return doc
  const entete = { ...(doc.entete || {}) }
  if (total > 0) entete.bareme_total = total
  else delete entete.bareme_total
  const sortie = { ...doc }
  if (Object.keys(entete).length) sortie.entete = entete
  else delete sortie.entete
  return sortie
}

// ---------------------------------------------------------------------------
// Plan du document (menu de navigation de l'éditeur)
// ---------------------------------------------------------------------------

const ROMAINS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
export function plan(doc) {
  const lignes = []
  const etiquette = (q, i, p) => q.etiquette || (p === 0 ? `Question ${i + 1}` : p === 1 ? `${String.fromCharCode(97 + (i % 26))})` : `${ROMAINS[i] || i + 1})`)
  const questions = (liste, p, prefixe) => (liste || []).forEach((q, i) => {
    const libelle = `${prefixe} › ${etiquette(q, i, p)}`
    lignes.push({ id: q.id, type: 'question', profondeur: p + 2, libelle, court: etiquette(q, i, p) })
    questions(q.sous_questions, p + 1, libelle)
  })
  doc.parties.forEach((partie, i) => {
    const lp = partie.titre ? `Partie ${i + 1} (${partie.titre})` : `Partie ${i + 1}`
    lignes.push({ id: partie.id, type: 'partie', profondeur: 0, libelle: lp, court: `Partie ${i + 1}` })
    partie.exercices.forEach((ex, j) => {
      const court = ex.etiquette || `Exercice ${j + 1}`
      const le = `${lp} › ${court}`
      lignes.push({ id: ex.id, type: 'exercice', profondeur: 1, libelle: le, court })
      questions(ex.questions, 0, le)
    })
  })
  return lignes
}

// Tous les identifiants du document (pour vérifier l'unicité dans les tests et l'éditeur)
export function tousLesIds(doc) {
  const ids = []
  const parcourir = (x) => {
    if (Array.isArray(x)) return x.forEach(parcourir)
    if (x && typeof x === 'object') {
      if (typeof x.id === 'string') ids.push(x.id)
      Object.values(x).forEach(parcourir)
    }
  }
  parcourir(doc)
  return ids
}