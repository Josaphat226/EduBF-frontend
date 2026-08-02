// Bloc gris anime, utilise pendant le chargement a la place d'un simple texte
// "Chargement..." — donne une impression de fluidite (l'utilisateur voit deja
// la forme du contenu a venir).
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, var(--bg-alt) 25%, var(--border, #E2E8F0) 50%, var(--bg-alt) 75%)',
        backgroundSize: '200% 100%',
        animation: 'edubf-skeleton-shimmer 1.4s ease-in-out infinite',
        borderRadius: '8px',
        ...style,
      }}
    />
  )
}

// Reproduit la structure d'une carte .doc-item-new pendant le chargement
export function DocCardSkeleton() {
  return (
    <div className="doc-item-new" style={{ cursor: 'default', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <Skeleton style={{ width: 70, height: 20, borderRadius: 999 }} />
        <Skeleton style={{ width: 40, height: 16 }} />
      </div>
      <Skeleton style={{ width: '90%', height: 20, marginBottom: '0.6rem' }} />
      <Skeleton style={{ width: '60%', height: 20, marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <Skeleton style={{ width: 60, height: 22, borderRadius: 999 }} />
        <Skeleton style={{ width: 60, height: 22, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton style={{ width: 80, height: 14 }} />
        <Skeleton style={{ width: 50, height: 14 }} />
      </div>
    </div>
  )
}

export function DocGridSkeleton({ count = 6 }) {
  return (
    <div className="docs-grid-new">
      {Array.from({ length: count }).map((_, i) => (
        <DocCardSkeleton key={i} />
      ))}
    </div>
  )
}