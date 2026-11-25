import Script from 'next/script'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiServer } from '@/lib/api'
import { libelleType } from '@/lib/contenus'
import EnteteContenu, { PiedContenu } from '@/components/contenus/EnteteContenu'
import SujetLecture from '@/components/contenus/SujetLecture'
import SuiviVue from '@/components/contenus/SuiviVue'
import BoutonsTelechargement from '@/components/contenus/BoutonsTelechargement'  
import '@/styles/contenus.css'

// Empêche un titre contenant "</script>" de sortir du bloc JSON-LD
const jsonLdSecurise = (objet) => JSON.stringify(objet).replace(/</g, '\\u003c')

// null si le contenu n'existe pas (ou n'est pas publié) ; toute autre erreur reste une erreur serveur
async function charger(code) {
  try {
    return await apiServer(`/contenus/${code}`)
  } catch (err) {
    if (err.message === 'Contenu introuvable.') return null
    throw err
  }
}

export async function generateMetadata({ params }) {
  const { code } = await params
  try {
    const data = await charger(code)
    if (!data) return { title: 'Contenu introuvable — EduBF', robots: { index: false } }
    const c = data.contenu
    const description = c.description
         || `${libelleType(c.type)} de ${c.matiere}${c.niveau ? ' — ' + c.niveau : ''}${c.examen ? ' · ' + c.examen : ''}. Sujet et corrigé détaillé, gratuits sur EduBF.`
    const canonique = `/s/${c.code}`
    return {
          title: `${c.titre} — ${c.matiere}${c.niveau ? ' ' + c.niveau : ''} — EduBF`,
      description,
      alternates: { canonical: canonique },
      openGraph: { title: c.titre, description, type: 'article', locale: 'fr_FR', siteName: 'EduBF', url: canonique },
      twitter: { card: 'summary', title: c.titre, description },
    }
  } catch {
    return { title: 'Sujet — EduBF', robots: { index: false } }
  }
}

export default async function PageContenu({ params }) {
  const { code } = await params
  const data = await charger(code)
  if (!data) notFound()
  const { contenu: c, document } = data

  return (
    <>
      <Script
        id="json-ld-contenu"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSecurise({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: c.titre,
                     description: c.description || `${libelleType(c.type)} de ${c.matiere}${c.niveau ? ` (${c.niveau})` : ''}`,
            ...(c.niveau ? { educationalLevel: c.niveau } : {}),
            learningResourceType: libelleType(c.type),
            about: c.matiere,
            inLanguage: 'fr',
            isAccessibleForFree: true,
            ...(c.duree_minutes ? { timeRequired: `PT${c.duree_minutes}M` } : {}),
            ...(c.date_publication ? { datePublished: c.date_publication } : {}),
            provider: { '@type': 'Organization', name: 'EduBF' },
          }),
        }}
      />
      <SuiviVue code={c.code} />
      <main className="sujet-page">
            <Link href="/exercices" className="sujet-retour">← Tous les exercices</Link>
        <EnteteContenu contenu={c} />
                <BoutonsTelechargement code={c.code} pdf={c.pdf} />
        <SujetLecture code={c.code} document={document} />
        <PiedContenu contenu={c} />
      </main>
    </>
  )
}