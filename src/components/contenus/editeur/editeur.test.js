// @vitest-environment jsdom
import { test, describe } from 'vitest'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Editor } from '@tiptap/core'
import { extensionsEduBF } from './extensions.js'
import { nettoyerDocument, preparerPourEditeur } from './nettoyer.js'

// Ces tests vérifient que ce que produit l'éditeur est accepté par le serveur : ils utilisent le
// validateur du backend (dossier EduBF_Backend voisin de EduBF-frontend). S'il est absent, ces tests sont ignorés.
// Lancer depuis le dossier EduBF-frontend : npx vitest run
const CHEMIN_VALIDATEUR = path.resolve(process.cwd(), '../EduBF_Backend/services/contenus/validation.js')
const CHEMIN_EXEMPLE = path.resolve(process.cwd(), '../EduBF_Backend/services/contenus/exemples/exemple-exercice-3e.json')
const serveurPresent = fs.existsSync(CHEMIN_VALIDATEUR) && fs.existsSync(CHEMIN_EXEMPLE)
const valider = serveurPresent ? createRequire(CHEMIN_VALIDATEUR)(CHEMIN_VALIDATEUR).valider : null
const exemple = serveurPresent ? JSON.parse(fs.readFileSync(CHEMIN_EXEMPLE, 'utf8')) : null
const avecServeur = serveurPresent ? test : test.skip

const copie = (o) => JSON.parse(JSON.stringify(o))
const t = (text, marks) => (marks ? { type: 'text', text, marks: marks.map((m) => ({ type: m })) } : { type: 'text', text })
const p = (...c) => ({ type: 'paragraph', content: c })
const docu = (...c) => ({ type: 'doc', content: c })
const editeur = (contenu) => new Editor({ element: document.createElement('div'), extensions: extensionsEduBF(), content: preparerPourEditeur(contenu) })
const passeParEditeur = (doc) => { const e = editeur(doc); const j = nettoyerDocument(e.getJSON()); e.destroy(); return j }

// Un document complet valide dans lequel on place le texte riche à tester
function dansUnDocument(riche) {
  const d = copie(exemple)
  d.parties[0].exercices[0].enonce = riche
  return d
}

const HASH = 'contenus/' + 'a'.repeat(64) + '.svg'
const tout = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 3 }, content: [t('Rappel de cours')] },
    { type: 'heading', attrs: { level: 4 }, content: [t('Sous-titre')] },
    p(t('Texte '), t('gras', ['bold']), t(' '), t('italique', ['italic']), t(' '), t('souligné', ['underline']), t(' H'), t('2', ['subscript']), t('O, x'), t('2', ['superscript']), t(' '), { type: 'formuleInline', attrs: { latex: '\\sqrt{2}' } }, t(' fin.')),
    p(t('gras et italique', ['bold', 'italic'])),
    p(t('avant'), { type: 'hardBreak' }, t('après')),
    { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('a'))] }, { type: 'listItem', content: [p(t('b'))] }] },
    { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [p(t('trois'))] }, { type: 'listItem', content: [p(t('quatre'))] }] },
    { type: 'blockquote', content: [p(t('Une citation'))] },
    { type: 'horizontalRule' },
    { type: 'formuleBloc', attrs: { latex: '\\frac{a}{b} = c' } },
    { type: 'table', content: [
      { type: 'tableRow', content: [{ type: 'tableHeader', content: [p(t('Élève'))] }, { type: 'tableHeader', content: [p(t('Note'))] }] },
      { type: 'tableRow', content: [{ type: 'tableCell', content: [p(t('Awa'))] }, { type: 'tableCell', content: [p(t('8'))] }] },
    ] },
    { type: 'figure', attrs: { src: HASH, alt: 'Circuit série', legende: 'Figure 1', credit: 'Schéma EduBF', largeur_pct: 70 } },
    { type: 'graphique', attrs: { graphique_type: 'courbe', titre: 'Courbe', axe_x: { label: 'Mois', categories: ['Jan', 'Fév'] }, axe_y: { label: 'T', min: 0, max: 40 }, series: [{ nom: 'S1', valeurs: [30, 33] }] } },
    { type: 'zoneReponse', attrs: { lignes: 4 } },
    p(t('Dernier paragraphe.')),
  ],
}

