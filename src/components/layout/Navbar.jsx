'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ThemeToggle from './ThemeToggle'

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/documents', label: 'Documents' },
  { href: '/aide', label: 'Aide' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Deconnexion reelle (appel API + reset du contexte)
  const handleLogout = async () => {
    setMenuOpen(false)
    try {
      await logout()
    } finally {
      router.push('/')
    }
  }

  // Ferme le menu mobile a chaque changement de page
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const firstName = user?.nom_complet?.split(' ')[0]

  return (
    <>
      <nav className="home-nav">
        <Link href="/" className="home-logo-link">
          <img src="/images/logo.png" alt="EduBF" className="home-logo-img" />
        </Link>

        <ul className="home-nav-links">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link href={link.href} className={pathname === link.href ? 'active' : ''}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="home-nav-right">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/mes-favoris" className="home-btn-ghost home-btn-ghost-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '.3rem', verticalAlign: 'middle' }}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                Favoris
              </Link>
              <Link
                href="/mon-compte"
                className="home-btn-ghost home-btn-ghost-icon"
                title={user.nom_complet}
                aria-label="Mon compte"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
              <button type="button" onClick={handleLogout} className="home-btn-yellow" style={{ border: 'none', cursor: 'pointer' }}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/connexion" className="home-btn-ghost">Se connecter</Link>
              <Link href="/inscription" className="home-btn-yellow">S'inscrire</Link>
            </>
          )}
        </div>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link href="/" onClick={() => setMenuOpen(false)}>Accueil</Link>
        <Link href="/documents" onClick={() => setMenuOpen(false)}>Documents</Link>
        <Link href="/aide" onClick={() => setMenuOpen(false)}>Aide</Link>
        <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        <div className="mobile-menu-divider" />
        {user ? (
          <>
            <Link href="/mon-compte" onClick={() => setMenuOpen(false)}>
              Mon compte
            </Link>
            <Link
              href="/mes-favoris"
              className="home-btn-ghost-icon"
              onClick={() => setMenuOpen(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              Favoris
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mobile-menu-link-btn mobile-menu-logout"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '.5rem', flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/connexion" onClick={() => setMenuOpen(false)}>Se connecter</Link>
            <Link href="/inscription" className="mobile-btn-yellow" onClick={() => setMenuOpen(false)}>
              S'inscrire gratuitement
            </Link>
          </>
        )}
        <div className="mobile-menu-divider" />
        <ThemeToggle variant="mobile" />
      </div>
    </>
  )
}