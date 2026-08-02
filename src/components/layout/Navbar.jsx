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
              <Link href="/mon-compte" className="home-btn-ghost">{firstName}</Link>
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
            <Link href="/mon-compte" onClick={() => setMenuOpen(false)}>Mon compte</Link>
            <Link href="/mes-favoris" className="home-btn-ghost home-btn-ghost-icon" onClick={() => setMenuOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '.3rem', verticalAlign: 'middle' }}>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              Favoris
            </Link>
            <button type="button" onClick={handleLogout} className="mobile-menu-link-btn">Déconnexion</button>
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
        <ThemeToggle />
      </div>
    </>
  )
}