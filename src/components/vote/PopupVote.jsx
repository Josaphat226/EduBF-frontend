'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { lireConsentement, suivre } from '@/lib/analytics'

const URL_VOTE = 'https://lefasodigital.net/concours/vitrine/edubf'
const FIN = new Date('2026-10-23T00:00:00Z').getTime()
const CLE = 'edubf-vote-fait'
const CLE_CLIC = 'edubf-vote-clic'
const DELAI_S = 15
const PAGES_LIBRES = ['/confidentialite', '/mentions-legales', '/cgu']

export default function PopupVote() {
  const pathname = usePathname()
  const [pret, setPret] = useState(false)
  const [clicLe, setClicLe] = useState(null)
  const [maintenant, setMaintenant] = useState(Date.now())

  useEffect(() => {
    if (Date.now() >= FIN) return
    try { if (localStorage.getItem(CLE)) return } catch {}
    try {
      const c = localStorage.getItem(CLE_CLIC)
      if (c) setClicLe(Number(c))
    } catch {}

    let t
    const afficher = () => { t = setTimeout(() => setPret(true), 1500) }
    const h = () => afficher()

    if (lireConsentement()) afficher()
    else window.addEventListener('edubf-consentement', h, { once: true })

    return () => {
      clearTimeout(t)
      window.removeEventListener('edubf-consentement', h)
    }
  }, [])

  const bloque = pret && !PAGES_LIBRES.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    if (!bloque) return
    const ancien = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const i = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => {
      document.body.style.overflow = ancien
      clearInterval(i)
    }
  }, [bloque])

  if (!bloque) return null

  const restant = clicLe
    ? Math.max(0, DELAI_S - Math.floor((maintenant - clicLe) / 1000))
    : null

  const cliquer = () => {
    const n = Date.now()
    try { localStorage.setItem(CLE_CLIC, String(n)) } catch {}
    setClicLe(n)
    setMaintenant(n)
    suivre('vote_popup_clic')
  }

  const aVote = () => {
    try { localStorage.setItem(CLE, '1') } catch {}
    suivre('vote_popup_vote_fait')
    setPret(false)
  }

  return (
    <div className="vote-overlay" role="dialog" aria-modal="true" aria-labelledby="vote-titre">
      <div className="vote-card">
        <img
          src="/vote.png"
          alt=""
          className="vote-img"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h2 id="vote-titre">EduBF est finaliste, ton vote compte !</h2>
        <p>
          Concours National d'Innovation Digitale 2026. Donne la note de <b>10/10</b> à
          EduBF, puis reviens ici et clique sur « J'ai voté » pour continuer.
        </p>
        <a
          className="vote-btn"
          href={URL_VOTE}
          target="_blank"
          rel="noopener noreferrer"
          onClick={cliquer}
        >
          Voter maintenant
        </a>
        {restant !== null && (
          <button
            type="button"
            className="vote-btn vote-ok"
            onClick={aVote}
            disabled={restant > 0}
          >
            {restant > 0 ? `J'ai voté (dans ${restant}s)` : "J'ai voté ✓"}
          </button>
        )}
      </div>
      <style>{`
        .vote-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px}
        .vote-card{background:#fff;color:#1a1a1a;border-radius:18px;max-width:420px;width:100%;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35);max-height:90vh;overflow:auto}
        .vote-img{width:100%;max-height:200px;object-fit:contain;margin-bottom:14px;border-radius:12px}
        .vote-card h2{font-size:1.3rem;margin:0 0 10px}
        .vote-card p{margin:0 0 18px;line-height:1.5;color:#444}
        .vote-btn{display:block;width:100%;padding:13px;border-radius:12px;background:#FF6B35;color:#fff;font-weight:700;border:0;cursor:pointer;text-decoration:none;font-size:1rem;margin-bottom:10px}
        .vote-ok{background:#16a34a}
        .vote-ok:disabled{background:#9ca3af;cursor:not-allowed}
        @media (prefers-color-scheme: dark){.vote-card{background:#1e1e1e;color:#f2f2f2}.vote-card p{color:#bbb}}
      `}</style>
    </div>
  )
}