// @vitest-environment jsdom
import { test, describe } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import {
  documentVierge, ajouterPartie, ajouterExercice, ajouterQuestion, ajouterAnnexe, ajouterCorrige, retirerCorrige,
  modifier, supprimer, peutSupprimer, deplacer, peutDeplacer, dupliquer, plan, tousLesIds, trouver, profondeur,
  peutAjouterSousQuestion, typeDe, docVide, totalDocument, synchroniserBareme, peutDefinirPoints, definirPoints, pointsValides,
} from './structure.js'

// Utilise le validateur du backend (dossier EduBF_Backend voisin) ; ignoré s'il est absent.
const CHEMIN_VALIDATEUR = path.resolve(process.cwd(), '../EduBF_Backend/services/contenus/validation.js')
const CHEMIN_EXEMPLE = path.resolve(process.cwd(), '../EduBF_Backend/services/contenus/exemples/exemple-exercice-3e.json')
const serveurPresent = fs.existsSync(CHEMIN_VALIDATEUR) && fs.existsSync(CHEMIN_EXEMPLE)
const valider = serveurPresent ? createRequire(CHEMIN_VALIDATEUR)(CHEMIN_VALIDATEUR).valider : null
const exemple = serveurPresent ? JSON.parse(fs.readFileSync(CHEMIN_EXEMPLE, 'utf8')) : null
const avecServeur = serveurPresent ? test : test.skip

const copie = (o) => JSON.parse(JSON.stringify(o))
const gelerProfond = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(gelerProfond) } return o }
const idsUniques = (d) => { const ids = tousLesIds(d); return new Set(ids).size === ids.length }
// Un document est « sain » s'il respecte le format et s'il a la forme minimale attendue
const sain = (d) => {
  const r = valider(d)
  assert.notEqual(r.resume, null, 'format invalide : ' + JSON.stringify(r.erreurs))
  assert.deepEqual(r.erreurs.filter((e) => !/corrigé manquant|aucun point/.test(e.message)), [], JSON.stringify(r.erreurs))
  assert.ok(idsUniques(d), 'identifiants dupliqués')
}
const ids = (d) => ({
  p: d.parties.map((x) => x.id),
  e: d.parties.flatMap((x) => x.exercices.map((y) => y.id)),
})

describe('Création', () => {
  avecServeur('un document vierge est valide', () => {
    const d = documentVierge()
    sain(d)
    assert.equal(d.parties.length, 1)
    assert.equal(d.parties[0].exercices.length, 1)
  })
  test('deux documents vierges n’ont jamais les mêmes identifiants', () => {
    const a = tousLesIds(documentVierge()), b = tousLesIds(documentVierge())
    assert.ok(a.every((x) => !b.includes(x)))
  })
})

