'use client'

import { useContext, useState } from 'react'
import { api } from '@/lib/api'
import Modale from './Modale'
import { ContexteMedias } from './contexte'

export default function DialogueFigure({ initial = {}, onValider, onFermer }) {
  const base = useContext(ContexteMedias)
  const [src, setSrc] = useState(initial.src || '')
  const [alt, setAlt] = useState(initial.alt || '')
  const [legende, setLegende] = useState(initial.legende || '')
  const [credit, setCredit] = useState(initial.credit || '')
  const [largeur, setLargeur] = useState(initial.largeur_pct ? String(initial.largeur_pct) : '')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [retires, setRetires] = useState([])

  async function choisir(e) {
    const fichier = e.target.files[0]
    if (!fichier) return
    setEnvoi(true); setErreur(''); setRetires([])
    try {
      const fd = new FormData()
      fd.append('fichier', fichier)
           const r = await api.post('/admin/contenus/medias', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSrc(r.data.src)
      setRetires(r.data.retires || [])
    } catch (err) { setErreur(err.message) }
    finally { setEnvoi(false) }
  }

  const pret = src && alt.trim() && !envoi
  return (
    <Modale
      titre="Schéma ou image"
      onFermer={onFermer}
      pied={<>
        <button type="button" className="btn-admin btn-admin-ghost" onClick={onFermer}>Annuler</button>
        <button type="button" className="btn-admin btn-admin-primary" disabled={!pret}
          onClick={() => onValider({ src, alt: alt.trim(), legende: legende.trim() || null, credit: credit.trim() || null, largeur_pct: largeur ? Number(largeur) : null })}>Valider</button>
      </>}
    >
      <div className="adoc-field">
        <label htmlFor="fig-fichier">Fichier (SVG de préférence, PNG, JPEG ou WebP, 2 Mo maximum)</label>
        <input id="fig-fichier" type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/*" onChange={choisir} />
      </div>
      {envoi && <p className="ctn-aide">Envoi en cours…</p>}
      {erreur && <div className="ctn-alerte ctn-alerte-erreur" role="alert">{erreur}</div>}
      {retires.length > 0 && <div className="ctn-alerte ctn-alerte-attention">Éléments retirés par sécurité : {retires.join(', ')}</div>}
      {src && <div className="ed-figure-apercu"><img src={base + src} alt="Aperçu" /></div>}
      <div className="adoc-field">
        <label htmlFor="fig-alt">Description <span className="adoc-required">*</span> <span className="ctn-aide">(lue par les lecteurs d’écran, ex : « Circuit série avec une pile et une résistance »)</span></label>
        <input id="fig-alt" type="text" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
      </div>
      <div className="adoc-field">
        <label htmlFor="fig-legende">Légende</label>
        <input id="fig-legende" type="text" value={legende} onChange={(e) => setLegende(e.target.value)} placeholder="Ex : Figure 1" maxLength={300} />
      </div>
      <div className="adoc-field">
        <label htmlFor="fig-credit">Crédit / source <span className="ctn-aide">(auteur et licence, ou « Schéma EduBF »)</span></label>
        <input id="fig-credit" type="text" value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={300} />
      </div>
      <div className="adoc-field">
        <label htmlFor="fig-largeur">Largeur</label>
        <select id="fig-largeur" value={largeur} onChange={(e) => setLargeur(e.target.value)}>
          <option value="">Automatique</option><option value="40">40 %</option><option value="60">60 %</option><option value="80">80 %</option><option value="100">100 %</option>
        </select>
      </div>
    </Modale>
  )
}