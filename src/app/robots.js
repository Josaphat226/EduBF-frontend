export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edubf.bf'

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