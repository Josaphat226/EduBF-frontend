import { apiServer } from '@/lib/api'

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edubf.bf'

  const pagesStatiques = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/documents`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/aide`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/connexion`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/inscription`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  let pagesDocuments = []
  try {
    // On récupère un maximum de documents pour le sitemap.
    // Si /api/documents est paginé, on prend une grande limite pour tout couvrir.
    const data = await apiServer('/documents?page=1&limite=5000')
    pagesDocuments = (data.documents || []).map(doc => ({
      url: `${baseUrl}/documents/${doc.id}`,
      lastModified: doc.date_upload,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  } catch {
    // si l'API échoue, le sitemap garde au moins les pages statiques
  }

  return [...pagesStatiques, ...pagesDocuments]
}