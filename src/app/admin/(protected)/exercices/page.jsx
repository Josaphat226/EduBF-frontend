'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { TYPES, etatContenu, libelleType } from '@/components/admin/contenus/informations'
import '@/styles/editeur.css'

const PAR_PAGE = 20
const ETATS = [
  { valeur: 'brouillon', libelle: 'Brouillon' },
  { valeur: 'relu', libelle: 'Relu' },
  { valeur: 'publie', libelle: 'Publié' },
  { valeur: 'depublie', libelle: 'Retiré' },
]

const dateCourte = (iso) => (iso ? new Date(iso).toISOString().substring(0, 10) : '')

export default function AdminExercices() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState(null)
  const [erreur, setErreur] = useState('')

  const filtres = {
    q: searchParams.get('q') || '',
    etat: searchParams.get('etat') || '',
    type: searchParams.get('type') || '',
  }
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const charger = useCallback(() => {
    api.get('/admin/contenus', { params: { ...filtres, limit: PAR_PAGE, offset: (page - 1) * PAR_PAGE } })
      .then((res) => { setData(res.data); setErreur('') })
      .catch((e) => setErreur(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => { charger() }, [charger])

  function aller(params) {
    router.push(`${pathname}${params.toString() ? '?' + params.toString() : ''}`)
  }

  function updateFiltre(cle, valeur) {
    const next = new URLSearchParams(searchParams.toString())
    if (valeur) next.set(cle, valeur)
    else next.delete(cle)
    next.delete('page')
    aller(next)
  }

  function allerPage(p) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('page', p)
    aller(next)
  }

  async function basculerEnLigne(c) {
    try {
      await api.patch(`/admin/contenus/${c.id}/actif`, { actif: !c.actif })
      charger()
    } catch (e) { setErreur(e.message) }
  }

  async function supprimer(c) {
       if (!confirm(`Supprimer définitivement « ${c.titre} » ?\n\nSes versions, ses PDF et son historique de vues seront effacés. Cette action est irréversible.`)) return
    try {
      await api.delete(`/admin/contenus/${c.id}`)
      charger()
    } catch (e) { setErreur(e.message) }
  }

  if (!data) {
    return erreur
      ? <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreur}</div>
      : <p className="ctn-chargement">Chargement…</p>
  }

  const { contenus, total } = data
  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE))
  const aDesFiltres = filtres.q || filtres.etat || filtres.type

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Exercices corrigés</h1>
          <p className="admin-page-sub">{total} contenu{total > 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/exercices/nouveau" className="btn-admin btn-admin-primary">+ Nouveau contenu</Link>
      </div>

      {erreur && <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreur}</div>}

      <div className="admin-filters-bar">
        <div className="admin-filters-form">
          <div className="admin-filter-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              defaultValue={filtres.q}
              placeholder="Rechercher un titre…"
              onKeyDown={(e) => { if (e.key === 'Enter') updateFiltre('q', e.target.value) }}
            />
          </div>
          <select value={filtres.etat} onChange={(e) => updateFiltre('etat', e.target.value)} aria-label="Filtrer par état">
            <option value="">Tous les états</option>
            {ETATS.map((x) => <option key={x.valeur} value={x.valeur}>{x.libelle}</option>)}
          </select>
          <select value={filtres.type} onChange={(e) => updateFiltre('type', e.target.value)} aria-label="Filtrer par type">
            <option value="">Tous les types</option>
            {TYPES.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
          </select>
          {aDesFiltres && <button className="btn-admin btn-admin-ghost" onClick={() => aller(new URLSearchParams())}>Réinitialiser</button>}
        </div>
      </div>

      <div className="admin-table-card">
        <table>
          <thead>
            <tr><th>Contenu</th><th>Type</th><th>Classement</th><th>État</th><th>Modifié</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {contenus.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem' }}>
                {aDesFiltres ? 'Aucun contenu ne correspond à ces filtres.' : 'Aucun contenu pour l’instant. Créez le premier avec « Nouveau contenu ».'}
              </td></tr>
            )}
            {contenus.map((c) => {
              const etat = etatContenu(c)
              const enLigne = c.actif && c.version_publiee
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/exercices/${c.id}`} className="ctn-titre-lien">{c.titre}</Link>
                    <div className="ctn-code">EDU-{c.code}</div>
                  </td>
                  <td><span className="badge badge-gray">{libelleType(c.type)}</span></td>
                  <td className="ctn-classement">
                    {c.matiere}{c.niveau ? ` · ${c.niveau}` : ''}
                    {c.examen && <div className="ctn-code">{c.examen}</div>}
                  </td>
                  <td><span className={`ctn-etat ctn-etat-${etat.cle}`}>{etat.libelle}</span></td>
                  <td className="ctn-date">{dateCourte(c.date_modification)}</td>
                  <td>
                    <div className="ctn-actions-ligne">
                      <Link href={`/admin/exercices/${c.id}`} className="ctn-lien-action">Modifier</Link>
                      {enLigne && <a href={`/s/${c.code}`} target="_blank" rel="noreferrer" className="ctn-lien-action">Voir</a>}
                      {c.version_publiee && (
                        <button type="button" className="ctn-lien-action" onClick={() => basculerEnLigne(c)}>{c.actif ? 'Retirer' : 'Remettre en ligne'}</button>
                      )}
                                          {(!c.version_publiee || !c.actif) && (
                        <button type="button" className="ctn-lien-action ctn-lien-danger" onClick={() => supprimer(c)}>Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          {page > 1 && <button className="page-btn" onClick={() => allerPage(page - 1)}>← Précédent</button>}
          <div className="page-info">Page {page} / {totalPages}</div>
          {page < totalPages && <button className="page-btn" onClick={() => allerPage(page + 1)}>Suivant →</button>}
        </div>
      )}
    </>
  )
}
