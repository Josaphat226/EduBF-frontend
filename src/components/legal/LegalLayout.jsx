import RetourButton from '@/components/ui/RetourButton'

export default function LegalLayout({ title, updated, children }) {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '70vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>
        <RetourButton />

        <div style={{ marginBottom: '2.5rem' }}>
          <span style={{
            fontSize: '.75rem',
            fontWeight: 700,
            letterSpacing: '.08em',
            color: 'var(--accent)',
            textTransform: 'uppercase',
          }}>
            EduBF
          </span>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '.5rem 0 .4rem',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
            Dernière mise à jour : {updated}
          </p>
        </div>

        <div className="legal-content">
          {children}
        </div>
      </div>
    </div>
  )
}