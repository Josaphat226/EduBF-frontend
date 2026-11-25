// Import d'un sujet par copier-coller (typiquement un sujet rédigé par une IA).
//
// Le texte suit un format Markdown simplifié, décrit dans CONSIGNE_IA ci-dessous :
//   # Partie I : titre            → une partie
//   ## Exercice 1 : titre (4 pts) → un exercice
//   1. Question (2 pts)           → question ; a) sous-question ; i) sous-sous-question
//   Corrigé : …                   → corrigé de la question (ou de l'exercice) qui précède
//   $x^2$ et $$\frac{a}{b}$$      → formules LaTeX (en ligne / sur leur propre ligne)
//
// analyserSujet() ne touche à rien : il renvoie des parties au format de stockage (schema-v1.json),
// un résumé et des avertissements. integrerSujet() les place dans le document en cours d'édition.
// Tout ce que l'analyseur ne comprend pas reste du texte : rien n'est jamais perdu.

import { nouvelId, pointsValides, totalDocument } from './structure.js'

// ---------------------------------------------------------------------------
// Consigne à donner à l'IA
// ---------------------------------------------------------------------------

export const CONSIGNE_IA = `Écris le sujet demandé, sans les corrigés, sous cette forme :

Exercice 1 : titre (10 points)
1. première question
2. deuxième question
a) sous-question
b) sous-question

Exercice 2 : titre (10 points)
...

Règles :
- Numérote les questions 1., 2., 3. puis les sous-questions a), b), c).
- Si un exercice a plusieurs sections, appelle-les « A. titre », « B. titre », et recommence les questions à 1. dans chaque section.
- Écris les formules en LaTeX : \\( ... \\) dans une phrase, \\[ ... \\] sur une ligne seule.
- Pas de durée, pas d'année scolaire, pas de nom d'établissement.

Voici ma demande : `

// Seconde consigne, à donner à l'IA dans la même conversation une fois le sujet obtenu
export const CONSIGNE_CORRIGE = `Écris maintenant le corrigé complet de ce sujet, avec exactement la même numérotation :

Corrigé de l'exercice 1
A. titre de la section (s'il y en a dans le sujet)
1. réponse détaillée
2. réponse détaillée

Corrigé de l'exercice 2
1. réponse détaillée
...

Règles :
- Une réponse pour chaque question, dans le même ordre que le sujet.
- Formules en LaTeX : \\( ... \\) dans une phrase, \\[ ... \\] sur une ligne seule.
- Dans la résolution, n'utilise pas de numéros « 1. » ni de lettres « a) » (ils seraient pris pour de nouvelles questions) : écris des phrases ou des tirets « - ».`

// ---------------------------------------------------------------------------
// Texte riche : lignes de texte → nœuds du format (paragraphes, formules, tableaux…)
// ---------------------------------------------------------------------------

const MOTIF_INLINE = /\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\\n])+?)\$|\\\(([\s\S]+?)\\\)|\*\*([\s\S]+?)\*\*|\*([^\s*](?:[^*\n]*?[^\s*])?)\*/g

function fusionner(sortie, noeud) {
  const dernier = sortie[sortie.length - 1]
  if (noeud.type === 'text' && dernier && dernier.type === 'text' && JSON.stringify(dernier.marks || []) === JSON.stringify(noeud.marks || [])) {
    dernier.text += noeud.text
  } else {
    sortie.push(noeud)
  }
}

function texteAvecMarques(texte, marques) {
  const noeud = { type: 'text', text: texte }
  if (marques.length) noeud.marks = marques.map((type) => ({ type }))
  return noeud
}

// Texte d'une ligne → nœuds en ligne (texte, gras, italique, formules)
export function inline(texte, marques = []) {
  const sortie = []
  const motif = new RegExp(MOTIF_INLINE.source, 'g')
  let dernier = 0
  let m
  while ((m = motif.exec(texte))) {
    const debut = m.index
    // « $ ... $ » avec des espaces à l'intérieur : c'est un signe dollar ordinaire, pas une formule
    if (m[2] !== undefined && /^\s|\s$/.test(m[2])) { motif.lastIndex = debut + 1; continue }
    // « * » collé à un mot (2*3*4) : pas d'italique
    if (m[5] !== undefined) {
      const avant = texte[debut - 1]
      const apres = texte[motif.lastIndex]
      if ((avant && /[\w*]/.test(avant)) || (apres && /[\w*]/.test(apres))) { motif.lastIndex = debut + 1; continue }
    }
    if (debut > dernier) fusionner(sortie, texteAvecMarques(texte.slice(dernier, debut), marques))
    const latex = [m[1], m[2], m[3]].find((v) => v !== undefined)
    if (latex !== undefined) {
      if (latex.trim()) sortie.push({ type: 'formuleInline', attrs: { latex: latex.trim() } })
    } else if (m[4] !== undefined) {
      for (const n of inline(m[4], marques.includes('bold') ? marques : [...marques, 'bold'])) fusionner(sortie, n)
    } else {
      for (const n of inline(m[5], marques.includes('italic') ? marques : [...marques, 'italic'])) fusionner(sortie, n)
    }
    dernier = motif.lastIndex
  }
  if (dernier < texte.length) fusionner(sortie, texteAvecMarques(texte.slice(dernier), marques))
  return sortie
}