test('nœuds = exactement ceux du format', () => {
  const e = editeur(); const noeuds = Object.keys(e.schema.nodes).sort(); e.destroy()
  assert.deepEqual(noeuds, ['blockquote', 'bulletList', 'doc', 'figure', 'formuleBloc', 'formuleInline', 'graphique', 'hardBreak', 'heading', 'horizontalRule', 'listItem', 'orderedList', 'paragraph', 'table', 'tableCell', 'tableHeader', 'tableRow', 'text', 'zoneReponse'])
})
test('marques = gras, italique, souligné, indice, exposant (ni code, ni barré, ni lien)', () => {
  const e = editeur(); const marques = Object.keys(e.schema.marks).sort(); e.destroy()
  assert.deepEqual(marques, ['bold', 'italic', 'subscript', 'superscript', 'underline'])
})
test('les raccourcis interdits n’existent pas (barré, code, lien, bloc de code)', () => {
  const e = editeur()
  for (const c of ['toggleStrike', 'toggleCode', 'toggleCodeBlock', 'setLink', 'setImage']) assert.equal(typeof e.commands[c], 'undefined', c)
  e.destroy()
})
test('titres limités aux niveaux 3 et 4', () => {
  const e = editeur(docu(p(t('x'))))
  e.commands.setTextSelection(1)
  assert.equal(e.commands.toggleHeading({ level: 1 }), false)
  assert.equal(e.commands.toggleHeading({ level: 2 }), false)
  assert.equal(e.commands.toggleHeading({ level: 3 }), true)
  assert.equal(e.getJSON().content[0].attrs.level, 3)
  e.destroy()
})

test('document avec TOUS les types de nœuds et de marques', () => {
  assert.deepEqual(passeParEditeur(tout), nettoyerDocument(tout))
})
avecServeur('… et le résultat est accepté par le validateur du serveur', () => {
  const r = valider(dansUnDocument(passeParEditeur(tout)), { pourPublication: true })
  assert.deepEqual(r.erreurs, [], JSON.stringify(r.erreurs))
  assert.equal(r.resume.figures[0], HASH)
})
avecServeur('tous les textes riches de l’exemple réel (énoncés, corrigés, tableau, graphique)', () => {
  let nb = 0
  const parcourir = (x) => {
    if (Array.isArray(x)) return x.forEach(parcourir)
    if (x && typeof x === 'object') {
      if (x.type === 'doc') { assert.deepEqual(passeParEditeur(x), nettoyerDocument(x)); nb++; return }
      Object.values(x).forEach(parcourir)
    }
  }
  parcourir(exemple)
  assert.ok(nb > 20, `seulement ${nb} documents trouvés`)
})
test('un texte vide (content: []) reste vide', () => {
  assert.deepEqual(passeParEditeur({ type: 'doc', content: [] }), { type: 'doc', content: [] })
})
test('le paragraphe vide que l’éditeur ajoute après une figure n’est pas enregistré', () => {
  const e = editeur(docu(p(t('Texte'))))
  e.commands.focus('end')
  e.commands.insererFigure({ src: HASH, alt: 'Circuit' })
  const brut = e.getJSON().content.map((n) => n.type)
  assert.equal(brut.at(-1), 'paragraph') // preuve : l'éditeur a bien ajouté un paragraphe pour pouvoir continuer à écrire
  const propre = nettoyerDocument(e.getJSON()).content.map((n) => n.type)
  e.destroy()
  assert.equal(propre.at(-1), 'figure') // ... et il n'est pas enregistré
})

avecServeur('code, barré, lien, image, script : ignorés ; le texte est conservé', () => {
  const e = new Editor({ element: document.createElement('div'), extensions: extensionsEduBF() })
  e.commands.setContent('<h1>Titre un</h1><h3>Titre trois</h3><p><strong>gras</strong> <s>barré</s> <code>code</code> <a href="http://exemple.org">lien</a> <img src="x.png" alt="i"> <u>sous</u></p><pre>bloc de code</pre><script>alert(1)</script><p onclick="alert(2)" style="color:red">style</p>')
  const doc = nettoyerDocument(e.getJSON()); e.destroy()
  const json = JSON.stringify(doc)
  assert.doesNotMatch(json, /strike|"code"|codeBlock|link|image|script|onclick|alert|href|http/)
  for (const mot of ['Titre un', 'Titre trois', 'gras', 'barré', 'code', 'lien', 'sous', 'bloc de code', 'style']) assert.ok(json.includes(mot), `texte perdu : ${mot}`)
  assert.deepEqual(doc.content.filter((n) => n.type === 'heading').map((n) => n.attrs.level), [3])
  const r = valider(dansUnDocument(doc))
  assert.deepEqual(r.erreurs, [], JSON.stringify(r.erreurs))
})
avecServeur('un tableau collé reste un tableau valide', () => {
  const e = new Editor({ element: document.createElement('div'), extensions: extensionsEduBF() })
  e.commands.setContent('<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>')
  const doc = nettoyerDocument(e.getJSON()); e.destroy()
  assert.equal(doc.content[0].type, 'table')
  assert.equal(doc.content[0].content[0].content[0].type, 'tableHeader')
  assert.deepEqual(valider(dansUnDocument(doc)).erreurs, [])
})

