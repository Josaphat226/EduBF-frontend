// Logique du formulaire « Informations » d'un contenu (titre, classement, source…).
// Pure et testée : le composant React ne fait qu'afficher et appeler ces fonctions.
// Les règles reprennent celles du serveur (routes/admin-contenus.js, lireMetadonnees).

export const TYPES = [
  { valeur: 'exercice', libelle: 'Exercice' },
  { valeur: 'serie_exercices', libelle: 'Série d’exercices' },
  { valeur: 'devoir', libelle: 'Devoir' },
  { valeur: 'composition', libelle: 'Composition' },
  { valeur: 'sujet_examen', libelle: 'Sujet d’examen' },
]

export const DIFFICULTES = [
  { valeur: 'facile', libelle: 'Facile' },
  { valeur: 'moyen', libelle: 'Moyen' },
  { valeur: 'difficile', libelle: 'Difficile' },
]

export const AUTORISATIONS = [
  { valeur: 'a_verifier', libelle: 'À vérifier' },
  { valeur: 'obtenue', libelle: 'Autorisation obtenue' },
  { valeur: 'domaine_public', libelle: 'Domaine public' },
]

export function formulaireVide() {
  return {
    titre: '', type: 'exercice', niveau_id: '', matiere_id: '', niveau_nom: '', matiere_nom: '', examen_id: '',
    annee_scolaire: '', difficulte: '', description: '',
    origine: 'edubf', source_nom: '', source_url: '', licence: '', autorisation: 'a_verifier', autorisation_note: '',
    series_ids: [], chapitres_ids: [],
    session_id: '', langue_id: '', // conservés tels quels à la modification (aucun écran ne les change pour l'instant)
  }
}

const texte = (v) => (v == null ? '' : String(v))
const id = (v) => (v == null ? '' : String(v))

// Réponse de GET /api/admin/contenus/:id -> valeurs du formulaire
export function formulaireDepuis(reponse) {
  const c = reponse.contenu
  return {
    titre: texte(c.titre), type: c.type, niveau_id: id(c.niveau_id), matiere_id: id(c.matiere_id),
    niveau_nom: texte(c.niveau), matiere_nom: texte(c.matiere), examen_id: id(c.examen_id),
    annee_scolaire: texte(c.annee_scolaire), difficulte: texte(c.difficulte), description: texte(c.description),
    origine: c.origine, source_nom: texte(c.source_nom), source_url: texte(c.source_url), licence: texte(c.licence),
    autorisation: c.origine === 'externe' ? c.autorisation : 'a_verifier', autorisation_note: texte(c.autorisation_note),
    series_ids: (reponse.series_ids || []).map(Number),
    chapitres_ids: (reponse.chapitres || []).map((x) => Number(x.id)),
    session_id: id(c.session_id), langue_id: id(c.langue_id),
  }
}

const estUrl = (v) => /^https?:\/\//i.test(v)

// Même règles que le serveur : on prévient l'auteur avant l'envoi plutôt que de lui renvoyer une erreur
export function verifierFormulaire(f) {
  const e = {}
  const titre = f.titre.trim()
  if (!titre) e.titre = 'Le titre est obligatoire.'
  else if (titre.length > 255) e.titre = 'Le titre est trop long (255 caractères maximum).'
  if (!TYPES.some((t) => t.valeur === f.type)) e.type = 'Choisissez un type.'
  // La classe est facultative ; la matière est obligatoire (choisie dans la liste ou saisie à la main)
  const niveauNom = (f.niveau_nom || '').trim()
  const matiereNom = (f.matiere_nom || '').trim()
  if (niveauNom.length > 100) e.niveau_id = 'Nom de classe trop long (100 caractères maximum).'
  if (!f.matiere_id && !matiereNom) e.matiere_id = 'Saisissez ou choisissez une matière.'
  else if (matiereNom.length > 150) e.matiere_id = 'Nom de matière trop long (150 caractères maximum).'
  if (f.type === 'sujet_examen' && !f.examen_id) e.examen_id = 'Un sujet d’examen doit préciser l’examen.'
  if (f.description.length > 5000) e.description = 'La description est trop longue (5000 caractères maximum).'
  if (f.annee_scolaire.trim().length > 20) e.annee_scolaire = 'Année scolaire trop longue (20 caractères maximum).'
  if (f.origine === 'externe') {
    const source = f.source_nom.trim()
    if (!source) e.source_nom = 'Un contenu externe doit citer sa source.'
    else if (source.length > 300) e.source_nom = 'Source trop longue (300 caractères maximum).'
    const url = f.source_url.trim()
    if (url && (!estUrl(url) || url.length > 500)) e.source_url = 'Le lien doit commencer par http:// ou https://.'
    if (f.licence.trim().length > 100) e.licence = 'Licence trop longue (100 caractères maximum).'
    if (f.autorisation_note.trim().length > 1000) e.autorisation_note = 'Note trop longue (1000 caractères maximum).'
  }
  return { ok: Object.keys(e).length === 0, erreurs: e }
}

