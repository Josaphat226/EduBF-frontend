import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { apiServer } from '@/lib/api'
import { libelleType, formaterPoints } from '@/lib/contenus'
import SujetLecture from '@/components/contenus/SujetLecture'
import ImpressionActions from '@/components/contenus/ImpressionActions'
import '@/styles/contenus.css'
import { SITE_URL } from '@/lib/site'

const SITE = SITE_URL

async function charger(code) {
  try {
    return await apiServer(`/contenus/${code}`)
  } catch (err) {
    if (err.message === 'Contenu introuvable.') return null
    throw err
  }
}

export async function generateMetadata({ params, searchParams }) {
  const { code } = await params
  const corrige = (await searchParams).corrige === '1'
  const data = await charger(code).catch(() => null)
  return {
    title: data ? `${data.contenu.titre} — ${corrige ? 'corrigé' : 'sujet'} à imprimer — EduBF` : 'Sujet — EduBF',
    robots: { index: false, follow: false }, // la page de lecture reste la seule page indexée
  }
}

export default async function PageImpression({ params, searchParams }) {
  const { code } = await params
  const corrige = (await searchParams).corrige === '1'
  const data = await charger(code)
  if (!data) notFound()
  const { contenu: c, document } = data

  // Le QR code renvoie vers la page du contenu : une feuille imprimée reste valable
  const qr = await QRCode.toString(`${SITE}/s/${c.code}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })
  const reference = `EDU-${c.code} · v${c.version.numero}`
  const bareme = c.bareme_total != null && Number(c.bareme_total) > 0 ? formaterPoints(Number(c.bareme_total)) : ''
  // Ni durée ni année scolaire dans l'en-tête
  const sousTitre = [libelleType(c.type), c.examen, bareme].filter(Boolean).join(' · ')

  return (
    <div className={`imp-page ${corrige ? 'mode-corrige' : 'mode-sujet'}`}>
      {/* Pied de page de chaque feuille (selon le navigateur) : site à gauche, page au centre, référence à droite */}
      <style>{`@page { size: A4; margin: 14mm 14mm 18mm; @bottom-left { content: "edubf.net"; font-size: 8pt; color: #555; } @bottom-center { content: "Page " counter(page) " / " counter(pages); font-size: 8pt; color: #555; } @bottom-right { content: "${reference}"; font-size: 8pt; color: #555; } }`}</style>

      {/* Filigrane répété sur chaque page imprimée */}
      <div className="imp-filigrane" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="" />
      </div>

      <ImpressionActions code={c.code} corrige={corrige} />

      <header className="imp-entete">
        <div className="imp-entete-gauche">
          <p className="imp-organisme">EduBF</p>
          <p className="imp-devise">edubf.net</p>
          {c.niveau && <p className="imp-ligne"><strong>CLASSE :</strong> {c.niveau}</p>}
          {c.matiere && <p className="imp-ligne"><strong>DISCIPLINE :</strong> {c.matiere}</p>}
        </div>
        <div className="imp-entete-centre">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="imp-logo" src="/images/logo.png" alt="EduBF" />
        </div>
        <div className="imp-qr">
          <div role="img" aria-label={`QR code vers ${SITE}/s/${c.code}`} dangerouslySetInnerHTML={{ __html: qr }} />
          <p>EDU-{c.code}</p>
        </div>
      </header>

      <div className="imp-bloc-titre">
        <h1 className="imp-titre">{c.titre}{corrige ? ' — Corrigé' : ''}</h1>
        {sousTitre && <p className="imp-sous-titre">{sousTitre}</p>}
      </div>

      <div className="imp-contenu">
        <SujetLecture code={null} document={document} />
      </div>
      <p className="imp-pied">
        {c.origine === 'externe' && c.source_nom ? `Source : ${c.source_nom}${c.licence ? ` · ${c.licence}` : ''}. ` : 'Contenu original EduBF. '}
        {reference} — retrouvez la version en ligne sur {SITE.replace(/^https?:\/\//, '')}/s/{c.code}
      </p>
    </div>
  )
}