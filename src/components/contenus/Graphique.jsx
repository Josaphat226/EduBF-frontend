// Graphiques des sujets (nœud « graphique » du format EduBF), dessinés en SVG :
// aucune bibliothèque, aucun JavaScript côté navigateur, donc un rendu identique
// à l'écran et à l'impression, et pas de poids ajouté à la page.
//
// attrs : { graphique_type, titre, axe_x: { label, categories }, axe_y: { label, min, max },
//           series: [{ nom, valeurs } ou { nom, points: [{x, y}] }] }

const COULEURS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4']
const L = 520
const H = 320
const M = { g: 58, d: 18, h: 42, b: 58 } // marges : gauche, droite, haut, bas
const PW = L - M.g - M.d // largeur de la zone de tracé
const PH = H - M.h - M.b // hauteur de la zone de tracé

const LIBELLES = {
  barres: 'diagramme en barres',
  histogramme: 'histogramme',
  courbe: 'courbe',
  nuage: 'nuage de points',
  secteurs: 'diagramme circulaire',
}

const fmt = (n) => String(Math.round(n * 100) / 100).replace('.', ',')
const tronquer = (t, max = 12) => (String(t).length > max ? String(t).slice(0, max - 1) + '…' : String(t))

// Graduations « rondes » (1, 2, 5, 10 × puissance de 10) couvrant [min, max]
function echelle(min, max, cible = 5) {
  if (!(max > min)) max = min + 1
  const brut = (max - min) / cible
  const puissance = Math.pow(10, Math.floor(Math.log10(brut)))
  const fraction = brut / puissance
  const pas = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * puissance
  const debut = Math.floor(min / pas + 1e-9) * pas
  const fin = Math.ceil(max / pas - 1e-9) * pas
  const graduations = []
  for (let v = debut; v <= fin + pas * 1e-6; v += pas) graduations.push(Number(v.toFixed(10)))
  return { min: debut, max: fin, graduations }
}

// Applique les bornes imposées par l'auteur (axe_y.min / axe_y.max) s'il y en a,
// et recalcule les graduations sur l'intervalle obtenu.
function bornes(e, axe) {
  const imposeMin = axe && Number.isFinite(axe.min)
  const imposeMax = axe && Number.isFinite(axe.max)
  if (!imposeMin && !imposeMax) return e
  const min = imposeMin ? axe.min : e.min
  const max = imposeMax ? axe.max : e.max
  if (!(max > min)) return e // bornes incohérentes : on garde l'échelle calculée
  const graduations = echelle(min, max).graduations.filter((v) => v >= min - 1e-9 && v <= max + 1e-9)
  return { min, max, graduations }
}

const pointsDe = (s) => s.points || (s.valeurs || []).map((v, i) => ({ x: i + 1, y: v }))

