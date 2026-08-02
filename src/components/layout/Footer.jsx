'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="home-footer">
      <div className="footer-top">
        <div className="home-container footer-top-inner">

          <div className="footer-col footer-col-brand">
            <div className="footer-brand">
              <img src="/images/logo.png" alt="EduBF" className="footer-logo-img" />
              <div className="footer-brand-tagline" style={{ marginTop: '.4rem' }}>
                Plateforme éducative nationale
              </div>
            </div>
            <div className="footer-social">
              <a href="#" className="footer-soc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a href="#" className="footer-soc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
              </a>
              <a href="#" className="footer-soc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </a>
              <a href="#" className="footer-soc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Liens rapides</h4>
            <ul className="footer-links">
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/documents">Documents</Link></li>
              <li><Link href="/inscription">S'inscrire</Link></li>
              <li><Link href="/connexion">Se connecter</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Examens</h4>
            <ul className="footer-links">
              <li><Link href="/documents?cycle=BEPC">BEPC</Link></li>
              <li><Link href="/documents?cycle=BAC">BAC</Link></li>
              <li><Link href="/documents?cycle=BEP">BEP</Link></li>
              <li><Link href="/documents?cycle=CAP">CAP</Link></li>
              <li><Link href="/documents?cycle=BTS">BTS</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Contact</h4>
            <ul className="footer-contact-list">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Ouagadougou, Burkina Faso
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                contact@edubf.bf
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Rester informé</h4>
            <p className="footer-newsletter-desc">Reçois les nouvelles ressources directement.</p>
            <form className="footer-newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Ton adresse email" />
              <button type="submit">S'abonner</button>
            </form>
          </div>

        </div>
      </div>

      <div className="footer-bottom">
        <div className="home-container footer-bottom-inner">
          <span>&copy; 2026 EduBF. Tous droits réservés.</span>
          <span>Conçu pour les élèves du Burkina Faso</span>
        </div>
      </div>
    </footer>
  )
}