// Données factices (le backend expose encore du EJS, pas d'API JSON).
// Ces mocks reprennent exactement les champs utilisés par les anciennes vues EJS
// (documents.ejs, document.ejs, index.ejs) pour que les pages React s'affichent
// a l'identique en attendant le branchement de l'API.

export const MOCK_DOCUMENTS = [
  {
    id: 1,
    titre: 'Mathématiques — Sujet BAC D 2023',
    type_document: 'Sujet officiel',
    cycle: 'BAC',
    serie_filiere: 'Série D',
    matiere: 'Mathématiques',
    annee_scolaire: '2023',
    description: "Sujet officiel de l'épreuve de mathématiques du BAC série D, session 2023.",
    nb_telechargements: 1240,
    date_upload: '2024-06-12',
  },
  {
    id: 2,
    titre: 'Physique-Chimie — Cours sur les circuits électriques',
    type_document: 'Cours',
    cycle: 'BAC',
    serie_filiere: 'Série C',
    matiere: 'Physique-Chimie',
    annee_scolaire: '2024',
    description: 'Cours complet sur les circuits électriques en courant continu.',
    nb_telechargements: 860,
    date_upload: '2024-09-02',
  },
  {
    id: 3,
    titre: 'Français — Corrigé dissertation BEPC 2022',
    type_document: 'Corrigé',
    cycle: 'BEPC',
    serie_filiere: '',
    matiere: 'Français',
    annee_scolaire: '2022',
    description: 'Corrigé détaillé de la dissertation de français, session 2022.',
    nb_telechargements: 2010,
    date_upload: '2023-05-20',
  },
  {
    id: 4,
    titre: 'SVT — TD sur la génétique',
    type_document: 'TD / TP',
    cycle: 'BAC',
    serie_filiere: 'Série D',
    matiere: 'SVT',
    annee_scolaire: '2024',
    description: "Travaux dirigés sur les lois de l'hérédité.",
    nb_telechargements: 430,
    date_upload: '2024-11-08',
  },
  {
    id: 5,
    titre: 'Comptabilité — Sujet BTS Gestion 2023',
    type_document: 'Sujet officiel',
    cycle: 'BTS',
    serie_filiere: 'Gestion',
    matiere: 'Comptabilité',
    annee_scolaire: '2023',
    description: "Sujet d'examen du BTS Gestion, épreuve de comptabilité.",
    nb_telechargements: 310,
    date_upload: '2023-07-01',
  },
  {
    id: 6,
    titre: 'Anglais — Résumé grammaire (temps et modaux)',
    type_document: 'Résumé',
    cycle: 'BEPC',
    serie_filiere: '',
    matiere: 'Anglais',
    annee_scolaire: '2024',
    description: 'Fiche de résumé sur les temps et les modaux en anglais.',
    nb_telechargements: 970,
    date_upload: '2024-03-15',
  },
  {
    id: 7,
    titre: 'Électrotechnique — Devoir sur les moteurs asynchrones',
    type_document: 'Devoir',
    cycle: 'BEP',
    serie_filiere: 'Électrotechnique',
    matiere: 'Électrotechnique',
    annee_scolaire: '2024',
    description: 'Devoir surveillé portant sur le fonctionnement des moteurs asynchrones.',
    nb_telechargements: 155,
    date_upload: '2024-10-05',
  },
  {
    id: 8,
    titre: 'Histoire-Géographie — Composition sur la décolonisation',
    type_document: 'Composition',
    cycle: 'BAC',
    serie_filiere: 'Série A',
    matiere: 'Histoire-Géographie',
    annee_scolaire: '2023',
    description: 'Sujet de composition sur la décolonisation en Afrique.',
    nb_telechargements: 540,
    date_upload: '2023-11-22',
  },
  {
    id: 9,
    titre: 'Informatique — Cours sur les bases de données',
    type_document: 'Cours',
    cycle: 'CAP',
    serie_filiere: 'Informatique',
    matiere: 'Informatique',
    annee_scolaire: '2024',
    description: 'Introduction aux bases de données relationnelles.',
    nb_telechargements: 690,
    date_upload: '2024-08-19',
  },
]

export const MOCK_COMMENTS = [
  {
    id: 1,
    document_id: 1,
    nom_complet: 'Awa Traoré',
    date_publication: '2024-07-01',
    note: 5,
    contenu: "Document très clair, ça m'a beaucoup aidé pour réviser !",
  },
  {
    id: 2,
    document_id: 1,
    nom_complet: 'Issa Ouédraogo',
    date_publication: '2024-07-03',
    note: 4,
    contenu: 'Bon sujet, correction bien détaillée.',
  },
]

export function getDocumentById(id) {
  return MOCK_DOCUMENTS.find(d => String(d.id) === String(id)) || null
}

export function getCommentsForDocument(id) {
  return MOCK_COMMENTS.filter(c => String(c.document_id) === String(id))
}

export function getSimilarDocuments(doc, limit = 3) {
  if (!doc) return []
  return MOCK_DOCUMENTS
    .filter(d => d.id !== doc.id && (d.matiere === doc.matiere || d.cycle === doc.cycle))
    .slice(0, limit)
}