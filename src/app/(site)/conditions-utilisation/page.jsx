import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: "Conditions d'utilisation — EduBF",
  description: "Conditions d'utilisation de la plateforme EduBF.",
}

export default function ConditionsUtilisation() {
  return (
    <LegalLayout title="Conditions d'utilisation" updated="août 2026">
      <p>
        Les présentes conditions régissent l'utilisation de la plateforme EduBF
        (le "Service"), accessible à l'adresse edubf.net, éditée par des jeunes burkinabé
        . En créant un compte ou en utilisant le Service, tu
        acceptes ces conditions.
      </p>

      <h2>1. Objet du Service</h2>
      <p>
        EduBF est une plateforme éducative  permettant de consulter,
        lire et télécharger des documents pédagogiques (cours, exercices,
        examens) destinés aux élèves et étudiants du Burkina Faso.
      </p>

      <h2>2. Création de compte</h2>
      <p>
        La création d'un compte nécessite un nom, une adresse email valide et
        un mot de passe, ou une connexion via un compte Google. Tu es
        responsable de la confidentialité de tes identifiants et de toute
        activité effectuée depuis ton compte.
      </p>

      <h2>3. Utilisation autorisée</h2>
      <p>
        Les documents mis à disposition sont destinés à un usage personnel et
        éducatif. Il est interdit de les redistribuer commercialement, de
        publier du contenu illégal, diffamatoire ou portant atteinte aux
        droits d'un tiers, ou de tenter de perturber le fonctionnement du
        Service.
      </p>

      <h2>4. Contenu des utilisateurs</h2>
      <p>
        Les commentaires publiés sur les documents doivent rester respectueux.
        EduBF se réserve le droit de modérer ou supprimer tout contenu ne
        respectant pas ces règles, et de suspendre un compte en cas d'abus
        répété.
      </p>

      <h2>5. Disponibilité du Service</h2>
      <p>
        EduBF fait de son mieux pour maintenir le Service accessible, mais ne
        garantit pas une disponibilité continue et ininterrompue.
      </p>

      <h2>6. Évolution du Service</h2>
      <p>
        EduBF peut faire évoluer ses fonctionnalités, y compris introduire des
        options payantes à l'avenir. Toute modification substantielle de ces
        conditions sera annoncée sur cette page.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question relative à ces conditions : <a href="mailto:contact@edubf.net">contact@edubf.net</a>.
      </p>
    </LegalLayout>
  )
}