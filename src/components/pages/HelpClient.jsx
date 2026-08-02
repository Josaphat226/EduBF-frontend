'use client'

import { useState, useEffect } from 'react'

const ARTICLES_DEBUTER = [
  { cat: 'Premiers pas', question: 'Comment créer un compte gratuitement ?', reponse: "Pour créer un compte gratuitement sur EduBF, clique sur le bouton 'S'inscrire' en haut à droite. Remplis le formulaire avec ton nom, ton email et un mot de passe, puis valide ton compte via l'email de confirmation reçu. C'est 100% gratuit !" },
  { cat: 'Premiers pas', question: 'Comment se connecter à EduBF ?', reponse: "Pour te connecter à EduBF, clique sur 'Connexion' en haut à droite, entre ton adresse email et ton mot de passe, puis clique sur 'Se connecter'. Si tu as oublié ton mot de passe, utilise le lien 'Mot de passe oublié'." },
  { cat: 'Découverte', question: "Qu'est-ce qu'EduBF et à qui s'adresse-t-il ?", reponse: 'EduBF est une plateforme éducative gratuite destinée aux étudiants du Burkina Faso. Elle permet de partager et télécharger des cours, exercices, examens et autres ressources pédagogiques par filière et niveau.' },
  { cat: 'Recherche', question: 'Comment trouver un document par filière ?', reponse: "Utilise la barre de recherche et sélectionne ta filière dans les filtres. Tu peux aussi naviguer par catégorie depuis la page d'accueil ou la section 'Documents'." },
  { cat: 'Recherche', question: 'Comment utiliser les filtres de recherche ?', reponse: "Sur la page des documents, tu peux filtrer par : filière, niveau, type de document (cours, exercice, examen), date d'ajout et popularité." },
  { cat: 'Téléchargement', question: 'Comment télécharger mon premier document ?', reponse: "Clique sur le document qui t'intéresse, puis sur le bouton 'Télécharger'. Si tu n'es pas connecté, tu seras invité à te connecter ou créer un compte." },
  { cat: 'Compte', question: 'Comment compléter mon profil ?', reponse: "Va dans 'Mon compte' puis 'Mon profil'. Tu peux ajouter une photo, ta filière, ton établissement et tes centres d'intérêt." },
  { cat: 'Général', question: 'EduBF est-il vraiment gratuit ?', reponse: "Oui, EduBF est entièrement gratuit. Aucun paiement n'est requis pour télécharger ou partager des documents. Nous croyons en l'éducation accessible à tous." },
  { cat: 'Communauté', question: 'Comment laisser un commentaire sur un document ?', reponse: "Sur la page d'un document, descends jusqu'à la section commentaires. Connecte-toi, écris ton message et clique sur 'Publier'." },
]

const ARTICLES_PROBLEMES = [
  { cat: 'Connexion', question: "J'ai oublié mon mot de passe, que faire ?", reponse: "Clique sur 'Mot de passe oublié' sur la page de connexion. Saisis ton email, tu recevras un lien pour réinitialiser ton mot de passe." },
  { cat: 'Connexion', question: 'Mon compte est suspendu, pourquoi ?', reponse: "Un compte peut être suspendu en cas de non-respect des conditions d'utilisation. Contacte-nous via le formulaire pour plus d'informations." },
  { cat: 'Téléchargement', question: "Je n'arrive pas à télécharger un document.", reponse: 'Vérifie ta connexion internet, vide le cache de ton navigateur, ou essaye avec un autre navigateur. Si le problème persiste, contacte-nous.' },
  { cat: 'Téléchargement', question: "J'ai atteint ma limite de téléchargements.", reponse: "EduBF n'impose pas de limite de téléchargement. Si tu rencontres un message de limite, contacte rapidement notre support." },
  { cat: 'Documents', question: 'Un document est illisible ou corrompu.', reponse: "Essaie de télécharger à nouveau le document. Si le problème continue, signale-le via le bouton 'Signaler' sur la page du document." },
  { cat: 'Documents', question: 'Je ne trouve pas le document que je cherche.', reponse: "Essaie avec d'autres mots-clés dans la recherche, ou utilise les filtres. Tu peux aussi faire une demande via notre formulaire de contact." },
  { cat: 'Commentaires', question: "Mon commentaire n'apparaît pas, pourquoi ?", reponse: 'Les commentaires peuvent être vérifiés avant publication pour éviter les abus. Attends quelques minutes ou contacte-nous si le problème persiste.' },
  { cat: 'Compte', question: 'Comment supprimer mon compte ?', reponse: "Va dans 'Mon compte' > 'Paramètres' > 'Supprimer mon compte'. Cette action est irréversible, tous tes documents seront supprimés." },
  { cat: 'Signalement', question: 'Comment signaler un document incorrect ?', reponse: "Sur la page du document, clique sur 'Signaler', choisis la raison et envoie. Notre équipe examinera rapidement le signalement." },
]

