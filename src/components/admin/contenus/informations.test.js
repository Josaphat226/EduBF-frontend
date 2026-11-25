import { test, describe } from 'vitest'
import assert from 'node:assert/strict'
import {
  formulaireVide, formulaireDepuis, verifierFormulaire, construireCharge, seriesDe, chapitresPour,
  elaguerSelections, etatContenu, libelleType, TYPES,
} from './informations.js'

const valide = (extra = {}) => ({ ...formulaireVide(), titre: 'Racines carrées', niveau_id: '10', matiere_id: '3', ...extra })

describe('Vérification du formulaire', () => {
  test('un formulaire minimal est valide', () => {
    assert.equal(verifierFormulaire(valide()).ok, true)
  })
  test('titre, niveau et matière obligatoires', () => {
    const r = verifierFormulaire(formulaireVide())
    assert.deepEqual(Object.keys(r.erreurs).sort(), ['matiere_id', 'niveau_id', 'titre'])
  })
  test('un titre fait d’espaces est refusé ; 255 caractères au plus', () => {
    assert.ok(verifierFormulaire(valide({ titre: '   ' })).erreurs.titre)
    assert.equal(verifierFormulaire(valide({ titre: 'a'.repeat(255) })).ok, true)
    assert.ok(verifierFormulaire(valide({ titre: 'a'.repeat(256) })).erreurs.titre)
  })
  test('un sujet d’examen doit préciser l’examen', () => {
    assert.ok(verifierFormulaire(valide({ type: 'sujet_examen' })).erreurs.examen_id)
    assert.equal(verifierFormulaire(valide({ type: 'sujet_examen', examen_id: '2' })).ok, true)
    assert.equal(verifierFormulaire(valide({ type: 'devoir' })).ok, true)
  })
  test('un contenu externe doit citer sa source ; le lien doit être http(s)', () => {
    assert.ok(verifierFormulaire(valide({ origine: 'externe' })).erreurs.source_nom)
    assert.equal(verifierFormulaire(valide({ origine: 'externe', source_nom: 'Office du BAC 2019' })).ok, true)
    assert.ok(verifierFormulaire(valide({ origine: 'externe', source_nom: 'x', source_url: 'ftp://x' })).erreurs.source_url)
    assert.ok(verifierFormulaire(valide({ origine: 'externe', source_nom: 'x', source_url: 'javascript:alert(1)' })).erreurs.source_url)
    assert.equal(verifierFormulaire(valide({ origine: 'externe', source_nom: 'x', source_url: 'https://exemple.org' })).ok, true)
  })
  test('les champs de source sont ignorés pour un contenu EduBF', () => {
    assert.equal(verifierFormulaire(valide({ source_url: 'pas une adresse' })).ok, true)
  })
  test('longueurs maximales', () => {
    assert.ok(verifierFormulaire(valide({ description: 'a'.repeat(5001) })).erreurs.description)
    assert.ok(verifierFormulaire(valide({ annee_scolaire: 'a'.repeat(21) })).erreurs.annee_scolaire)
    assert.ok(verifierFormulaire(valide({ origine: 'externe', source_nom: 'a'.repeat(301) })).erreurs.source_nom)
    assert.ok(verifierFormulaire(valide({ origine: 'externe', source_nom: 'x', licence: 'a'.repeat(101) })).erreurs.licence)
  })
})

describe('Corps de la requête', () => {
  test('contenu EduBF : identifiants en nombres, champs vides en null, pas de champs de source', () => {
    const c = construireCharge(valide({ description: '  ', difficulte: '', series_ids: ['4'], chapitres_ids: [7] }))
    assert.deepEqual(c, {
      type: 'exercice', titre: 'Racines carrées', description: null,
      niveau_id: 10, matiere_id: 3, examen_id: null, session_id: null, langue_id: null,
      annee_scolaire: null, difficulte: null, origine: 'edubf', series_ids: [4], chapitres_ids: [7],
    })
  })
  test('contenu externe : source, licence, autorisation', () => {
    const c = construireCharge(valide({ origine: 'externe', source_nom: ' Office du BAC ', source_url: 'https://exemple.org', licence: '', autorisation: 'obtenue', autorisation_note: 'Accord du 12/11' }))
    assert.equal(c.source_nom, 'Office du BAC')
    assert.equal(c.source_url, 'https://exemple.org')
    assert.equal(c.licence, null)
    assert.equal(c.autorisation, 'obtenue')
    assert.equal(c.autorisation_note, 'Accord du 12/11')
  })
  test('session et langue déjà enregistrées sont conservées à la modification', () => {
    const c = construireCharge(valide({ session_id: '5', langue_id: '1' }))
    assert.deepEqual([c.session_id, c.langue_id], [5, 1])
  })
})

