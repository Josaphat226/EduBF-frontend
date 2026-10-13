import { apiServer } from '@/lib/api'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.edubf.net'

export default async function sitemap() {
  const pagesStatiques = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/documents`, changeFrequency: 'daily', priority: 0.9 },
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

  return [...pagesStatiques, ...pagesDocuments]
}