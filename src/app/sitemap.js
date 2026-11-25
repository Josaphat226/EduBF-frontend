import { apiServer } from '@/lib/api'
import { SITE_URL } from '@/lib/site'

const baseUrl = SITE_URL

export default async function sitemap() {
  const pagesStatiques = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/documents`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/exercices`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/concours`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/aide`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const pagesDocuments = []
  try {
    let page = 1
    let totalPages = 1
    do {
      const data = await apiServer(`/documents?page=${page}`)
      for (const doc of data.documents || []) {
        pagesDocuments.push({
          url: `${baseUrl}/documents/${doc.id}`,
          lastModified: doc.date_upload,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
      totalPages = data.pagination?.totalPages || 1
      page++
    } while (page <= totalPages && page <= 200)
  } catch {
    // si l'API échoue, on garde ce qui a déjà été récupéré
  }

  const pagesContenus = []
  try {
    let page = 1
    let totalPages = 1
    do {
      const data = await apiServer(`/contenus?page=${page}`)
      for (const c of data.contenus || []) {
        pagesContenus.push({
          url: `${baseUrl}/s/${c.code}`,
          lastModified: c.date_modification,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
      totalPages = data.pagination?.totalPages || 1
      page++
    } while (page <= totalPages && page <= 200)
  } catch {
    // si l'API échoue, on garde ce qui a déjà été récupéré
  }

  // Pages de filtres qui ont des résultats : « maths 3e », « électronique », « BEPC »…
  // Ce sont elles qui répondent aux recherches du type « exercices maths 3e ».
  const pagesFiltres = []
  try {
    const base = await apiServer('/contenus?facettes=1&par_page=1')
    const f = base.facettes || {}
    const ajouter = (qs) => pagesFiltres.push({ url: `${baseUrl}/exercices?${qs}`, changeFrequency: 'weekly', priority: 0.8 })
    for (const m of f.matieres || []) ajouter(`matiere=${encodeURIComponent(m.slug)}`)
    for (const e of f.examens || []) ajouter(`examen=${encodeURIComponent(e.slug)}`)
    for (const n of f.niveaux || []) {
      ajouter(`niveau=${encodeURIComponent(n.slug)}`)
      const detail = await apiServer(`/contenus?facettes=1&par_page=1&niveau=${encodeURIComponent(n.slug)}`)
      for (const m of (detail.facettes && detail.facettes.matieres) || []) {
        if (m.n > 0) ajouter(`niveau=${encodeURIComponent(n.slug)}&matiere=${encodeURIComponent(m.slug)}`)
      }
    }
  } catch {
    // sans importance : le sitemap reste valable sans ces pages
  }

  return [...pagesStatiques, ...pagesFiltres, ...pagesDocuments, ...pagesContenus]
}