function Cadre({ ey, ex, labelX, labelY, enfants, categories, n }) {
  const yPx = (v) => M.h + PH - ((v - ey.min) / (ey.max - ey.min)) * PH
  return (
    <g>
      {ey.graduations.map((v) => (
        <g key={v}>
          <line x1={M.g} x2={M.g + PW} y1={yPx(v)} y2={yPx(v)} stroke="currentColor" strokeOpacity="0.14" />
          <text x={M.g - 8} y={yPx(v) + 4} textAnchor="end" fontSize="11" fill="currentColor">{fmt(v)}</text>
        </g>
      ))}
      <line x1={M.g} x2={M.g} y1={M.h} y2={M.h + PH} stroke="currentColor" strokeOpacity="0.55" />
      <line x1={M.g} x2={M.g + PW} y1={yPx(Math.max(ey.min, Math.min(0, ey.max)))} y2={yPx(Math.max(ey.min, Math.min(0, ey.max)))} stroke="currentColor" strokeOpacity="0.55" />
      {categories && categories.map((c, i) => (
        (n <= 10 || i % 2 === 0) && (
          <text key={i} x={M.g + ((i + 0.5) / n) * PW} y={M.h + PH + 18} textAnchor="middle" fontSize="11" fill="currentColor">{tronquer(c)}</text>
        )
      ))}
      {ex && ex.graduations.map((v) => {
        const x = M.g + ((v - ex.min) / (ex.max - ex.min)) * PW
        return (
          <g key={v}>
            <line x1={x} x2={x} y1={M.h + PH} y2={M.h + PH + 4} stroke="currentColor" strokeOpacity="0.55" />
            <text x={x} y={M.h + PH + 18} textAnchor="middle" fontSize="11" fill="currentColor">{fmt(v)}</text>
          </g>
        )
      })}
      {labelX && <text x={M.g + PW / 2} y={H - 10} textAnchor="middle" fontSize="12" fill="currentColor">{labelX}</text>}
      {labelY && <text transform={`translate(14 ${M.h + PH / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="currentColor">{labelY}</text>}
      {enfants(yPx)}
    </g>
  )
}

function Barres({ series, categories, axeX, axeY, contigu }) {
  const n = Math.max(...series.map((s) => (s.valeurs || []).length), 1)
  const tous = series.flatMap((s) => s.valeurs || [])
  const ey = bornes(echelle(Math.min(0, ...tous), Math.max(0, ...tous)), axeY)
  const etiquettes = categories || Array.from({ length: n }, (_, i) => String(i + 1))
  const bande = PW / n
  const marge = contigu ? 0 : bande * 0.1
  const largeur = (bande - 2 * marge) / series.length
  return (
    <Cadre ey={ey} categories={etiquettes} n={n} labelX={axeX && axeX.label} labelY={axeY && axeY.label}
      enfants={(yPx) => series.map((s, k) => (
        <g key={k} fill={COULEURS[k % COULEURS.length]}>
          {(s.valeurs || []).map((v, i) => {
            const y0 = yPx(Math.max(ey.min, Math.min(0, ey.max)))
            const y1 = yPx(Math.max(ey.min, Math.min(ey.max, v)))
            return (
              <rect key={i} x={M.g + i * bande + marge + k * largeur} y={Math.min(y0, y1)} width={largeur} height={Math.abs(y0 - y1)}
                stroke={contigu ? 'var(--bg-card, #fff)' : 'none'} strokeWidth="1" />
            )
          })}
        </g>
      ))}
    />
  )
}

function Courbes({ series, categories, axeX, axeY, nuage }) {
  const parCategories = !nuage && series.every((s) => s.valeurs && !s.points)
  const n = Math.max(...series.map((s) => (s.valeurs || []).length), 1)
  const tous = series.flatMap((s) => pointsDe(s))
  // Petite marge autour des données pour que les points ne touchent pas les axes
  const etendue = (valeurs) => {
    const min = Math.min(...valeurs)
    const max = Math.max(...valeurs)
    const marge = max > min ? (max - min) * 0.05 : 0.5
    return echelle(min - marge, max + marge)
  }
  const ey = bornes(etendue(tous.map((p) => p.y)), axeY)
  const ex = parCategories ? null : etendue(tous.map((p) => p.x))
  const etiquettes = categories || Array.from({ length: n }, (_, i) => String(i + 1))
  const xPx = (p, i) => (parCategories ? M.g + ((i + 0.5) / n) * PW : M.g + ((p.x - ex.min) / (ex.max - ex.min)) * PW)
  return (
    <Cadre ey={ey} ex={ex} categories={parCategories ? etiquettes : null} n={n} labelX={axeX && axeX.label} labelY={axeY && axeY.label}
      enfants={(yPx) => series.map((s, k) => {
        const couleur = COULEURS[k % COULEURS.length]
        const pts = pointsDe(s).map((p, i) => ({ x: xPx(p, i), y: yPx(p.y) }))
        return (
          <g key={k}>
            {!nuage && <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={couleur} strokeWidth="2.5" strokeLinejoin="round" />}
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={nuage ? 4.5 : 3.5} fill={couleur} />)}
          </g>
        )
      })}
    />
  )
}

function Secteurs({ series, categories }) {
  const valeurs = (series[0].valeurs || []).map((v) => Math.max(0, v))
  const total = valeurs.reduce((a, b) => a + b, 0)
  const cx = 150
  const cy = H / 2 + 8
  const r = 112
  let angle = -Math.PI / 2
  const parts = valeurs.map((v, i) => {
    const part = total ? v / total : 0
    const debut = angle
    angle += part * 2 * Math.PI
    const fin = angle
    const nom = (categories && categories[i]) || `Part ${i + 1}`
    return { v, part, debut, fin, nom, couleur: COULEURS[i % COULEURS.length] }
  })
  const point = (a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
  return (
    <g>
      {parts.filter((p) => p.part > 0).map((p, i) => (
        p.part >= 0.9999
          ? <circle key={i} cx={cx} cy={cy} r={r} fill={p.couleur} />
          : <path key={i} d={`M ${cx} ${cy} L ${point(p.debut)} A ${r} ${r} 0 ${p.part > 0.5 ? 1 : 0} 1 ${point(p.fin)} Z`} fill={p.couleur} stroke="var(--bg-card, #fff)" strokeWidth="1.5" />
      ))}
      {parts.map((p, i) => (
        <g key={i} transform={`translate(300 ${58 + i * 24})`}>
          <rect width="12" height="12" y="-10" fill={p.couleur} />
          <text x="20" fontSize="12" fill="currentColor">{tronquer(p.nom, 22)} — {fmt(p.part * 100)} %</text>
        </g>
      ))}
    </g>
  )
}

export default function Graphique({ attrs }) {
  const { graphique_type: type, titre, axe_x: axeX, axe_y: axeY } = attrs
  const series = (attrs.series || []).filter((s) => (s.valeurs && s.valeurs.length) || (s.points && s.points.length))
  if (!series.length) return null
  const categories = axeX && Array.isArray(axeX.categories) && axeX.categories.length ? axeX.categories : null

  let trace
  if (type === 'secteurs') trace = <Secteurs series={series} categories={categories} />
  else if (type === 'courbe') trace = <Courbes series={series} categories={categories} axeX={axeX} axeY={axeY} />
  else if (type === 'nuage') trace = <Courbes series={series} categories={categories} axeX={axeX} axeY={axeY} nuage />
  else trace = <Barres series={series} categories={categories} axeX={axeX} axeY={axeY} contigu={type === 'histogramme'} />

  // Texte équivalent, pour les lecteurs d'écran : toutes les valeurs du graphique
  const valeursTexte = series.map((s) => {
    const elements = s.points
      ? s.points.map((p) => `(${fmt(p.x)} ; ${fmt(p.y)})`)
      : s.valeurs.map((v, i) => `${(categories && categories[i]) || i + 1} : ${fmt(v)}`)
    return `${s.nom} — ${elements.join(', ')}`
  })
  const description = `${titre || 'Graphique'} (${LIBELLES[type] || 'graphique'})`

  return (
    <figure className="sujet-graphique">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={description} style={{ color: 'var(--text)' }}>
        {titre && <text x={L / 2} y="20" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">{titre}</text>}
        {trace}
        {series.length > 1 && type !== 'secteurs' && (
          <g transform={`translate(${M.g} 37)`}>
            {series.map((s, k) => (
              <g key={k} transform={`translate(${k * 118} 0)`}>
                <rect width="11" height="11" y="-9" fill={COULEURS[k % COULEURS.length]} />
                <text x="16" fontSize="11" fill="currentColor">{tronquer(s.nom, 14)}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
      <ul className="sr-only">
        {valeursTexte.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </figure>
  )
}