// Découpe une ligne de tableau Markdown sur « | », sans couper à l'intérieur d'une formule $...$
function decouperCellules(ligne) {
  let t = ligne.trim()
  if (t.startsWith('|')) t = t.slice(1)
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1)
  const cellules = []
  let courant = ''
  let enMaths = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (c === '\\' && i + 1 < t.length) { courant += c + t[i + 1]; i++; continue }
    if (c === '$') enMaths = !enMaths
    if (c === '|' && !enMaths) { cellules.push(courant.trim()); courant = ''; continue }
    courant += c
  }
  cellules.push(courant.trim())
  return cellules
}

function construireTableau(lignes) {
  const rangs = lignes.map(decouperCellules)
  const estSeparateur = (r) => r.length > 0 && r.every((c) => /^:?-+:?$/.test(c))
  const aEntete = rangs.length > 1 && estSeparateur(rangs[1])
  const donnees = rangs.filter((_, i) => !(aEntete && i === 1))
  const colonnes = Math.max(...donnees.map((r) => r.length))
  const cellule = (texte, type) => {
    const contenu = inline(texte)
    return { type, content: [contenu.length ? { type: 'paragraph', content: contenu } : { type: 'paragraph' }] }
  }
  return {
    type: 'table',
    content: donnees.map((r, i) => ({
      type: 'tableRow',
      content: Array.from({ length: colonnes }, (_, j) => cellule(r[j] || '', aEntete && i === 0 ? 'tableHeader' : 'tableCell')),
    })),
  }
}

const OUVERTURES_MATHS = [['$$', '$$'], ['\\[', '\\]']]