avecServeur('insérer un tableau 3×3 avec en-tête', () => {
  const e = editeur(docu(p(t('x'))))
  e.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
  const doc = nettoyerDocument(e.getJSON()); e.destroy()
  const table = doc.content.find((n) => n.type === 'table')
  assert.equal(table.content.length, 3)
  assert.deepEqual(table.content[0].content.map((c) => c.type), ['tableHeader', 'tableHeader', 'tableHeader'])
  assert.equal(JSON.stringify(doc).includes('colwidth'), false)
  assert.deepEqual(valider(dansUnDocument(doc)).erreurs, [])
})
avecServeur('insérer formule en ligne, formule en bloc, figure, graphique, zone de réponse', () => {
  const e = editeur(docu(p(t('Texte'))))
  const alaFin = () => e.commands.focus('end') // la vraie interface replace le curseur après chaque insertion
  alaFin(); e.commands.insererFormuleInline('x^2')
  alaFin(); e.commands.insererFormuleBloc('\\frac{1}{2}')
  alaFin(); e.commands.insererFigure({ src: HASH, alt: 'Circuit', legende: null })
  alaFin(); e.commands.insererGraphique({ graphique_type: 'barres', titre: 'G', axe_x: null, axe_y: { label: '', min: null }, series: [{ nom: 'A', valeurs: [1, 2, 3] }] })
  alaFin(); e.commands.insererZoneReponse(2)
  const doc = nettoyerDocument(e.getJSON()); e.destroy()
  const types = doc.content.map((n) => n.type)
  for (const requis of ['formuleBloc', 'figure', 'graphique', 'zoneReponse']) assert.ok(types.includes(requis), requis)
  assert.ok(JSON.stringify(doc.content[0]).includes('"formuleInline"'))
  const fig = doc.content.find((n) => n.type === 'figure')
  assert.deepEqual(fig.attrs, { src: HASH, alt: 'Circuit' }) // legende null retirée
  const graph = doc.content.find((n) => n.type === 'graphique')
  assert.deepEqual(graph.attrs, { graphique_type: 'barres', titre: 'G', series: [{ nom: 'A', valeurs: [1, 2, 3] }] }) // axes vides retirés
  assert.equal(doc.content.find((n) => n.type === 'zoneReponse').attrs.lignes, 2)
  assert.deepEqual(valider(dansUnDocument(doc)).erreurs, [])
})
test('annuler / rétablir', () => {
  const e = editeur(docu(p(t('base'))))
  e.commands.focus('end'); e.commands.insererFormuleBloc('x')
  assert.ok(e.getJSON().content.some((n) => n.type === 'formuleBloc'))
  e.commands.undo()
  assert.ok(!e.getJSON().content.some((n) => n.type === 'formuleBloc'))
  e.commands.redo()
  assert.ok(e.getJSON().content.some((n) => n.type === 'formuleBloc'))
  e.destroy()
})

test('valeurs nulles, vides et attributs inconnus retirés', () => {
  const sale = { type: 'doc', content: [
    { type: 'orderedList', attrs: { start: 1, type: null }, content: [{ type: 'listItem', content: [p(t('a'))] }] },
    { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', attrs: { colspan: 1, rowspan: 1, colwidth: null }, content: [p(t('x'))] }, { type: 'tableCell', attrs: { colspan: 2, rowspan: 1, colwidth: null }, content: [p(t('y'))] }] }] },
    { type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text: 'a', marks: [{ type: 'bold', attrs: { x: 1 } }] }, { type: 'text', text: '' }] },
    { type: 'figure', attrs: { src: HASH, alt: 'a', legende: '', credit: null, largeur_pct: null, url: 'https://x' } },
  ] }
  const n = nettoyerDocument(sale)
  assert.equal(n.content[0].attrs, undefined)
  assert.equal(n.content[1].content[0].content[0].attrs, undefined)
  assert.deepEqual(n.content[1].content[0].content[1].attrs, { colspan: 2 })
  assert.deepEqual(n.content[2], { type: 'paragraph', content: [{ type: 'text', text: 'a', marks: [{ type: 'bold' }] }] })
  assert.deepEqual(n.content[3], { type: 'figure', attrs: { src: HASH, alt: 'a' } })
})
test('idempotent : nettoyer deux fois = nettoyer une fois', () => {
  assert.deepEqual(nettoyerDocument(nettoyerDocument(tout)), nettoyerDocument(tout))
})
test('document absent ou invalide : résultat vide mais valide', () => {
  assert.deepEqual(nettoyerDocument(null), { type: 'doc', content: [] })
  assert.deepEqual(nettoyerDocument({}), { type: 'doc', content: [] })
  assert.deepEqual(preparerPourEditeur(undefined), { type: 'doc', content: [{ type: 'paragraph' }] })
})

