import { sendGAEvent } from '@next/third-parties/google'

export const CLE_CONSENTEMENT = 'edubf-consentement'

export function lireConsentement() {
  try { return localStorage.getItem(CLE_CONSENTEMENT) } catch { return null }
}

// Envoie un événement seulement si le visiteur a accepté et que Google Analytics est chargé.
export function suivre(nom, params = {}) {
  if (typeof window === 'undefined') return
  if (lireConsentement() !== 'accepte') return
  if (!window.dataLayer) return
  try { sendGAEvent('event', nom, params) } catch {}
}

// Transforme chaque appel réussi au backend en événement (voir l'étape 6).
export function suivreReponseApi(reponse) {
  try {
    const methode = (reponse.config?.method || 'get').toLowerCase()
    const url = String(reponse.config?.url || '').split('?')[0]
    const params = reponse.config?.params || {}
    let m

    if (methode === 'post' && url === '/auth/register') suivre('inscription')
    else if (methode === 'post' && url === '/auth/login') suivre('connexion')
    else if (methode === 'post' && url === '/auth/forgot-password') suivre('mot_de_passe_oublie')
    else if (methode === 'post' && url === '/contact') suivre('contact_envoye')
    else if (methode === 'post' && url === '/newsletter/abonner') suivre('newsletter_inscription')
    else if (methode === 'get' && (m = url.match(/^\/documents\/(\d+)\/telecharger$/))) suivre('telechargement_document', { document_id: m[1] })
    else if (methode === 'get' && (m = url.match(/^\/documents\/(\d+)\/lire$/))) suivre('lecture_document', { document_id: m[1] })
    else if (methode === 'post' && (m = url.match(/^\/documents\/(\d+)\/favori$/))) suivre('favori_modifie', { document_id: m[1] })
    else if (methode === 'post' && (m = url.match(/^\/documents\/(\d+)\/commentaires$/))) suivre('commentaire_publie', { document_id: m[1] })
    else if (methode === 'post' && url === '/concours/sessions') suivre('qcm_demarre', { nb_questions: reponse.data?.nb_questions })
    else if (methode === 'post' && /^\/concours\/sessions\/\d+\/reponses$/.test(url)) suivre('qcm_question_repondue')
    else if (methode === 'put' && /^\/concours\/sessions\/\d+\/terminer$/.test(url)) suivre('qcm_termine', { score: reponse.data?.score })
    else if (methode === 'get' && url === '/documents' && params.recherche) suivre('recherche_document', { terme: String(params.recherche).slice(0, 80) })
  } catch {}
}