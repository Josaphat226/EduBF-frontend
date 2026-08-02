import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans-loaded' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display-loaded' })

export const metadata = {
  title: {
    default: 'EduBF — Réussis tes examens',
    template: '%s',
  },
  description: "EduBF — La plateforme nationale de ressources éducatives du Burkina Faso.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://edubf.bf'),
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}