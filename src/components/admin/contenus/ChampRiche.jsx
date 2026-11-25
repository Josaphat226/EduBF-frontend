'use client'

import { memo, useContext, useRef, useState } from 'react'
import { useEditor, EditorContent, useEditorState, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import Graphique from '@/components/contenus/Graphique'
import { extensionsEduBF, FormuleInline, FormuleBloc, Figure, Graphique as NoeudGraphique, ZoneReponse } from '@/components/contenus/editeur/extensions'
import { nettoyerDocument, preparerPourEditeur } from '@/components/contenus/editeur/nettoyer'
import DialogueFormule from './DialogueFormule'
import DialogueFigure from './DialogueFigure'
import { ContexteMedias } from './contexte'

// ----- Affichage des éléments spéciaux dans l'éditeur -----
const classe = (selected) => `ed-noeud${selected ? ' ed-selectionne' : ''}`

function VueFormule({ node, selected }) {
  const bloc = node.type.name === 'formuleBloc'
  const html = katex.renderToString(node.attrs.latex || '\\square', { displayMode: bloc, throwOnError: false })
  return <NodeViewWrapper as={bloc ? 'div' : 'span'} className={classe(selected)} contentEditable={false} dangerouslySetInnerHTML={{ __html: html }} />
}

function VueFigure({ node, selected }) {
  const base = useContext(ContexteMedias)
  const a = node.attrs
  return (
    <NodeViewWrapper className={`${classe(selected)} ed-figure`} contentEditable={false}>
      {a.src ? <img src={base + a.src} alt={a.alt || ''} style={a.largeur_pct ? { width: `${a.largeur_pct}%` } : undefined} /> : <em>Image manquante</em>}
      {(a.legende || a.credit) && <div className="ed-legende">{[a.legende, a.credit].filter(Boolean).join(' · ')}</div>}
    </NodeViewWrapper>
  )
}

function VueGraphique({ node, selected }) {
  return <NodeViewWrapper className={classe(selected)} contentEditable={false}><Graphique attrs={node.attrs} /></NodeViewWrapper>
}

function VueZone({ node, selected }) {
  return (
    <NodeViewWrapper className={`${classe(selected)} ed-zone`} contentEditable={false}>
      {Array.from({ length: node.attrs.lignes || 3 }, (_, i) => <div key={i} />)}
      <span className="ctn-aide">Zone de réponse ({node.attrs.lignes || 3} lignes, visible à l’impression)</span>
    </NodeViewWrapper>
  )
}

const avecVue = (noeud, Vue) => noeud.extend({ addNodeView() { return ReactNodeViewRenderer(Vue) } })
const EXTENSIONS = extensionsEduBF({
  FormuleInline: avecVue(FormuleInline, VueFormule),
  FormuleBloc: avecVue(FormuleBloc, VueFormule),
  Figure: avecVue(Figure, VueFigure),
  Graphique: avecVue(NoeudGraphique, VueGraphique),
  ZoneReponse: avecVue(ZoneReponse, VueZone),
})

// Options fixes (définies une seule fois, hors du composant)
const PROPS_EDITEUR = { attributes: { class: 'ed-contenu' } }

// État de la barre d'outils avant que l'éditeur ne soit prêt : tout est « éteint »
const ETAT_INITIAL = {
  gras: false, italique: false, souligne: false, indice: false, exposant: false,
  titre: false, puces: false, numeros: false, tableau: false,
  annuler: false, retablir: false, special: null,
}

const Btn = ({ actif, desactive, onClick, titre, children }) => (
  <button type="button" className={`ed-btn${actif ? ' ed-btn-actif' : ''}`} disabled={desactive} title={titre} aria-label={titre}
    onMouseDown={(e) => e.preventDefault()} onClick={onClick}>{children}</button>
)

function ChampRiche({ valeur, onChange }) {
  const [dialogue, setDialogue] = useState(null)
  const rappel = useRef(onChange)
  rappel.current = onChange

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: preparerPourEditeur(valeur),
    immediatelyRender: false,
    editable: true,
    editorProps: PROPS_EDITEUR,
    onUpdate: ({ editor: e }) => rappel.current(nettoyerDocument(e.getJSON())),
  })

  const etatBrut = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null
      const n = e.state.selection.node
      const special = n && ['formuleInline', 'formuleBloc', 'figure'].includes(n.type.name) ? { type: n.type.name, attrs: n.attrs } : null
      return {
        gras: e.isActive('bold'), italique: e.isActive('italic'), souligne: e.isActive('underline'),
        indice: e.isActive('subscript'), exposant: e.isActive('superscript'),
        titre: e.isActive('heading', { level: 3 }), puces: e.isActive('bulletList'), numeros: e.isActive('orderedList'),
        tableau: e.isActive('table'), annuler: e.can().undo(), retablir: e.can().redo(), special,
      }
    },
  })

  // Si l'état n'est pas encore calculé, on utilise l'état « éteint » : l'éditeur reste utilisable
  const etat = etatBrut || ETAT_INITIAL

  if (!editor) return <div className="ed-champ"><div className="ed-contenu" /></div>
  const c = () => editor.chain().focus()

  function validerFormule(latex) {
    const type = dialogue.bloc ? 'formuleBloc' : 'formuleInline'
    if (dialogue.edition) c().updateAttributes(type, { latex }).run()
    else if (dialogue.bloc) c().insererFormuleBloc(latex).run()
    else c().insererFormuleInline(latex).run()
    setDialogue(null)
  }

  function validerFigure(attrs) {
    if (dialogue.edition) c().updateAttributes('figure', attrs).run()
    else c().insererFigure(attrs).run()
    setDialogue(null)
  }

  function modifierSelection() {
    const s = etat.special
    if (s.type === 'figure') setDialogue({ type: 'figure', edition: true, attrs: s.attrs })
    else setDialogue({ type: 'formule', edition: true, bloc: s.type === 'formuleBloc', latex: s.attrs.latex })
  }

  return (
    <div className="ed-champ">
      <div className="ed-barre">
        <Btn titre="Gras" actif={etat.gras} onClick={() => c().toggleBold().run()}><b>G</b></Btn>
        <Btn titre="Italique" actif={etat.italique} onClick={() => c().toggleItalic().run()}><i>I</i></Btn>
        <Btn titre="Souligné" actif={etat.souligne} onClick={() => c().toggleUnderline().run()}><u>S</u></Btn>
        <Btn titre="Indice" actif={etat.indice} onClick={() => c().toggleSubscript().run()}>x₂</Btn>
        <Btn titre="Exposant" actif={etat.exposant} onClick={() => c().toggleSuperscript().run()}>x²</Btn>
        <span className="ed-sep" />
        <Btn titre="Intertitre" actif={etat.titre} onClick={() => c().toggleHeading({ level: 3 }).run()}>Titre</Btn>
        <Btn titre="Liste à puces" actif={etat.puces} onClick={() => c().toggleBulletList().run()}>• Liste</Btn>
        <Btn titre="Liste numérotée" actif={etat.numeros} onClick={() => c().toggleOrderedList().run()}>1. Liste</Btn>
        <span className="ed-sep" />
        <Btn titre="Formule dans le texte" onClick={() => setDialogue({ type: 'formule', bloc: false, latex: '' })}>∑ Formule</Btn>
        <Btn titre="Formule sur sa propre ligne" onClick={() => setDialogue({ type: 'formule', bloc: true, latex: '' })}>∑ Bloc</Btn>
        <Btn titre="Insérer un schéma ou une image" onClick={() => setDialogue({ type: 'figure', attrs: {} })}>🖼 Schéma</Btn>
        <Btn titre="Insérer un tableau" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦ Tableau</Btn>
        <Btn titre="Zone de réponse (lignes à l’impression)" onClick={() => c().insererZoneReponse(3).run()}>Zone</Btn>
        <span className="ed-sep" />
        <Btn titre="Annuler" desactive={!etat.annuler} onClick={() => c().undo().run()}>↶</Btn>
        <Btn titre="Rétablir" desactive={!etat.retablir} onClick={() => c().redo().run()}>↷</Btn>
        {etat.special && <Btn titre="Modifier l’élément sélectionné" onClick={modifierSelection}>✎ Modifier</Btn>}
        {etat.tableau && (
          <>
            <span className="ed-sep" />
            <Btn titre="Ajouter une ligne" onClick={() => c().addRowAfter().run()}>+ ligne</Btn>
            <Btn titre="Ajouter une colonne" onClick={() => c().addColumnAfter().run()}>+ colonne</Btn>
            <Btn titre="Supprimer la ligne" onClick={() => c().deleteRow().run()}>− ligne</Btn>
            <Btn titre="Supprimer la colonne" onClick={() => c().deleteColumn().run()}>− colonne</Btn>
            <Btn titre="Supprimer le tableau" onClick={() => c().deleteTable().run()}>✕ tableau</Btn>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
      {dialogue && dialogue.type === 'formule' && (
        <DialogueFormule bloc={dialogue.bloc} initial={dialogue.latex} onValider={validerFormule} onFermer={() => setDialogue(null)} />
      )}
      {dialogue && dialogue.type === 'figure' && (
        <DialogueFigure initial={dialogue.attrs} onValider={validerFigure} onFermer={() => setDialogue(null)} />
      )}
    </div>
  )
}

// Le texte n'est lu qu'à l'ouverture : l'éditeur ne se redessine que si SON contenu change
export default memo(ChampRiche, (a, b) => a.valeur === b.valeur)