export default function HelpClient() {
  const [tab, setTab] = useState('debuter')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // { question, reponse } | null

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') setModal(null)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const articles = tab === 'debuter' ? ARTICLES_DEBUTER : ARTICLES_PROBLEMES
  const term = search.toLowerCase().trim()
  const filtres = term
    ? articles.filter(a =>
        a.question.toLowerCase().includes(term) ||
        a.cat.toLowerCase().includes(term)
      )
    : articles

  function openModal(article) {
    setModal(article)
  }

  return (
    <>
      {/* HERO */}
      <div className="aide-hero">
        <div className="aide-blob-l"></div>
        <div className="aide-blob-r"></div>
        <div className="aide-blob-sm"></div>
        <h1 className="aide-hero-title">Comment pouvons-nous t'aider ?</h1>
        <div className="aide-search-wrap">
          <input
            type="text"
            placeholder="Tape ta question..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="aide-tabs-bar">
        <a
          className={`aide-tab ${tab === 'debuter' ? 'active' : ''}`}
          href="#"
          onClick={e => { e.preventDefault(); setTab('debuter'); setSearch('') }}
        >
          Débuter sur EduBF
        </a>
        <a
          className={`aide-tab ${tab === 'problemes' ? 'active' : ''}`}
          href="#"
          onClick={e => { e.preventDefault(); setTab('problemes'); setSearch('') }}
        >
          Problèmes &amp; Questions
        </a>
      </div>

      {/* ARTICLES */}
      <div className="aide-content">
        <h2 className="aide-section-title">Articles mis en avant</h2>

        <div className="aide-articles-grid" style={{ display: 'grid' }}>
          {filtres.map(article => (
            <div
              key={article.question}
              className="aide-article-item"
              style={{ cursor: 'pointer' }}
              onClick={() => openModal(article)}
            >
              <div className="aide-article-cat">{article.cat}</div>
              <a
                className="aide-article-title"
                href="#"
                onClick={e => { e.preventDefault(); openModal(article) }}
              >
                {article.question}
              </a>
            </div>
          ))}
          {filtres.length === 0 && (
            <div className="no-results-msg">Aucun article ne correspond à ta recherche. Essaie d'autres mots-clés !</div>
          )}
        </div>

        {/* CARTES CONTACT */}
        <div className="aide-contact-row">
          <div className="aide-contact-card">
            <div className="aide-contact-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Nous contacter</h3>
            <p>Une question ? Envoie-nous un message, on répond sous 24h.</p>
            <a className="aide-contact-btn" href="/contact">Envoyer un message</a>
          </div>
          <div className="aide-contact-card">
            <div className="aide-contact-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <h3>Parcourir les documents</h3>
            <p>Accède directement à tous les cours et sujets disponibles.</p>
            <a className="aide-contact-btn" href="/documents">Voir les documents</a>
          </div>
          <div className="aide-contact-card">
            <div className="aide-contact-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3>Créer un compte</h3>
            <p>Inscris-toi gratuitement pour télécharger sans limite.</p>
            <a className="aide-contact-btn" href="/inscription">S'inscrire</a>
          </div>
        </div>
      </div>

      {/* MODAL (CARTE DE RÉPONSE) */}
      {modal && (
        <div id="answerModal" className="answer-modal" style={{ display: 'flex' }}>
          <div className="modal-overlay" onClick={() => setModal(null)}></div>
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modal.question.charAt(0).toUpperCase() + modal.question.slice(1)}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>{modal.reponse}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-close-btn" onClick={() => setModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}