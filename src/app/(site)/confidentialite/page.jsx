import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: 'Politique de confidentialité — EduBF',
  description: 'Comment EduBF collecte, utilise et protège tes données personnelles.',
}

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="août 2026">
      <p>
        EduBF attache de l'importance à la
        protection de tes données personnelles. Ce traitement est conforme à
        la loi burkinabè n°001-2021/AN du 30 mars 2021 portant protection des
        personnes à l'égard du traitement des données à caractère personnel,
        dont le respect est contrôlé par la Commission de l'Informatique et
        des Libertés (CIL).
      </p>

      <h2>1. Données collectées</h2>
      <p>Lors de la création d'un compte, nous collectons :</p>
      <ul>
        <li>Ton nom complet et ton adresse email</li>
        <li>Ton mot de passe, stocké de façon chiffrée (jamais en clair)</li>
        <li>Si tu utilises "Continuer avec Google" : ton nom et ton email transmis par Google</li>
      </ul>
      <p>
        Nous collectons aussi automatiquement certaines données d'usage :
        documents consultés, favoris, commentaires, et un cookie de session
        nécessaire pour te garder connecté.
      </p>

      <h2>2. Utilisation des données</h2>
      <p>Ces données servent uniquement à :</p>
      <ul>
        <li>Créer et sécuriser ton compte</li>
        <li>Te permettre de lire et télécharger des documents</li>
        <li>Te proposer des recommandations de documents pertinents</li>
        <li>Te contacter en cas de réinitialisation de mot de passe ou de message via le formulaire de contact</li>
      </ul>
      <p>Nous ne vendons ni ne partageons tes données à des fins publicitaires.</p>

      
      <h2>3. Durée de conservation</h2>
      <p>
        Tes données sont conservées tant que ton compte est actif. Tu peux
        demander leur suppression à tout moment (voir section 6).
      </p>

      <h2>4. Cookies</h2>
      <p>
        EduBF utilise un cookie strictement nécessaire au fonctionnement du
        Service (maintien de ta session de connexion). Aucun cookie
        publicitaire ou de suivi tiers n'est utilisé.
      </p>

      <h2>5. Tes droits</h2>
      <p>
        Conformément à la loi n°001-2021/AN, tu disposes d'un droit d'accès,
        de rectification, de suppression et d'opposition concernant tes
        données personnelles. Pour exercer ces droits, écris-nous à{' '}
        <a href="mailto:contact@edubf.net">contact@edubf.net</a>. 
      </p>

      <h2>6. Contact</h2>
      <p>
        Pour toute question sur cette politique : <a href="mailto:contact@edubf.net">contact@edubf.net</a>.
      </p>
    </LegalLayout>
  )
}