export default function manifest() {
  return {
    id: '/',
    name: 'EduBF',
    short_name: 'EduBF',
    description: "Sujets d'examens, corrigés et QCM pour les élèves et étudiants du Burkina Faso.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'fr',
    background_color: '#ffffff',
    theme_color: '#FF6B35',
       icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Documents', url: '/documents' },
      { name: 'QCM', url: '/concours' },
    ],
  }
}