'use client'

export default function DownloadModal({ etat, pourcentage, message, onAnnuler, onFermer }) {
  if (etat === 'idle') return null

  const enCours = etat === 'preparation' || etat === 'telechargement'
  const indetermine = enCours && (etat === 'preparation' || pourcentage === null)

  const titre = {
    preparation: 'Préparation de ton document…',
    telechargement: pourcentage === null ? 'Téléchargement en cours…' : `Téléchargement… ${pourcentage} %`,
    termine: 'Téléchargement terminé ✓',
    erreur: 'Le téléchargement a échoué',
  }[etat]

  const detail = {
    preparation: 'Nous ajoutons le filigrane EduBF. Cela peut prendre quelques secondes.',
    telechargement: 'Ne ferme pas cette page.',
    termine: 'Le fichier est dans tes téléchargements.',
    erreur: message,
  }[etat]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dl-titre"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.55)', padding: '1rem' }}
    >
      <style>{`@keyframes dl-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-2)', padding: '1.5rem' }}>
        <h3 id="dl-titre" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{titre}</h3>
        <p style={{ margin: '0.5rem 0 1.1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{detail}</p>

        {etat !== 'erreur' && (
          <div style={{ height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
            {indetermine ? (
              <div style={{ width: '30%', height: '100%', borderRadius: 999, background: 'var(--accent)', animation: 'dl-indeterminate 1.2s ease-in-out infinite' }} />
            ) : (
              <div style={{ width: `${etat === 'termine' ? 100 : pourcentage}%`, height: '100%', borderRadius: 999, background: 'var(--accent)', transition: 'width 0.2s' }} />
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
          {enCours && (
            <button onClick={onAnnuler} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer' }}>Annuler</button>
          )}
          {(etat === 'termine' || etat === 'erreur') && (
            <button onClick={onFermer} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 8, padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 600 }}>Fermer</button>
          )}
        </div>
      </div>
    </div>
  )
}