describe('Ajout', () => {
  avecServeur('partie, exercice, question, sous-question, sous-sous-question', () => {
    let d = gelerProfond(documentVierge())
    d = ajouterPartie(d)
    assert.equal(d.parties.length, 2)
    const p1 = d.parties[0].id, e1 = d.parties[0].exercices[0].id
    d = ajouterExercice(d, p1)
    assert.equal(d.parties[0].exercices.length, 2)
    d = ajouterQuestion(d, e1)
    const q1 = d.parties[0].exercices[0].questions[0].id
    d = ajouterQuestion(d, q1)
    const q11 = d.parties[0].exercices[0].questions[0].sous_questions[0].id
    d = ajouterQuestion(d, q11)
    const q111 = trouver(d, q11).sous_questions[0].id
    assert.deepEqual([profondeur(d, q1), profondeur(d, q11), profondeur(d, q111)], [0, 1, 2])
    sain(d)
  })
  test('la 4e profondeur est refusée : le document est renvoyé tel quel', () => {
    let d = documentVierge()
    d = ajouterQuestion(d, d.parties[0].exercices[0].id)
    const q1 = d.parties[0].exercices[0].questions[0].id
    d = ajouterQuestion(d, q1)
    const q11 = trouver(d, q1).sous_questions[0].id
    d = ajouterQuestion(d, q11)
    const q111 = trouver(d, q11).sous_questions[0].id
    assert.equal(peutAjouterSousQuestion(d, q11), true)
    assert.equal(peutAjouterSousQuestion(d, q111), false)
    assert.equal(ajouterQuestion(d, q111), d)
  })
  test('insertion à une position précise (après un élément donné)', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = ajouterQuestion(d, e); d = ajouterQuestion(d, e)
    const [a, b] = trouver(d, e).questions.map((q) => q.id)
    d = ajouterQuestion(d, e, a)
    const ordre = trouver(d, e).questions.map((q) => q.id)
    assert.equal(ordre[0], a); assert.equal(ordre[2], b); assert.equal(ordre.length, 3)
  })
  test('ajouter à un parent inconnu ou de mauvais type ne change rien', () => {
    const d = documentVierge()
    assert.equal(ajouterQuestion(d, 'inconnu'), d)
    assert.equal(ajouterQuestion(d, d.parties[0].id), d)   // une partie n'a pas de questions directes
    assert.equal(ajouterExercice(d, d.parties[0].exercices[0].id), d) // un exercice n'est pas une partie
  })
  avecServeur('annexes (partie et exercice) et corrigés', () => {
    let d = documentVierge()
    const p = d.parties[0].id, e = d.parties[0].exercices[0].id
    d = ajouterAnnexe(d, p); d = ajouterAnnexe(d, e)
    assert.equal(d.parties[0].annexes.length, 1); assert.equal(d.parties[0].exercices[0].annexes.length, 1)
    d = ajouterQuestion(d, e)
    const q = d.parties[0].exercices[0].questions[0].id
    d = ajouterCorrige(d, q)
    assert.ok(trouver(d, q).corrige.reponse_attendue)
    assert.equal(ajouterCorrige(d, q), d)             // déjà présent : inchangé
    d = retirerCorrige(d, q)
    assert.equal(trouver(d, q).corrige, undefined)
    assert.equal(typeDe(d, d.parties[0].annexes[0].id), 'annexe')
    sain(d)
  })
})

describe('Modification', () => {
  test('met à jour un champ, supprime un champ vidé, ignore un id inconnu', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = modifier(d, e, { titre: 'Racines', points: 5 })
    assert.deepEqual([trouver(d, e).titre, trouver(d, e).points], ['Racines', 5])
    d = modifier(d, e, { titre: '', points: undefined })
    assert.equal('titre' in trouver(d, e), false); assert.equal('points' in trouver(d, e), false)
    assert.equal(modifier(d, 'inconnu', { titre: 'x' }), d)
  })
  test('ne modifie jamais le document d’origine et partage ce qui n’a pas changé', () => {
    let d = documentVierge()
    d = ajouterPartie(d)
    gelerProfond(d)
    const e0 = d.parties[0].exercices[0].id
    const apres = modifier(d, e0, { titre: 'Nouveau' })
    assert.notEqual(apres, d)
    assert.equal(apres.parties[1], d.parties[1])   // l'autre partie est la MÊME référence (React ne la redessine pas)
    assert.equal(trouver(d, e0).titre, undefined)  // l'original est intact
  })
})

describe('Champs autorisés', () => {
  test('un champ qui n’existe pas pour ce type d’élément est ignoré', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = ajouterQuestion(d, e)
    const q = trouver(d, e).questions[0].id
    const apres = modifier(d, q, { titre: 'Interdit', id: 'autre', inconnu: 1, points: 2 })
    assert.equal('titre' in trouver(apres, q), false)
    assert.equal('inconnu' in trouver(apres, q), false)
    assert.equal(trouver(apres, q).id, q)                      // l'identifiant ne se modifie jamais
    assert.equal(trouver(apres, q).points, 2)                  // les champs permis passent
  })
})

