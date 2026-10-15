'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Analytics from '@/components/analytics/Analytics'
import ConsentBanner from '@/components/analytics/ConsentBanner'
import EnregistrerSW from '@/components/pwa/EnregistrerSW'
  import PopupVote from '@/components/vote/PopupVote'


export default function SiteLayout({ children }) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  // Sur la page d'accueil, le fond decoratif (cercles orange) englobe aussi
  // la navbar, exactement comme dans l'index.ejs original ou la navbar est
  // incluse a l'interieur de .home-wrapper. Sur les autres pages, la navbar
  // reste hors de tout wrapper (meme logique que Layout.jsx cote Vite).
  if (isHome) {
    return (
      <>
        <div className="home-wrapper">
          <div className="deco-circle-1"></div>
          <div className="deco-circle-2"></div>
          <Navbar />
          {children}
        </div>
        <Footer />
        <Analytics />
          <EnregistrerSW />
        <ConsentBanner />
          <PopupVote />
      </>
    )
  }

  

  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <Analytics />
        <EnregistrerSW />
      <ConsentBanner />
        <PopupVote />
    </>
  )
}