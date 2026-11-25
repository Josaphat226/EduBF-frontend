// @vitest-environment jsdom
import { test, describe, vi, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))
import { api } from '@/lib/api'
import FormulaireInformations from './FormulaireInformations.jsx'
import { formulaireVide } from './informations.js'

const REF = {
  types: [],
  niveaux: [{ id: 10, nom: '3e' }, { id: 13, nom: 'Terminale' }],
  matieres: [{ id: 3, nom: 'Mathématiques' }, { id: 5, nom: 'Physique-Chimie' }],
  examens: [{ id: 1, nom: 'BEPC' }, { id: 2, nom: 'BAC' }],
  series: [{ id: 1, examen_id: 2, nom: 'Série C' }, { id: 2, examen_id: 2, nom: 'Série D' }],
  sessions: [], langues: [],
  chapitres: [
    { id: 7, niveau_id: 13, matiere_id: 3, serie_id: null, titre: 'Limites' },
    { id: 8, niveau_id: 13, matiere_id: 3, serie_id: 1, titre: 'Nombres complexes' },
  ],
}

let racine, conteneur
const attendre = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })

async function monter(props = {}) {
  conteneur = document.createElement('div')
  document.body.appendChild(conteneur)
  racine = createRoot(conteneur)
  await act(async () => { racine.render(<FormulaireInformations onSubmit={props.onSubmit || vi.fn()} {...props} />) })
  await attendre()
}

const el = (id) => conteneur.querySelector('#' + id)
const textes = () => conteneur.textContent
async function saisir(id, valeur) {
  const e = el(id)
  const proto = e.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : e.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, valeur)
    e.dispatchEvent(new window.Event('input', { bubbles: true }))
    e.dispatchEvent(new window.Event('change', { bubbles: true }))
  })
}
const caseDe = (libelle) => [...conteneur.querySelectorAll('label.ctn-case')].find((l) => l.textContent.trim() === libelle)
async function cliquer(element) { await act(async () => { element.click() }) }
async function envoyer() {
  await act(async () => { conteneur.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })) })
  await attendre()
}

beforeEach(() => { api.get.mockReset(); api.get.mockResolvedValue({ data: REF }) })
afterEach(async () => { await act(async () => { racine.unmount() }); conteneur.remove() })

describe('Chargement', () => {
  test('affiche « Chargement… » puis le formulaire', async () => {
    let repondre
    api.get.mockReturnValue(new Promise((resolve) => { repondre = resolve })) // réponse retardée à la main
    conteneur = document.createElement('div'); document.body.appendChild(conteneur); racine = createRoot(conteneur)
    await act(async () => { racine.render(<FormulaireInformations onSubmit={vi.fn()} />) })
    assert.match(textes(), /Chargement/)
    assert.equal(el('ctn-titre'), null)
    await act(async () => { repondre({ data: REF }) })
    assert.ok(el('ctn-titre'))
    assert.doesNotMatch(textes(), /Chargement/)
    assert.deepEqual(api.get.mock.calls[0], ['/admin/contenus/referentiels'])
  })
  test('si les listes sont indisponibles : message d’erreur, pas de formulaire', async () => {
    api.get.mockRejectedValue(new Error('Impossible de contacter le serveur.'))
    await monter()
    assert.match(textes(), /Impossible de contacter le serveur/)
    assert.equal(el('ctn-titre'), null)
  })
  test('les listes de niveaux, matières et examens sont proposées', async () => {
    await monter()
    assert.deepEqual([...el('ctn-niveau').options].map((o) => o.textContent), ['— Choisir —', '3e', 'Terminale'])
    assert.deepEqual([...el('ctn-matiere').options].map((o) => o.textContent), ['— Choisir —', 'Mathématiques', 'Physique-Chimie'])
    assert.deepEqual([...el('ctn-examen').options].map((o) => o.textContent), ['— Aucun —', 'BEPC', 'BAC'])
  })
})