// Lignes de texte → liste de blocs (une ligne non vide = un paragraphe)
export function riche(lignes) {
  const L = lignes.map((l) => l.replace(/\s+$/, ''))
  const blocs = []
  let i = 0
  while (i < L.length) {
    const t = L[i].trim()
    if (!t || /^(-{3,}|\*{3,}|_{3,})$/.test(t)) { i++; continue }

    // Formule sur sa propre ligne : $$ … $$ ou \[ … \], sur une ou plusieurs lignes
    const maths = OUVERTURES_MATHS.find(([ouvre]) => t.startsWith(ouvre))
    if (maths) {
      const [ouvre, ferme] = maths
      const reste = t.slice(ouvre.length)
      if (reste.includes(ferme)) {
        const fin = reste.indexOf(ferme)
        if (!reste.slice(fin + ferme.length).trim()) {
          const latex = reste.slice(0, fin).trim()
          if (latex) blocs.push({ type: 'formuleBloc', attrs: { latex } })
          i++
          continue
        }
      } else {
        const morceaux = [reste]
        let j = i + 1
        while (j < L.length && !L[j].includes(ferme)) { morceaux.push(L[j]); j++ }
        if (j < L.length) {
          morceaux.push(L[j].slice(0, L[j].indexOf(ferme)))
          const latex = morceaux.join('\n').trim()
          if (latex) blocs.push({ type: 'formuleBloc', attrs: { latex } })
          i = j + 1
          continue
        }
      }
    }

    // Tableau
    if (t.startsWith('|')) {
      const bloc = []
      while (i < L.length && L[i].trim().startsWith('|')) { bloc.push(L[i]); i++ }
      blocs.push(construireTableau(bloc))
      continue
    }

    // Liste à puces
    if (/^[-*•]\s+/.test(t)) {
      const items = []
      while (i < L.length && /^[-*•]\s+/.test(L[i].trim())) {
        const contenu = inline(L[i].trim().replace(/^[-*•]\s+/, ''))
        items.push({ type: 'listItem', content: [contenu.length ? { type: 'paragraph', content: contenu } : { type: 'paragraph' }] })
        i++
      }
      blocs.push({ type: 'bulletList', content: items })
      continue
    }

    // Intertitre
    const titre = t.match(/^(#{1,6})\s+(.*)$/)
    if (titre) {
      const contenu = inline(titre[2])
      if (contenu.length) blocs.push({ type: 'heading', attrs: { level: titre[1].length <= 3 ? 3 : 4 }, content: contenu })
      i++
      continue
    }

    // Paragraphe
    const contenu = inline(t.replace(/^>\s?/, ''))
    if (contenu.length) blocs.push({ type: 'paragraph', content: contenu })
    i++
  }
  return blocs
}

const docRiche = (lignes) => ({ type: 'doc', content: riche(lignes) })

// ---------------------------------------------------------------------------
// Reconnaissance de la structure
// ---------------------------------------------------------------------------

const ROMAINS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']
const lettre = (n) => String.fromCharCode(97 + n)

const NON_LETTRE = '(?![A-Za-zÀ-ÿ])'
const RE_PARTIE = new RegExp(`^(?:(premi[èe]re|deuxi[èe]me|seconde|troisi[èe]me|quatri[èe]me|\\d+(?:[èe]re|[èe]me|re|e)?)\\s+partie|partie\\s+([ivx]+|\\d+|[a-d]))${NON_LETTRE}\\s*[:.\\-–—]?\\s*(.*)$`, 'i')
const RE_EXERCICE = new RegExp(`^(exercice|probl[èe]me)\\s*(\\d+|[ivx]+)?${NON_LETTRE}\\s*[:.\\-–—)]?\\s*(.*)$`, 'i')
const RE_EXERCICE_ROMAIN = /^(?:\*\*|__)?(I{1,3}|IV|VI{0,3}|IX|X)\s*[.)](?:\*\*|__)?\s+(.*)$/
const RE_Q_NUM = /^(?:[-*•]\s+)?(?:\*\*|__)?(\d{1,2})\s*[.)](?:\*\*|__)?(?:\s+(.*))?$/
const RE_Q_MOT = new RegExp(`^(?:\\*\\*|__)?question\\s*(\\d{1,2})\\s*[:.)]?(?:\\*\\*|__)?\\s*(.*)$`, 'i')
const RE_Q_LETTRE = /^(?:[-*•]\s+)?(?:\*\*|__)?([a-z]{1,4})\s*[.)](?:\*\*|__)?(?:\s+(.*))?$/
const RE_CORRIGE = /^(corrig[ée]s?|correction|solution)(?:\s+d[ée]taill[ée]e?)?(?:\s+(?:de\s+l['’]\s*exercice|de\s+la\s+question|du\s+probl[èe]me)[^:：]*)?\s*(?:[:：]\s*(.*))?$/i
const RE_SOUS_CORRIGE = /^(r[ée]ponse(?:\s+attendue)?|m[ée]thode|remarque|indication|astuce)\s*[:：]\s*(.*)$/i
// « A. Calcul numérique » : intertitre de section à l'intérieur d'un exercice (la numérotation 1, 2, 3… y recommence)
const RE_SECTION = /^(?:\*\*|__)?([A-H])\s*\.(?:\*\*|__)?\s+(\S.*)$/
// « Corrigé de l'exercice 2 » dans un corrigé séparé : ouvre l'exercice suivant
const RE_CORRIGE_EXO = /^(?:corrig[ée]s?|correction|solution)s?\s+(?:d[eu]\s+)?(?:l['’]\s*)?(?:exercice|probl[èe]me)\s*(\d+|[ivx]+)?\s*(?:[:：]\s*(.*))?$/i
const POINTS_FIN = /\s*[([]\s*(?:sur\s+)?(\d+(?:[.,]\d+)?)\s*(?:points?|pts?)\s*[)\]]\s*[.:;]?\s*$/i

// Un texte trop long, une phrase ou une formule va dans l'énoncé plutôt que dans le titre
const estPhrase = (s) => s.length > 80 || /[.:?!]$/.test(s) || s.includes('$')

// Retire « (2 points) » en fin de ligne
function separerPoints(texte) {
  const m = texte.match(POINTS_FIN)
  if (!m) return { texte, points: null }
  return { texte: texte.slice(0, m.index), points: Number(m[1].replace(',', '.')) }
}

// « **Calculer A** » découpé après l'étiquette laisse un « ** » orphelin : on l'enlève
function equilibrerGras(texte) {
  const n = (texte.match(/\*\*/g) || []).length
  if (n % 2 === 0) return texte
  const i = texte.lastIndexOf('**')
  return texte.slice(0, i) + texte.slice(i + 2)
}

const simplifier = (t) => t.replace(/^(?:>\s*)+/, '').replace(/^#{1,6}\s*/, '').replace(/\*\*|__/g, '').trim()

function ouvertureMaths(t) {
  for (const [ouvre, ferme] of OUVERTURES_MATHS) {
    if (t.startsWith(ouvre) && !t.slice(ouvre.length).includes(ferme)) return ferme
  }
  return null
}

// ---------------------------------------------------------------------------
// Analyse
// ---------------------------------------------------------------------------

// corrigeSeul : le texte est un corrigé complet (même numérotation que le sujet) ; tout ce qui suit
// « 1. », « a) », « Exercice 2 » est alors le corrigé de cet élément, pas son énoncé.
export function analyserSujet(texte, { corrigeSeul = false } = {}) {
  const lignes = String(texte || '').replace(/\r\n?/g, '\n').replace(/\t/g, '  ').replace(/\u00a0/g, ' ').split('\n')
  const avertissements = []
  const intro = []
  const parties = []

  let partie = null
  let exercice = null
  let derniere = null // dernière question créée
  let courant = null // élément qui reçoit le texte (partie, exercice ou question)
  let cibleCorrige = null // élément dont le corrigé est en cours de saisie
  let pile = []
  let seq = { n0: 0, n1: 0, n2: 0 }
  let ferme = null // fin attendue d'une formule sur plusieurs lignes
  let vu = false
  let sectionLettre = null // lettre de la section en cours (A, B…)
  let section = null // intertitre de section en attente de sa première question

  const nouveauCorrige = () => ({ champs: { reponse: [], methode: [], remarque: [], etapes: [] }, champ: 'etapes', etiquete: false })

  // Intertitre de section resté sans question : il est conservé dans l'énoncé de l'exercice
  const viderSection = () => {
    if (section && exercice) exercice.lignes.push(`#### ${section.titre}`, ...section.lignes)
    section = null
  }

  const nouvellePartie = (titre) => {
    viderSection()
    sectionLettre = null
    if (titre && /^(?:le\s+)?sujets?(?:\s+complets?)?$/i.test(titre.trim())) titre = ''
    partie = { titre: titre || undefined, lignes: [], exercices: [] }
    parties.push(partie)
    exercice = null; derniere = null; courant = partie; cibleCorrige = null; pile = []
    seq = { n0: 0, n1: 0, n2: 0 }
  }
  const nouvelExercice = ({ titre, etiquette, points } = {}) => {
    viderSection()
    sectionLettre = null
    if (!partie) nouvellePartie()
    // le texte placé entre le titre de la partie et le premier exercice devient le début de cet exercice
    exercice = { numero: null, titre, etiquette, points: corrigeSeul ? null : (points ?? null), lignes: partie.lignes.splice(0), questions: [], corrige: null }
    partie.exercices.push(exercice)
    derniere = null; courant = exercice; cibleCorrige = null; pile = []
    if (corrigeSeul) { exercice.corrige = nouveauCorrige(); cibleCorrige = exercice }
    seq = { n0: 0, n1: 0, n2: 0 }
  }
  const assurerExercice = () => { if (!exercice) nouvelExercice() }

  const ajouterLigne = (brut) => {
    if (cibleCorrige) {
      const cg = cibleCorrige.corrige
      cg.champs[cg.champ].push(brut)
      if (cg.champ === 'reponse' && brut.trim()) cg.champ = 'etapes'
      return
    }
    if (!courant) { intro.push(brut); return }
    if (courant !== partie && brut.trim()) {
      const { texte: sans, points } = separerPoints(brut)
      if (points !== null && courant.points == null) { courant.points = points; brut = sans }
    }
    courant.lignes.push(brut)
  }

  // « Réponse : … » ne couvre que sa ligne ; la suite du corrigé est la résolution détaillée
  const etiqueter = (corrige, sous) => {
    const nom = sous[1].toLowerCase()
    corrige.champ = nom.startsWith('r') ? 'reponse' : nom.startsWith('m') ? 'methode' : 'remarque'
    corrige.etiquete = true
    if (sous[2]) {
      corrige.champs[corrige.champ].push(sous[2])
      if (corrige.champ === 'reponse') corrige.champ = 'etapes'
    }
  }

  const detecterQuestion = (t) => {
    let m = t.match(RE_Q_NUM) || null
    if (m) {
      const n = parseInt(m[1], 10)
      return n === seq.n0 + 1 ? { niveau: 0, n, reste: m[2] || '' } : null
    }
    m = t.match(RE_Q_MOT)
    if (m) {
      const n = parseInt(m[1], 10)
      return n === seq.n0 + 1 ? { niveau: 0, n, reste: m[2] || '' } : null
    }
    m = t.match(RE_Q_LETTRE)
    if (m) {
      const l = m[1]
      if (pile[0] && l === lettre(seq.n1)) return { niveau: 1, reste: m[2] || '' }
      if (pile[1] && l === ROMAINS[seq.n2]) return { niveau: 2, reste: m[2] || '' }
    }
    return null
  }

  for (const brut of lignes) {
    const t = brut.trim()

    if (ferme) { ajouterLigne(brut); if (brut.includes(ferme)) ferme = null; continue }
    if (!t) { ajouterLigne(''); continue }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { cibleCorrige = null; continue } // un trait met fin au corrigé en cours

    const fin = ouvertureMaths(t)
    if (fin) { vu = true; ajouterLigne(brut); ferme = fin; continue }

    // Titre général du document (première ligne « # … ») : c'est le titre du contenu, géré ailleurs
    if (!vu && /^#{1,6}\s/.test(t) && !RE_PARTIE.test(simplifier(t)) && !RE_EXERCICE.test(simplifier(t))) { vu = true; continue }

    const plain = simplifier(t)

    // Consignes générales étiquetées
    const consignes = plain.match(/^consignes?(?:\s+g[ée]n[ée]rales)?\s*[:：]\s*(.*)$/i)
    if (consignes && !partie && !exercice) { vu = true; if (consignes[1]) intro.push(consignes[1]); continue }

    // Partie
    const p = plain.match(RE_PARTIE)
    if (p && plain.length <= 200) {
      vu = true
      const titre = (p[3] || '').trim()
      nouvellePartie(titre && titre.length <= 200 ? titre : undefined)
      if (titre.length > 200) partie.lignes.push(titre)
      continue
    }

    // Exercice ou problème
    const e = plain.match(RE_EXERCICE)
    const romain = e ? null : t.match(RE_EXERCICE_ROMAIN)
    if (e || romain) {
      vu = true
      const reste = e ? e[3] : romain[2]
      const { texte: sansPoints, points } = separerPoints(reste.trim())
      const mot = e ? e[1].toLowerCase() : ''
      const etiquette = mot.startsWith('probl') ? `Problème${e[2] ? ` ${e[2]}` : ''}`.slice(0, 20) : undefined
      nouvelExercice({ points, etiquette })
      if (e && e[2]) exercice.numero = e[2]
      const propre = equilibrerGras(sansPoints).trim()
      if (propre) {
        if (estPhrase(propre)) exercice.lignes.push(propre)
        else exercice.titre = propre.replace(/\*\*|__/g, '')
      }
      continue
    }

    // Corrigé séparé : « Corrigé de l'exercice 2 » ouvre l'exercice suivant
    const ce = corrigeSeul ? plain.match(RE_CORRIGE_EXO) : null
    if (ce && plain.length <= 160) {
      vu = true
      const dejaOuvert = exercice && ce[1] && exercice.numero && String(exercice.numero).toLowerCase() === ce[1].toLowerCase()
      const vide = exercice && !exercice.questions.length && !riche(exercice.corrige ? exercice.corrige.champs.etapes : []).length
      if (!dejaOuvert && !(exercice && vide && !ce[1])) {
        nouvelExercice()
        exercice.numero = ce[1] || null
      }
      if (ce[2]) exercice.corrige.champs.etapes.push(ce[2])
      continue
    }

    // Corrigé
    const c = plain.match(RE_CORRIGE)
    if (c && plain.length <= 160) {
      vu = true
      let cible = derniere
      if (!cible || /exercice|probl[èe]me/i.test(plain.split(/[:：]/)[0])) { assurerExercice(); cible = exercice }
      if (!cible.corrige) cible.corrige = nouveauCorrige()
      cibleCorrige = cible
      if (c[2]) {
        const sous = c[2].match(RE_SOUS_CORRIGE)
        if (sous) etiqueter(cible.corrige, sous)
        else cible.corrige.champs.etapes.push(c[2])
      }
      continue
    }

    // Étiquettes à l'intérieur d'un corrigé
    if (cibleCorrige) {
      const sous = plain.match(RE_SOUS_CORRIGE)
      if (sous) { etiqueter(cibleCorrige.corrige, sous); continue }
    }

    // Section « A. Titre » : la numérotation des questions recommence
    const sec = t.match(RE_SECTION)
    if (sec && sec[2].length >= 8 && sec[2].length <= 120 && !/\$|\\\(|\\\[/.test(sec[2])) {
      vu = true
      assurerExercice()
      viderSection()
      sectionLettre = sec[1]
      section = { titre: equilibrerGras(sec[2]).replace(/\*\*|__/g, '').trim(), lignes: [], points: 0 }
      seq = { n0: 0, n1: 0, n2: 0 }
      pile = []; derniere = null; cibleCorrige = null; courant = section
      continue
    }

    // Question
    const q = detecterQuestion(t)
    if (q) {
      vu = true
      assurerExercice()
      const Q = { lignes: [], points: null, sous: [], corrige: null }
      if (q.niveau === 0 && sectionLettre) {
        Q.etiquette = `${sectionLettre}.${q.n}`
        if (section) { Q.lignes.push(`#### ${section.titre}`, ...section.lignes); section = null }
      }
      if (q.niveau === 0) { exercice.questions.push(Q); pile = [Q]; seq.n0 = q.n; seq.n1 = 0; seq.n2 = 0 }
      else if (q.niveau === 1) { pile[0].sous.push(Q); pile = [pile[0], Q]; seq.n1++; seq.n2 = 0 }
      else { pile[1].sous.push(Q); pile = [pile[0], pile[1], Q]; seq.n2++ }
      derniere = Q; courant = Q; cibleCorrige = null
      if (corrigeSeul) {
        Q.corrige = nouveauCorrige(); cibleCorrige = Q
        const sous = simplifier(q.reste).match(RE_SOUS_CORRIGE)
        if (sous) { etiqueter(Q.corrige, sous); continue }
      }
      ajouterLigne(equilibrerGras(q.reste))
      continue
    }

    // Texte ordinaire
    vu = true
    ajouterLigne(brut)
  }

  // ----- Construction du résultat -----
  viderSection()
  if (!parties.length && intro.some((l) => l.trim())) {
    // Aucune structure reconnue : le texte devient l'énoncé d'un exercice
    nouvelExercice()
    exercice.lignes = intro.splice(0)
    avertissements.push(corrigeSeul
      ? 'Aucun exercice ni aucune question n’a été reconnu dans le corrigé : tout le texte est traité comme le corrigé d’un seul exercice. Vérifiez que le corrigé reprend la numérotation du sujet.'
      : 'Aucun exercice ni aucune question n’a été reconnu : tout le texte est placé dans l’énoncé d’un seul exercice. Vérifiez le format (voir « Copier la consigne pour l’IA »).')
  }

  let sansCorrige = 0
  const feuilles = (qs) => qs.flatMap((q) => (q.sous_questions ? feuilles(q.sous_questions) : [q]))

  const construireCorrige = (buf) => {
    if (!buf) return undefined
    const c = {}
    const f = buf.champs
    const rep = riche(f.reponse); if (rep.length) c.reponse_attendue = { type: 'doc', content: rep }
    const met = riche(f.methode); if (met.length) c.methode = { type: 'doc', content: met }
    const rem = riche(f.remarque); if (rem.length) c.remarque = { type: 'doc', content: rem }
    const eta = riche(f.etapes)
    if (eta.length) {
      // Une réponse courte (un seul paragraphe) est présentée comme « Réponse », une résolution plus longue comme « Résolution »
      if (!buf.etiquete && eta.length === 1 && eta[0].type === 'paragraph') c.reponse_attendue = { type: 'doc', content: eta }
      else c.etapes = [{ doc: { type: 'doc', content: eta } }]
    }
    return Object.keys(c).length ? c : undefined
  }

  // QCM rédigé « 1. énoncé / a) … b) … c) … d) … / Corrigé : b) » : les propositions restent dans l'énoncé
  const LETTRE_SEULE = /^(?:r[ée]ponse\s*:?\s*)?\**\(?([a-e])\)?\**\.?$/i
  const lignesCorrige = (corrige) => (corrige ? ['reponse', 'methode', 'remarque', 'etapes'].flatMap((k) => corrige.champs[k]).map((l) => l.trim()).filter(Boolean) : [])
  const estQcm = (Q) => {
    const n = Q.sous.length
    if (n < 2 || n > 6 || Q.corrige) return false
    if (!Q.sous.every((s, i) => !s.sous.length && s.points == null && (i === n - 1 || !s.corrige))) return false
    const l = lignesCorrige(Q.sous[n - 1].corrige)
    return l.length === 1 && LETTRE_SEULE.test(l[0])
  }
  const fusionnerQcm = (Q) => {
    Q.sous.forEach((s, i) => {
      const lignes = s.lignes.slice()
      const premier = lignes.findIndex((l) => l.trim())
      if (premier >= 0) lignes[premier] = `${lettre(i)}) ${lignes[premier].trim()}`
      Q.lignes.push(...lignes)
    })
    Q.corrige = Q.sous[Q.sous.length - 1].corrige
    Q.sous = []
  }

  const construireQuestion = (Q, libelle) => {
    if (!corrigeSeul && estQcm(Q)) fusionnerQcm(Q)
    const q = { id: nouvelId(), enonce: docRiche(Q.lignes) }
    if (Q.etiquette) q.etiquette = Q.etiquette
    if (Q.sous.length) {
      q.sous_questions = Q.sous.map((s, i) => construireQuestion(s, `${libelle}.${String.fromCharCode(97 + i)}`))
      if (Q.points != null) avertissements.push(`${libelle} : les points ne sont pas gardés car cette question a des sous-questions (mettez-les sur les sous-questions).`)
    } else if (Q.points != null) {
      if (pointsValides(Q.points)) q.points = Q.points
      else avertissements.push(`${libelle} : « ${Q.points} » n’est pas un nombre de points valide (multiples de 0,25 jusqu’à 1000) ; les points sont ignorés.`)
    }
    const corrige = construireCorrige(Q.corrige)
    if (corrige) q.corrige = corrige
    else if (!Q.sous.length) sansCorrige++
    return q
  }

  // Une partie sans exercice reçoit un exercice vide, rempli avec son texte éventuel
  const partiesFinales = parties
  for (const P of partiesFinales) {
    if (!P.exercices.length) P.exercices.push({ titre: undefined, etiquette: undefined, points: null, lignes: P.lignes.splice(0), questions: [], corrige: null })
  }

  const resultat = partiesFinales.map((P, ip) => {
    const partieFinale = { id: nouvelId(), exercices: [] }
    if (P.titre) partieFinale.titre = P.titre
    partieFinale.exercices = P.exercices.map((E, ie) => {
      const libEx = `Exercice ${ie + 1}${partiesFinales.length > 1 ? ` (partie ${ip + 1})` : ''}`
      const ex = { id: nouvelId() }
      if (E.etiquette) ex.etiquette = E.etiquette
      if (E.titre) ex.titre = E.titre.slice(0, 200)
      ex.enonce = docRiche(E.lignes)
      if (E.questions.length) {
        ex.questions = E.questions.map((Q, i) => construireQuestion(Q, `${libEx}, question ${i + 1}`))
        if (E.points != null) {
          const f = feuilles(ex.questions)
          if (f.some((q) => q.points != null)) {
            avertissements.push(`${libEx} : les points de l’exercice ne sont pas gardés, ceux des questions comptent.`)
          } else if (pointsValides(E.points / f.length)) {
            f.forEach((q) => { q.points = E.points / f.length })
            avertissements.push(`${libEx} : ${E.points} point(s) répartis également entre ses ${f.length} question(s).`)
          } else {
            avertissements.push(`${libEx} : ${E.points} point(s) ne se répartissent pas en multiples de 0,25 sur ${f.length} question(s) ; ils sont ignorés.`)
          }
        }
      } else if (E.points != null) {
        if (pointsValides(E.points)) ex.points = E.points
        else avertissements.push(`${libEx} : points invalides, ignorés.`)
      }
      if (corrigeSeul && E.questions.length) E.corrige = null // le texte avant la question 1 n'est pas un corrigé
      const corrige = construireCorrige(E.corrige)
      if (corrige) ex.corrige = corrige
      else if (!E.questions.length) sansCorrige++
      return ex
    })
    return partieFinale
  })

  if (sansCorrige > 0 && !corrigeSeul) avertissements.push(`${sansCorrige} question(s) ou exercice(s) sans corrigé : le corrigé est nécessaire pour publier, mais vous pouvez l’ajouter ensuite.`)

  const consignesDoc = riche(intro).length ? docRiche(intro) : null
  const json = JSON.stringify(resultat)
  const resume = {
    parties: resultat.length,
    exercices: resultat.reduce((s, p) => s + p.exercices.length, 0),
    questions: (json.match(/"enonce"/g) || []).length - resultat.reduce((s, p) => s + p.exercices.length, 0),
    corriges: (json.match(/"corrige"/g) || []).length,
    formules: (json.match(/"type":"formule(?:Inline|Bloc)"/g) || []).length,
    points: resultat.length ? totalDocument({ parties: resultat }) : 0,
    consignes: Boolean(consignesDoc),
  }
  return { parties: resultat, consignes: consignesDoc, resume, avertissements }
}

// ---------------------------------------------------------------------------
// Sujet et corrigé collés d'un seul bloc : « PARTIE 2 : CORRIGÉS » (ou un titre « # Corrigé ») les sépare
// ---------------------------------------------------------------------------

const RE_SEPARATEUR_PARTIE = /^(?:#{1,6}\s*)?(?:\*\*|__)?\s*partie\s*(?:2|ii|b|deux)\s*[:.\-–—]?\s*(?:les\s+)?corrig[ée]s?\b.*$/i
const RE_SEPARATEUR_TITRE = /^#{1,6}\s*(?:\*\*)?(?:les\s+)?corrig[ée]s?(?:\s+(?:complets?|d[ée]taill[ée]s?))?\s*[:.]?\s*(?:\*\*)?$/i
const RE_SEPARATEUR_MAJ = /^(?:\*\*)?\s*CORRIG[ÉE]S?(?:\s+COMPLETS?)?\s*[:.]?\s*(?:\*\*)?$/

export function separerSujetCorrige(texte) {
  const lignes = String(texte || '').replace(/\r\n?/g, '\n').split('\n')
  for (let i = 1; i < lignes.length; i++) {
    const t = lignes[i].trim()
    const clair = RE_SEPARATEUR_PARTIE.test(t) || RE_SEPARATEUR_TITRE.test(t) || RE_SEPARATEUR_MAJ.test(t)
    if (clair) {
      const avant = lignes.slice(0, i).join('\n')
      const apres = lignes.slice(i + 1).join('\n')
      if (avant.trim() && apres.trim()) return { sujet: avant, corrige: apres }
    }
  }
  return { sujet: String(texte || ''), corrige: '' }
}

// ---------------------------------------------------------------------------
// Association d'un corrigé complet (zone « Corrigé ») aux questions du sujet
// ---------------------------------------------------------------------------

// Les éléments sont associés par leur position : exercice n° k ↔ exercice n° k, question 2 ↔ question 2,
// sous-question b ↔ sous-question b. Le sujet n'est jamais modifié : on renvoie une copie.
export function associerCorriges(analyseSujet, analyseCorrige) {
  const sujet = JSON.parse(JSON.stringify(analyseSujet.parties))
  const lignesCorrige = analyseCorrige.parties
  const exS = sujet.flatMap((p) => p.exercices)
  const exC = lignesCorrige.flatMap((p) => p.exercices)
  const manquants = []
  let associes = 0
  let total = 0

  // Plusieurs corrigés de sous-questions à ranger dans un seul (la question du sujet n'a pas de sous-questions)
  const regrouper = (q, prefixe) => {
    if (!q.sous_questions) return q.corrige ? [{ titre: prefixe, corrige: q.corrige }] : []
    return q.sous_questions.flatMap((s, i) => regrouper(s, `${prefixe}${String.fromCharCode(97 + i)}) `))
  }
  const fusionner = (parts) => {
    const etapes = []
    for (const { titre, corrige } of parts) {
      const docs = []
      if (corrige.reponse_attendue) docs.push(...corrige.reponse_attendue.content)
      for (const e of corrige.etapes || []) docs.push(...e.doc.content)
      if (corrige.methode) docs.push(...corrige.methode.content)
      if (corrige.remarque) docs.push(...corrige.remarque.content)
      if (docs.length) etapes.push({ titre: titre.trim().slice(0, 100), doc: { type: 'doc', content: docs } })
    }
    return etapes.length ? { etapes } : undefined
  }

  const associerQuestion = (qs, qc, libelle) => {
    if (qs.sous_questions) {
      if (qc && qc.sous_questions) {
        qs.sous_questions.forEach((s, i) => associerQuestion(s, qc.sous_questions[i], `${libelle}.${String.fromCharCode(97 + i)}`))
        if (qc.corrige) qs.corrige = qc.corrige // corrigé général de la question, s'il existe
      } else if (qc && qc.corrige) {
        // Un seul corrigé pour toute la question : il est rangé sur la question elle-même
        qs.corrige = qc.corrige
        const n = (function compter(q) { return q.sous_questions ? q.sous_questions.reduce((a, x) => a + compter(x), 0) : 1 })(qs)
        total += n; associes += n
      } else {
        const n = (function compter(q) { return q.sous_questions ? q.sous_questions.reduce((a, x) => a + compter(x), 0) : 1 })(qs)
        total += n
        manquants.push(libelle)
      }
      return
    }
    total++
    if (!qc) { manquants.push(libelle); return }
    const corr = qc.corrige || fusionner(regrouper(qc, ''))
    if (corr) { qs.corrige = corr; associes++ } else manquants.push(libelle)
  }

  exS.forEach((es, i) => {
    const ec = exC[i]
    const lib = `Exercice ${i + 1}`
    if (!es.questions) {
      total++
      if (ec && ec.corrige) { es.corrige = ec.corrige; associes++ }
      else if (ec && ec.questions) {
        const corr = fusionner(ec.questions.flatMap((q, k) => regrouper(q, `${k + 1}. `)))
        if (corr) { es.corrige = corr; associes++ } else manquants.push(lib)
      } else manquants.push(lib)
      return
    }
    if (!ec) { es.questions.forEach((q, k) => associerQuestion(q, undefined, `${lib}, question ${k + 1}`)); return }
    if (!ec.questions && ec.corrige) {
      // Corrigé global de l'exercice : rangé sur l'exercice, toutes ses questions sont couvertes
      es.corrige = ec.corrige
      const n = (function compter(qs) { return qs.reduce((a, q) => a + (q.sous_questions ? compter(q.sous_questions) : 1), 0) })(es.questions)
      total += n; associes += n
      return
    }
    es.questions.forEach((q, k) => associerQuestion(q, ec.questions && ec.questions[k], `${lib}, question ${k + 1}`))
  })

  const enTrop = []
  if (exC.length > exS.length) enTrop.push(`le corrigé contient ${exC.length} exercice(s), le sujet en a ${exS.length} : les exercices en trop sont ignorés`)
  exC.slice(0, exS.length).forEach((ec, i) => {
    const nS = (exS[i].questions || []).length
    const nC = (ec.questions || []).length
    if (nC > nS && nS > 0) enTrop.push(`exercice ${i + 1} : le corrigé a ${nC} question(s), le sujet en a ${nS}`)
  })

  const avertissements = [...analyseCorrige.avertissements.filter((a) => !/sans corrigé/.test(a))]
  if (manquants.length) {
    const liste = manquants.length > 6 ? `${manquants.slice(0, 6).join(' ; ')} ; …` : manquants.join(' ; ')
    avertissements.push(`${total - associes} question(s) sans corrigé : ${liste}.`)
  }
  for (const m of enTrop) avertissements.push(m.charAt(0).toUpperCase() + m.slice(1) + '.')

  return { parties: sujet, consignes: analyseSujet.consignes, resume: { ...analyseSujet.resume, corriges: associes, aAssocier: total }, avertissements: [...analyseSujet.avertissements.filter((a) => !/sans corrigé/.test(a)), ...avertissements], associes, total }
}

// ---------------------------------------------------------------------------
// Intégration dans le document en cours d'édition
// ---------------------------------------------------------------------------

// Document tout juste créé : une partie, un exercice, aucun texte
export function documentEstVide(doc) {
  if (!doc || !Array.isArray(doc.parties) || doc.parties.length !== 1) return false
  const p = doc.parties[0]
  if (p.titre || (p.exercices || []).length !== 1) return false
  const ex = p.exercices[0]
  return !ex.titre && !ex.questions && (!ex.enonce || !ex.enonce.content || ex.enonce.content.length === 0) && !ex.corrige && !(doc.entete && doc.entete.consignes)
}

// mode : 'remplacer' ou 'ajouter' (un document vide est toujours remplacé)
export function integrerSujet(doc, analyse, mode = 'ajouter') {
  const remplacer = mode === 'remplacer' || documentEstVide(doc)
  const sortie = { ...doc, parties: remplacer ? analyse.parties : [...doc.parties, ...analyse.parties] }
  if (analyse.consignes && (remplacer || !(doc.entete && doc.entete.consignes))) {
    sortie.entete = { ...(doc.entete || {}), consignes: analyse.consignes }
  }
  return sortie
}