// Valeurs du formulaire -> corps de la requête (POST /api/admin/contenus ou PUT /api/admin/contenus/:id)
export function construireCharge(f) {
  const nombre = (v) => (v === '' || v == null ? null : Number(v))
  const charge = {
    type: f.type,
    titre: f.titre.trim(),
    description: f.description.trim() || null,
    niveau_id: nombre(f.niveau_id),
    matiere_id: nombre(f.matiere_id),
    examen_id: nombre(f.examen_id),
    session_id: nombre(f.session_id),
    langue_id: nombre(f.langue_id),
    annee_scolaire: f.annee_scolaire.trim() || null,
    difficulte: f.difficulte || null,
    origine: f.origine,
    series_ids: f.series_ids.map(Number),
    chapitres_ids: f.chapitres_ids.map(Number),
  }
  // Nom saisi à la main : le serveur retrouve la classe / la matière du même nom, ou la crée
  if (!f.niveau_id && (f.niveau_nom || '').trim()) charge.niveau_nom = f.niveau_nom.trim()
  if (!f.matiere_id && (f.matiere_nom || '').trim()) charge.matiere_nom = f.matiere_nom.trim()
  if (f.origine === 'externe') {
    charge.source_nom = f.source_nom.trim()
    charge.source_url = f.source_url.trim() || null
    charge.licence = f.licence.trim() || null
    charge.autorisation = f.autorisation
    charge.autorisation_note = f.autorisation_note.trim() || null
  }
  return charge
}

// Retire accents, majuscules et espaces en trop : « 3ème  » et « 3EME » désignent la même classe
export function normaliserNom(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// Identifiant de la classe / matière dont le nom correspond au texte saisi ('' si elle n'existe pas encore)
export function idPourNom(liste, nom) {
  const cle = normaliserNom(nom)
  if (!cle) return ''
  const trouve = liste.find((x) => normaliserNom(x.nom) === cle)
  return trouve ? String(trouve.id) : ''
}

// Séries d'un examen
export function seriesDe(examenId, series) {
  if (!examenId) return []
  return series.filter((s) => String(s.examen_id) === String(examenId))
}

// Chapitres proposés : ceux du niveau et de la matière choisis, communs ou propres aux séries cochées
export function chapitresPour(niveauId, matiereId, serieIds, chapitres) {
  if (!niveauId || !matiereId) return []
  return chapitres.filter((c) =>
    String(c.niveau_id) === String(niveauId) && String(c.matiere_id) === String(matiereId) &&
    (c.serie_id == null || serieIds.map(String).includes(String(c.serie_id))))
}

// Après un changement de niveau, matière ou examen : retire les séries et chapitres qui ne conviennent plus
export function elaguerSelections(f, ref) {
  const series = seriesDe(f.examen_id, ref.series).map((s) => Number(s.id))
  const series_ids = f.series_ids.filter((s) => series.includes(Number(s)))
  const chapitresOk = chapitresPour(f.niveau_id, f.matiere_id, series_ids, ref.chapitres).map((c) => Number(c.id))
  return { ...f, series_ids, chapitres_ids: f.chapitres_ids.filter((c) => chapitresOk.includes(Number(c))) }
}

// État affiché dans la liste, à partir d'une ligne de GET /api/admin/contenus
export function etatContenu(c) {
  if (!c.actif) return { cle: 'retire', libelle: 'Retiré' }
  if (c.version_publiee) {
    return c.version_travail
      ? { cle: 'publie-modif', libelle: `Publié v${c.version_publiee} · v${c.version_travail} en cours` }
      : { cle: 'publie', libelle: `Publié v${c.version_publiee}` }
  }
  if (c.statut_travail === 'relue') return { cle: 'relu', libelle: 'Relu' }
  return { cle: 'brouillon', libelle: 'Brouillon' }
}

export function libelleType(valeur) {
  const t = TYPES.find((x) => x.valeur === valeur)
  return t ? t.libelle : valeur
}