describe('Relecture d’un contenu existant', () => {
  const reponse = {
    contenu: { titre: 'Devoir', type: 'devoir', niveau_id: 10, matiere_id: 3, examen_id: null, annee_scolaire: null, difficulte: 'moyen', description: null,
      origine: 'externe', source_nom: 'Office du BAC', source_url: null, licence: 'CC0', autorisation: 'obtenue', autorisation_note: null, session_id: 5, langue_id: null },
    series_ids: [4, 6], chapitres: [{ id: 7, titre: 'Racines' }],
  }
  test('transforme la réponse du serveur en valeurs de formulaire', () => {
    const f = formulaireDepuis(reponse)
    assert.deepEqual([f.titre, f.type, f.niveau_id, f.examen_id, f.difficulte, f.autorisation], ['Devoir', 'devoir', '10', '', 'moyen', 'obtenue'])
    assert.deepEqual([f.series_ids, f.chapitres_ids], [[4, 6], [7]])
  })
  test('aller-retour : ouvrir puis renvoyer sans rien changer redonne les mêmes informations', () => {
    const c = construireCharge(formulaireDepuis(reponse))
    assert.equal(c.niveau_id, 10); assert.equal(c.session_id, 5); assert.equal(c.licence, 'CC0')
    assert.deepEqual(c.series_ids, [4, 6]); assert.deepEqual(c.chapitres_ids, [7])
    assert.equal(verifierFormulaire(formulaireDepuis(reponse)).ok, true)
  })
})

describe('Séries et chapitres', () => {
  const ref = {
    series: [{ id: 1, examen_id: 1, nom: 'A' }, { id: 2, examen_id: 1, nom: 'B' }, { id: 3, examen_id: 2, nom: 'C' }],
    chapitres: [
      { id: 10, niveau_id: 1, matiere_id: 1, serie_id: null, titre: 'Commun' },
      { id: 11, niveau_id: 1, matiere_id: 1, serie_id: 1, titre: 'Série A' },
      { id: 12, niveau_id: 1, matiere_id: 1, serie_id: 2, titre: 'Série B' },
      { id: 13, niveau_id: 2, matiere_id: 1, serie_id: null, titre: 'Autre niveau' },
    ],
  }
  test('séries d’un examen', () => {
    assert.deepEqual(seriesDe('1', ref.series).map((s) => s.nom), ['A', 'B'])
    assert.deepEqual(seriesDe('', ref.series), [])
  })
  test('chapitres du niveau et de la matière : communs, plus ceux des séries cochées', () => {
    assert.deepEqual(chapitresPour('1', '1', [], ref.chapitres).map((c) => c.id), [10])
    assert.deepEqual(chapitresPour('1', '1', [1], ref.chapitres).map((c) => c.id), [10, 11])
    assert.deepEqual(chapitresPour('', '1', [], ref.chapitres), [])
  })
  test('changer d’examen ou de niveau retire les choix qui ne conviennent plus', () => {
    const f = { ...formulaireVide(), niveau_id: '1', matiere_id: '1', examen_id: '1', series_ids: [1, 2], chapitres_ids: [10, 11, 12] }
    assert.deepEqual(elaguerSelections({ ...f, examen_id: '2' }, ref).series_ids, [])
    assert.deepEqual(elaguerSelections({ ...f, niveau_id: '2' }, ref).chapitres_ids, [])
    assert.deepEqual(elaguerSelections({ ...f, series_ids: [1] }, ref).chapitres_ids, [10, 11])
    assert.deepEqual(elaguerSelections(f, ref).chapitres_ids, [10, 11, 12]) // rien ne change : tout est conservé
  })
})

describe('État affiché dans la liste', () => {
  const ligne = (extra) => ({ actif: true, version_publiee: null, version_travail: null, statut_travail: null, ...extra })
  test('brouillon, relu, publié, publié avec une version en cours, retiré', () => {
    assert.deepEqual(etatContenu(ligne({ version_travail: 1, statut_travail: 'brouillon' })), { cle: 'brouillon', libelle: 'Brouillon' })
    assert.deepEqual(etatContenu(ligne({ version_travail: 1, statut_travail: 'relue' })), { cle: 'relu', libelle: 'Relu' })
    assert.deepEqual(etatContenu(ligne({ version_publiee: 2 })), { cle: 'publie', libelle: 'Publié v2' })
    assert.deepEqual(etatContenu(ligne({ version_publiee: 2, version_travail: 3, statut_travail: 'brouillon' })), { cle: 'publie-modif', libelle: 'Publié v2 · v3 en cours' })
    assert.deepEqual(etatContenu(ligne({ actif: false, version_publiee: 2 })), { cle: 'retire', libelle: 'Retiré' })
  })
  test('libellés de type', () => {
    assert.equal(libelleType('sujet_examen'), 'Sujet d’examen')
    assert.equal(libelleType('inconnu'), 'inconnu')
    assert.equal(TYPES.length, 5)
  })
})