describe('Suppression', () => {
  test('la dernière partie et le dernier exercice d’une partie ne se suppriment pas', () => {
    const d = documentVierge()
    assert.equal(peutSupprimer(d, d.parties[0].id), false)
    assert.equal(supprimer(d, d.parties[0].id), d)
    assert.equal(peutSupprimer(d, d.parties[0].exercices[0].id), false)
    assert.equal(supprimer(d, d.parties[0].exercices[0].id), d)
  })
  avecServeur('supprimer la dernière question retire la liste (sinon le format est invalide)', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = ajouterQuestion(d, e)
    const q = trouver(d, e).questions[0].id
    d = ajouterQuestion(d, q)
    const sq = trouver(d, q).sous_questions[0].id
    d = supprimer(d, sq)
    assert.equal('sous_questions' in trouver(d, q), false)
    d = supprimer(d, q)
    assert.equal('questions' in trouver(d, e), false)
    sain(d)
  })
  avecServeur('un exercice qui perd toutes ses questions retrouve un énoncé', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = ajouterQuestion(d, e)
    d = modifier(d, e, { enonce: undefined })     // exercice composé uniquement de questions
    sain(d)
    d = supprimer(d, trouver(d, e).questions[0].id)
    assert.deepEqual(trouver(d, e).enonce, docVide())
    sain(d)
  })
  test('supprimer une partie ou un exercice quand il en reste d’autres', () => {
    let d = ajouterPartie(documentVierge())
    d = supprimer(d, d.parties[0].id)
    assert.equal(d.parties.length, 1)
    d = ajouterExercice(d, d.parties[0].id)
    d = supprimer(d, d.parties[0].exercices[0].id)
    assert.equal(d.parties[0].exercices.length, 1)
  })
})

describe('Déplacement', () => {
  test('monter, descendre, et butées', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    for (let i = 0; i < 3; i++) d = ajouterQuestion(d, e)
    const [a, b, c] = trouver(d, e).questions.map((q) => q.id)
    assert.equal(peutDeplacer(d, a, 'haut'), false); assert.equal(peutDeplacer(d, c, 'bas'), false)
    assert.equal(deplacer(d, a, 'haut'), d); assert.equal(deplacer(d, c, 'bas'), d)
    d = deplacer(d, c, 'haut')
    assert.deepEqual(trouver(d, e).questions.map((q) => q.id), [a, c, b])
    d = deplacer(d, a, 'bas')
    assert.deepEqual(trouver(d, e).questions.map((q) => q.id), [c, a, b])
  })
  test('déplacer des parties', () => {
    let d = ajouterPartie(documentVierge())
    const [p1, p2] = ids(d).p
    d = deplacer(d, p2, 'haut')
    assert.deepEqual(ids(d).p, [p2, p1])
  })
})

describe('Duplication', () => {
  avecServeur('copie profonde avec de nouveaux identifiants partout', () => {
    const d = copie(exemple)
    const ex1 = d.parties[0].exercices[0]
    const duplique = dupliquer(d, ex1.id)
    assert.notEqual(valider(duplique).erreurs.length, 0)   // sans resynchronisation, le total annoncé (10) serait faux
    const apres = synchroniserBareme(duplique)
    assert.equal(apres.entete.bareme_total, 15.5)
    assert.equal(apres.parties[0].exercices.length, 3)
    const copieEx = apres.parties[0].exercices[1]
    assert.equal(copieEx.titre, 'Racines carrées (copie)')
    assert.notEqual(copieEx.id, ex1.id)
    assert.equal(copieEx.questions.length, ex1.questions.length)
    assert.ok(idsUniques(apres))
    assert.deepEqual(copieEx.questions[0].enonce, ex1.questions[0].enonce)       // même contenu
    assert.notEqual(copieEx.questions[1].sous_questions[0].id, ex1.questions[1].sous_questions[0].id)
    sain(apres)
  })
  test('les réponses d’un QCM suivent les nouveaux identifiants de leurs propositions', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = ajouterQuestion(d, e)
    const q = trouver(d, e).questions[0].id
    d = modifier(d, q, { verification: { mode: 'qcm', propositions: [{ id: 'prop-aaaa', texte: 'A' }, { id: 'prop-bbbb', texte: 'B' }], correctes: ['prop-bbbb'] } })
    const apres = dupliquer(d, q)
    const dup = trouver(apres, e).questions[1]
    assert.notEqual(dup.verification.propositions[1].id, 'prop-bbbb')
    assert.deepEqual(dup.verification.correctes, [dup.verification.propositions[1].id])
    assert.ok(idsUniques(apres))
  })
})

