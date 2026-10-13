export const metadata = { title: 'Hors ligne | EduBF', robots: { index: false } }

export default function HorsLigne() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#0F172A' }}>
      <img src="/icons/icon-192.png" alt="EduBF" width={96} height={96} style={{ borderRadius: 20 }} />
      <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Pas de connexion</h1>
      <p style={{ margin: 0, color: '#475569', maxWidth: 320 }}>Vérifie ta connexion internet, puis réessaie. Tes documents se chargent uniquement en ligne.</p>
      <a href="/" style={{ background: '#C2410C', color: '#fff', padding: '12px 22px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>Réessayer</a>
    </main>
  )
}