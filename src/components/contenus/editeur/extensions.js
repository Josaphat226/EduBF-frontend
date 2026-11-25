// Éditeur de texte riche EduBF : TipTap restreint au format des contenus (schema-v1.json).
//
// Ce que l'éditeur sait faire = ce que le format sait stocker, rien de plus :
//   marques : gras, italique, souligné, indice, exposant
//   blocs   : paragraphe, titres (niveaux 3 et 4), listes, citation, trait, tableaux
//   EduBF   : formule (en ligne ou en bloc), figure, graphique, zone de réponse
// Pas de code, de barré, de lien ni d'image libre : même collés depuis Word ou le web,
// ils sont ignorés par le schéma de l'éditeur.

import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

const attrTexte = (nom, defaut = null) => ({
  default: defaut,
  parseHTML: (el) => el.getAttribute(`data-${nom}`) ?? defaut,
  renderHTML: (attrs) => (attrs[nom] == null || attrs[nom] === '' ? {} : { [`data-${nom}`]: String(attrs[nom]) }),
})

const attrNombre = (nom, defaut = null) => ({
  default: defaut,
  parseHTML: (el) => {
    const n = parseInt(el.getAttribute(`data-${nom}`), 10)
    return Number.isFinite(n) ? n : defaut
  },
  renderHTML: (attrs) => (attrs[nom] == null ? {} : { [`data-${nom}`]: String(attrs[nom]) }),
})

const attrJson = (nom) => ({
  default: null,
  parseHTML: (el) => {
    try { return JSON.parse(el.getAttribute(`data-${nom}`)) } catch { return null }
  },
  renderHTML: (attrs) => (attrs[nom] == null ? {} : { [`data-${nom}`]: JSON.stringify(attrs[nom]) }),
})

export const FormuleInline = Node.create({
  name: 'formuleInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() { return { latex: attrTexte('latex', '') } },
  parseHTML() { return [{ tag: 'span[data-formule-inline]' }] },
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-formule-inline': '' }), node.attrs.latex]
  },
  addCommands() {
    return {
      insererFormuleInline: (latex) => ({ commands }) => commands.insertContent({ type: this.name, attrs: { latex } }),
    }
  },
})

export const FormuleBloc = Node.create({
  name: 'formuleBloc',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() { return { latex: attrTexte('latex', '') } },
  parseHTML() { return [{ tag: 'div[data-formule-bloc]' }] },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-formule-bloc': '' }), node.attrs.latex]
  },
  addCommands() {
    return {
      insererFormuleBloc: (latex) => ({ commands }) => commands.insertContent({ type: this.name, attrs: { latex } }),
    }
  },
})

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: attrTexte('src'),
      alt: attrTexte('alt'),
      legende: attrTexte('legende'),
      credit: attrTexte('credit'),
      largeur_pct: attrNombre('largeur_pct'),
    }
  },
  parseHTML() { return [{ tag: 'figure[data-figure]' }] },
  renderHTML({ HTMLAttributes }) { return ['figure', mergeAttributes(HTMLAttributes, { 'data-figure': '' })] },
  addCommands() {
    return { insererFigure: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }) }
  },
})

export const Graphique = Node.create({
  name: 'graphique',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      graphique_type: attrTexte('graphique_type', 'barres'),
      titre: attrTexte('titre'),
      axe_x: attrJson('axe_x'),
      axe_y: attrJson('axe_y'),
      series: attrJson('series'),
    }
  },
  parseHTML() { return [{ tag: 'div[data-graphique]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-graphique': '' })] },
  addCommands() {
    return { insererGraphique: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }) }
  },
})

export const ZoneReponse = Node.create({
  name: 'zoneReponse',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() { return { lignes: attrNombre('lignes', 3) } },
  parseHTML() { return [{ tag: 'div[data-zone-reponse]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-zone-reponse': '' })] },
  addCommands() {
    return { insererZoneReponse: (lignes = 3) => ({ commands }) => commands.insertContent({ type: this.name, attrs: { lignes } }) }
  },
})

// Les extensions de l'éditeur. `surcharges` permet à la couche React d'attacher l'affichage
// des nœuds propres à EduBF (formule rendue par KaTeX, aperçu d'image…) :
//   extensionsEduBF({ FormuleInline: FormuleInline.extend({ addNodeView() { … } }) })
export function extensionsEduBF(surcharges = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [3, 4] },
      code: false,
      codeBlock: false,
      strike: false,
      link: false,
    }),
    Subscript,
    Superscript,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    surcharges.FormuleInline || FormuleInline,
    surcharges.FormuleBloc || FormuleBloc,
    surcharges.Figure || Figure,
    surcharges.Graphique || Graphique,
    surcharges.ZoneReponse || ZoneReponse,
  ]
}