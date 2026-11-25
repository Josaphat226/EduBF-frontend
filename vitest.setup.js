// jsdom ne sait pas mesurer l'écran : on lui apprend les quelques mesures dont ProseMirror (TipTap) a besoin.
const rectVide = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }
if (typeof Range !== 'undefined') {
  Range.prototype.getBoundingClientRect = () => rectVide
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} })
}
if (typeof document !== 'undefined' && !document.elementFromPoint) document.elementFromPoint = () => null

// Nécessaire pour tester des composants React avec act()
globalThis.IS_REACT_ACT_ENVIRONMENT = true
