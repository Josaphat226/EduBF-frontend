import Script from 'next/script'
import { notFound } from 'next/navigation'
import { apiServer } from '@/lib/api'
import DocumentClient from '@/components/pages/DocumentClient'

// Empêche un titre contenant "</script>" de sortir du bloc JSON-LD
const jsonLdSecurise = (objet) => JSON.stringify(objet).replace(/</g, '\\u003c')

export async function generateMetadata({ params }) {
  const { id } = await params
  try {
    const data = await apiServer(`/documents/${id}`)
    const doc = data.document
    const description = doc.description || `${doc.type_document} — ${doc.cycle}${doc.serie_filiere ? ' · ' + doc.serie_filiere : ''} — ${doc.matiere}. Téléchargement gratuit sur EduBF.`

    return {
      title: `${doc.titre} — EduBF`,
      description,
      alternates: { canonical: `/documents/${id}` },
      openGraph: {
        title: doc.titre,
        description,
        type: 'article',
        locale: 'fr_FR',
        siteName: 'EduBF',
        url: `/documents/${id}`,
      },
      twitter: {
        card: 'summary',
        title: doc.titre,
        description,
      },
    }
  } catch {
    return { title: 'Document — EduBF', robots: { index: false } }
  }
}

export default async function DocumentPage({ params }) {
  const { id } = await params
  let initialData

  try {
    initialData = await apiServer(`/documents/${id}`)
  } catch (err) {
    // Vrai 404 uniquement si le document n'existe pas ; toute autre erreur reste une erreur serveur
    if (err.message === 'Document introuvable.') notFound()
    throw err
  }

  const doc = initialData?.document

  return (
    <>
      {doc && (
        <Script
          id="json-ld-document"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdSecurise({
              '@context': 'https://schema.org',
              '@type': 'LearningResource',
              name: doc.titre,
              description: doc.description || `${doc.type_document} pour ${doc.cycle}`,
              educationalLevel: doc.cycle,
              learningResourceType: doc.type_document,
              about: doc.matiere,
              inLanguage: 'fr',
              provider: {
                '@type': 'Organization',
                name: 'EduBF',
              },
            }),
          }}
        />
      )}
      <DocumentClient id={id} initialData={initialData} />
    </>
  )
}