describe('Envoi', () => {
  test('formulaire vide : erreurs en clair, rien n’est envoyé', async () => {
    const onSubmit = vi.fn()
    await monter({ onSubmit })
    await envoyer()
    assert.match(textes(), /Le titre est obligatoire\./)
    assert.match(textes(), /Choisissez un niveau\./)
    assert.match(textes(), /Choisissez une matière\./)
    assert.equal(onSubmit.mock.calls.length, 0)
  })
  test('formulaire valide : envoi du bon corps, puis confirmation', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    await monter({ onSubmit })
    await saisir('ctn-titre', '  Limites et dérivées  ')
    await saisir('ctn-niveau', '13'); await saisir('ctn-matiere', '3')
    await envoyer()
    assert.equal(onSubmit.mock.calls.length, 1)
    const c = onSubmit.mock.calls[0][0]
    assert.deepEqual([c.titre, c.type, c.niveau_id, c.matiere_id, c.examen_id, c.origine], ['Limites et dérivées', 'exercice', 13, 3, null, 'edubf'])
    assert.match(textes(), /Informations enregistrées\./)
  })
  test('un sujet d’examen sans examen est refusé, avec l’examen il passe', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    await monter({ onSubmit })
    await saisir('ctn-titre', 'Sujet BAC'); await saisir('ctn-niveau', '13'); await saisir('ctn-matiere', '3'); await saisir('ctn-type', 'sujet_examen')
    await envoyer()
    assert.match(textes(), /Un sujet d’examen doit préciser l’examen\./)
    assert.equal(onSubmit.mock.calls.length, 0)
    await saisir('ctn-examen', '2')
    await envoyer()
    assert.equal(onSubmit.mock.calls.length, 1)
    assert.equal(onSubmit.mock.calls[0][0].examen_id, 2)
  })
  test('erreur renvoyée par le serveur : affichée telle quelle, pas de fausse confirmation', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Une référence (niveau, matière…) n’existe pas.'))
    await monter({ onSubmit })
    await saisir('ctn-titre', 'Test'); await saisir('ctn-niveau', '10'); await saisir('ctn-matiere', '3')
    await envoyer()
    assert.match(textes(), /Une référence \(niveau, matière…\) n’existe pas\./)
    assert.doesNotMatch(textes(), /Informations enregistrées/)
  })
  test('pendant l’envoi : bouton bloqué (pas de double création), puis débloqué', async () => {
    let fin
    const onSubmit = vi.fn(() => new Promise((resolve) => { fin = resolve }))
    await monter({ onSubmit, libelleBouton: 'Créer le contenu' })
    await saisir('ctn-titre', 'Test'); await saisir('ctn-niveau', '10'); await saisir('ctn-matiere', '3')
    await envoyer()
    const bouton = conteneur.querySelector('button[type="submit"]')
    assert.equal(bouton.disabled, true)
    assert.equal(bouton.textContent, 'Enregistrement…')
    await act(async () => { fin() }); await attendre()
    assert.equal(bouton.disabled, false)
    assert.equal(bouton.textContent, 'Créer le contenu')
  })
})