describe('Points et barème total', () => {
  avecServeur('totalDocument donne le même total que le serveur', () => {
    assert.equal(totalDocument(exemple), valider(exemple).resume.total_points)
    const d = copie(exemple); d.parties[0].exercices[0].questions[0].points = 3
    assert.equal(totalDocument(d), valider(d).resume.total_points)
  })
  test('synchroniserBareme : pose, met à jour et retire le total ; rien à changer = même référence', () => {
    let d = documentVierge()
    assert.equal(synchroniserBareme(d), d)                       // aucun point : pas de total
    d = modifier(d, d.parties[0].exercices[0].id, { points: 4 })
    const s1 = synchroniserBareme(d)
    assert.equal(s1.entete.bareme_total, 4)
    assert.equal(synchroniserBareme(s1), s1)                     // stable : pas de boucle de mise à jour
    const s2 = synchroniserBareme(modifier(s1, s1.parties[0].exercices[0].id, { points: 2.5 }))
    assert.equal(s2.entete.bareme_total, 2.5)
    const s3 = synchroniserBareme(modifier(s2, s2.parties[0].exercices[0].id, { points: undefined }))
    assert.equal('entete' in s3, false)                          // plus de points : l'en-tête vide disparaît
  })
  test('la durée de l’en-tête est conservée quand le total change', () => {
    let d = { ...documentVierge(), entete: { duree_minutes: 45 } }
    d = synchroniserBareme(modifier(d, d.parties[0].exercices[0].id, { points: 3 }))
    assert.deepEqual(d.entete, { duree_minutes: 45, bareme_total: 3 })
  })
  test('un corrigé ne peut être ajouté qu’à un exercice ou une question', () => {
    const d = ajouterAnnexe(documentVierge(), documentVierge().parties[0].id)
    const vierge = documentVierge()
    assert.equal(ajouterCorrige(vierge, vierge.parties[0].id), vierge)
    assert.notEqual(ajouterCorrige(vierge, vierge.parties[0].exercices[0].id), vierge)
    void d
  })
})

describe('Saisie des points', () => {
  test('seules les feuilles reçoivent des points', () => {
    let d = documentVierge()
    const p = d.parties[0].id, e = d.parties[0].exercices[0].id
    assert.equal(peutDefinirPoints(d, p), false)                   // une partie : jamais
    assert.equal(peutDefinirPoints(d, e), true)                    // exercice sans question : feuille
    d = ajouterQuestion(d, e)
    const q = trouver(d, e).questions[0].id
    assert.equal(peutDefinirPoints(d, e), false)                   // exercice avec questions : parent
    assert.equal(peutDefinirPoints(d, q), true)
    d = ajouterQuestion(d, q)
    assert.equal(peutDefinirPoints(d, q), false)                   // question avec sous-question : parent
    assert.equal(definirPoints(d, q, 3), d)                        // refusé : document inchangé
    assert.equal(definirPoints(d, p, 3), d)
  })
  test('devenir parent efface les points que l’élément portait', () => {
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    d = definirPoints(d, e, 5)
    assert.equal(trouver(d, e).points, 5)
    d = ajouterQuestion(d, e)
    assert.equal('points' in trouver(d, e), false)                 // les points passent aux questions
    const q = trouver(d, e).questions[0].id
    d = definirPoints(d, q, 2)
    d = ajouterQuestion(d, q)
    assert.equal('points' in trouver(d, q), false)
  })
  test('valeurs de points : multiples de 0,25 seulement, vide = retirer', () => {
    assert.deepEqual([0, 0.25, 1.5, 20, '2', 1000].map(pointsValides), [true, true, true, true, true, true])
    assert.deepEqual([-1, 1.3, 'abc', NaN, 1001, Infinity].map(pointsValides), [false, false, false, false, false, false])
    let d = documentVierge()
    const e = d.parties[0].exercices[0].id
    assert.equal(definirPoints(d, e, 1.3), d)                      // invalide : inchangé
    d = definirPoints(d, e, '2,5'.replace(',', '.'))
    assert.equal(trouver(d, e).points, 2.5)
    d = definirPoints(d, e, '')
    assert.equal('points' in trouver(d, e), false)
  })
})

