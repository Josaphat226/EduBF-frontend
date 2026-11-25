import { SITE_URL } from '@/lib/site'

export default function robots() {
  const baseUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/mon-compte', '/mes-favoris', '/api', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}