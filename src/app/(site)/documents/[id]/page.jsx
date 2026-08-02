import Script from 'next/script'
import { apiServer } from '@/lib/api'
import DocumentClient from '@/components/pages/DocumentClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  try {
    const data = await apiServer(`/documents/${id}`)
    const doc = data.document
    const description = doc.description || `${doc.type_document} — ${doc.cycle}${doc.serie_filiere ? ' · ' + doc.serie_filiere : ''} — ${doc.matiere}. Téléchargement gratuit sur EduBF.`

    return {
      title: `${doc.titre} — EduBF`,
      description,
      openGraph: {
        title: doc.titre,
        description,
        type: 'article',
        locale: 'fr_FR',
        siteName: 'EduBF',
      },
      twitter: {
        card: 'summary',
        title: doc.titre,
        description,
      },
    }
  } catch {
    return { title: 'Document — EduBF' }
  }
}

export default async function DocumentPage({ params }) {
  const { id } = await params
  let initialData = null
  let introuvable = false

  try {
    initialData = await apiServer(`/documents/${id}`)
  } catch {
    introuvable = true
  }

  const doc = initialData?.document

  return (
    <>
      {doc && (
        <Script
          id="json-ld-document"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
      <DocumentClient id={id} initialData={initialData} introuvableInitial={introuvable} />
    </>
  )
}