describe('Plan du document', () => {
  avecServeur('libellés identiques à ceux des messages du validateur', () => {
    const d = copie(exemple)
    const lignes = plan(d)
    assert.deepEqual(lignes.slice(0, 4).map((l) => l.libelle), [
      'Partie 1 (Activités numériques)',
      'Partie 1 (Activités numériques) › Exercice 1',
      'Partie 1 (Activités numériques) › Exercice 1 › Question 1',
      'Partie 1 (Activités numériques) › Exercice 1 › Question 2',
    ])
    assert.ok(lignes.some((l) => l.libelle.endsWith('Question 2 › a)')))
    // Les libellés du validateur sont ceux de l'éditeur : un clic sur une erreur ouvre le bon élément
    const faux = copie(d)
    faux.parties[0].exercices[1].questions[0].id = faux.parties[0].exercices[0].questions[0].id
    const erreur = valider(faux).erreurs.find((e) => /déjà utilisé/.test(e.message))
    assert.ok(plan(faux).some((l) => l.libelle === erreur.libelle), erreur.libelle)
  })
})

// Test « au hasard » : des centaines d'opérations enchaînées ; le document doit rester valide à chaque pas.
describe('Résistance : opérations aléatoires', () => {
  for (const depart of [12345, 1, 42, 777, 99999, 2026]) avecServeur(`600 opérations enchaînées sans jamais produire un document invalide (graine ${depart})`, () => {
    let graine = depart
    const hasard = (n) => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine % n }
    let d = documentVierge()
    const parcourir = (doc) => plan(doc).map((l) => l)
    const operations = [
      (doc) => ajouterPartie(doc, hasard(2) ? doc.parties[hasard(doc.parties.length)].id : null),
      (doc) => { const l = parcourir(doc).filter((x) => x.type === 'partie'); return ajouterExercice(doc, l[hasard(l.length)].id) },
      (doc) => { const l = parcourir(doc).filter((x) => x.type === 'exercice' || x.type === 'question'); return ajouterQuestion(doc, l[hasard(l.length)].id) },
      (doc) => { const l = parcourir(doc); return supprimer(doc, l[hasard(l.length)].id) },
      (doc) => { const l = parcourir(doc); return deplacer(doc, l[hasard(l.length)].id, hasard(2) ? 'haut' : 'bas') },
      (doc) => { const l = parcourir(doc); return dupliquer(doc, l[hasard(l.length)].id) },
      (doc) => { const l = parcourir(doc); return ajouterCorrige(doc, l[hasard(l.length)].id) },
      (doc) => { const l = parcourir(doc).filter((x) => x.type !== 'partie'); return l.length ? retirerCorrige(doc, l[hasard(l.length)].id) : doc },
      (doc) => { const l = parcourir(doc); return definirPoints(doc, l[hasard(l.length)].id, hasard(4) * 0.5 + 0.5) },
      (doc) => { const l = parcourir(doc); return modifier(doc, l[hasard(l.length)].id, { titre: 'Titre ' + hasard(100) }) },
      (doc) => { const l = parcourir(doc).filter((x) => x.type === 'partie' || x.type === 'exercice'); return ajouterAnnexe(doc, l[hasard(l.length)].id) },
    ]
    gelerProfond(d)
    for (let i = 0; i < 600; i++) {
      const avant = JSON.stringify(d)
      d = gelerProfond(copie(synchroniserBareme(operations[hasard(operations.length)](d))))
      sain(d)
      assert.ok(d.parties.length >= 1 && d.parties.every((p) => p.exercices.length >= 1), 'partie ou exercice vide à l’étape ' + i)
      void avant
    }
    assert.ok(tousLesIds(d).length > 20, 'le test n’a pas assez construit')
  })
})