describe('Séries et chapitres', () => {
  test('les séries apparaissent avec l’examen ; changer d’examen retire celles qui ne conviennent plus', async () => {
    await monter()
    assert.equal(caseDe('Série C'), undefined)
    await saisir('ctn-examen', '2')
    assert.ok(caseDe('Série C') && caseDe('Série D'))
    await cliquer(caseDe('Série C').querySelector('input'))
    assert.equal(caseDe('Série C').querySelector('input').checked, true)
    await saisir('ctn-examen', '1')               // BEPC : pas de séries
    assert.equal(caseDe('Série C'), undefined)
    await saisir('ctn-examen', '2')               // retour au BAC : la sélection a été effacée
    assert.equal(caseDe('Série C').querySelector('input').checked, false)
  })
  test('chapitres : seulement après niveau et matière ; ceux d’une série seulement quand elle est cochée', async () => {
    await monter()
    assert.match(textes(), /Choisissez un niveau et une matière pour voir les chapitres\./)
    await saisir('ctn-niveau', '13'); await saisir('ctn-matiere', '3')
    assert.ok(caseDe('Limites'))
    assert.equal(caseDe('Nombres complexes'), undefined)
    await saisir('ctn-examen', '2')
    await cliquer(caseDe('Série C').querySelector('input'))
    assert.ok(caseDe('Nombres complexes'))
    await saisir('ctn-matiere', '5')              // autre matière : aucun chapitre saisi
    assert.match(textes(), /Aucun chapitre n’est encore saisi pour ce niveau et cette matière\./)
  })
  test('séries et chapitres cochés sont envoyés', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    await monter({ onSubmit })
    await saisir('ctn-titre', 'Complexes'); await saisir('ctn-niveau', '13'); await saisir('ctn-matiere', '3'); await saisir('ctn-examen', '2')
    await cliquer(caseDe('Série C').querySelector('input'))
    await cliquer(caseDe('Nombres complexes').querySelector('input'))
    await cliquer(caseDe('Limites').querySelector('input'))
    await envoyer()
    const c = onSubmit.mock.calls[0][0]
    assert.deepEqual([c.series_ids, c.chapitres_ids.sort()], [[1], [7, 8]])
  })
})

describe('Origine et droits', () => {
  test('source externe : champs de source affichés, source obligatoire, puis envoyés', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    await monter({ onSubmit })
    assert.equal(el('ctn-source'), null)
    await saisir('ctn-titre', 'Sujet 2019'); await saisir('ctn-niveau', '13'); await saisir('ctn-matiere', '3')
    await cliquer(caseDe('Source externe').querySelector('input'))
    assert.ok(el('ctn-source'))
    assert.match(textes(), /ne peut être publié que si l’autorisation est « obtenue » ou « domaine public »/)
    await envoyer()
    assert.match(textes(), /Un contenu externe doit citer sa source\./)
    assert.equal(onSubmit.mock.calls.length, 0)
    await saisir('ctn-source', 'Office du BAC, session 2019'); await saisir('ctn-autorisation', 'obtenue'); await saisir('ctn-licence', 'Domaine public')
    await envoyer()
    const c = onSubmit.mock.calls[0][0]
    assert.deepEqual([c.origine, c.source_nom, c.autorisation, c.licence], ['externe', 'Office du BAC, session 2019', 'obtenue', 'Domaine public'])
  })
  test('lien de source invalide refusé', async () => {
    await monter()
    await saisir('ctn-titre', 'X'); await saisir('ctn-niveau', '10'); await saisir('ctn-matiere', '3')
    await cliquer(caseDe('Source externe').querySelector('input'))
    await saisir('ctn-source', 'Une source'); await saisir('ctn-url', 'javascript:alert(1)')
    await envoyer()
    assert.match(textes(), /Le lien doit commencer par http:\/\/ ou https:\/\//)
  })
})

describe('Modification d’un contenu existant', () => {
  test('les valeurs actuelles sont pré-remplies', async () => {
    const initial = { ...formulaireVide(), titre: 'Devoir existant', type: 'devoir', niveau_id: '13', matiere_id: '3', examen_id: '2', series_ids: [2], difficulte: 'difficile', annee_scolaire: '2025-2026' }
    await monter({ initial })
    assert.equal(el('ctn-titre').value, 'Devoir existant')
    assert.equal(el('ctn-type').value, 'devoir')
    assert.equal(el('ctn-niveau').value, '13')
    assert.equal(el('ctn-difficulte').value, 'difficile')
    assert.equal(caseDe('Série D').querySelector('input').checked, true)
    assert.equal(caseDe('Série C').querySelector('input').checked, false)
  })
  test('on peut modifier et renvoyer', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    await monter({ onSubmit, initial: { ...formulaireVide(), titre: 'Ancien titre', niveau_id: '10', matiere_id: '3', session_id: '5' } })
    await saisir('ctn-titre', 'Nouveau titre')
    await envoyer()
    const c = onSubmit.mock.calls[0][0]
    assert.deepEqual([c.titre, c.session_id], ['Nouveau titre', 5])      // la session enregistrée n'est pas effacée
  })
})
