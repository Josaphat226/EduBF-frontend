import Riche from './Riche'
import Corrige from './Corrige'
import { formaterPoints, totalPartie, totalExercice, totalQuestion, etiquetteQuestion } from '@/lib/contenus'

function Points({ valeur }) {
  const texte = formaterPoints(valeur)
  return texte && valeur > 0 ? <span className="sujet-points">{texte}</span> : null
}

function Annexes({ annexes }) {
  if (!annexes || !annexes.length) return null
  return annexes.map((a) => (
    <aside key={a.id} className="sujet-annexe">
      <p className="sujet-annexe-titre">Document : {a.titre}</p>
      <Riche doc={a.doc} />
      {a.source && <p className="sujet-annexe-source">Source : {a.source}</p>}
    </aside>
  ))
}

function CorrigeContenu({ corrige }) {
  const total = corrige.bareme ? corrige.bareme.reduce((s, b) => s + b.points, 0) : 0
  return (
    <>
      {corrige.reponse_attendue && (
        <div className="sujet-corrige-bloc sujet-reponse">
          <p className="sujet-corrige-titre">Réponse</p>
          <Riche doc={corrige.reponse_attendue} />
        </div>
      )}
      {corrige.methode && (
        <div className="sujet-corrige-bloc">
          <p className="sujet-corrige-titre">Méthode</p>
          <Riche doc={corrige.methode} />
        </div>
      )}
      {corrige.etapes && corrige.etapes.map((e, i) => (
        <div key={i} className="sujet-corrige-bloc">
          <p className="sujet-corrige-titre">{e.titre || (corrige.etapes.length > 1 ? `Étape ${i + 1}` : 'Résolution')}</p>
          <Riche doc={e.doc} />
        </div>
      ))}
      {corrige.bareme && (
        <div className="sujet-corrige-bloc">
          <p className="sujet-corrige-titre">Barème</p>
          <div className="sujet-tableau">
            <table className="sujet-bareme">
              <thead><tr><th scope="col">Critère</th><th scope="col">Points</th></tr></thead>
              <tbody>
                {corrige.bareme.map((b, i) => <tr key={i}><td>{b.critere}</td><td>{String(b.points).replace('.', ',')}</td></tr>)}
              </tbody>
              <tfoot><tr><th scope="row">Total</th><td>{String(total).replace('.', ',')}</td></tr></tfoot>
            </table>
          </div>
        </div>
      )}
      {corrige.remarque && (
        <div className="sujet-corrige-bloc">
          <p className="sujet-corrige-titre">Remarque</p>
          <Riche doc={corrige.remarque} />
        </div>
      )}
    </>
  )
}

function BlocCorrige({ code, corrige }) {
  if (!corrige) return null
  return (
    <Corrige code={code}>
      <CorrigeContenu corrige={corrige} />
    </Corrige>
  )
}

function Question({ code, q, index, profondeur }) {
  return (
    <div className={`sujet-question sujet-niveau-${Math.min(profondeur, 2)}`} id={q.id}>
      <div className="sujet-question-tete">
        <span className="sujet-question-num">{etiquetteQuestion(q, index, profondeur)}</span>
        <div className="sujet-question-texte"><Riche doc={q.enonce} /></div>
        <Points valeur={totalQuestion(q)} />
      </div>
      {q.sous_questions && (
        <div className="sujet-sous-questions">
          {q.sous_questions.map((sq, i) => <Question key={sq.id} code={code} q={sq} index={i} profondeur={profondeur + 1} />)}
        </div>
      )}
      <BlocCorrige code={code} corrige={q.corrige} />
    </div>
  )
}

function Exercice({ code, ex, index }) {
  const titre = `${ex.etiquette || `Exercice ${index + 1}`}${ex.titre ? ` — ${ex.titre}` : ''}`
  return (
    <article className="sujet-exercice" id={ex.id}>
      <h3 className="sujet-exercice-titre">
        <span>{titre}</span>
        <Points valeur={totalExercice(ex)} />
      </h3>
      {ex.enonce && <Riche doc={ex.enonce} />}
      <Annexes annexes={ex.annexes} />
      {ex.questions && (
        <div className="sujet-questions">
          {ex.questions.map((q, i) => <Question key={q.id} code={code} q={q} index={i} profondeur={0} />)}
        </div>
      )}
      <BlocCorrige code={code} corrige={ex.corrige} />
    </article>
  )
}

export default function SujetLecture({ code, document }) {
  const { entete, parties } = document
  return (
    <div className="sujet">
      {(entete?.consignes || entete?.materiel) && (
        <section className="sujet-consignes" aria-label="Consignes générales">
          {entete.consignes && <Riche doc={entete.consignes} />}
          {entete.materiel && <p className="sujet-materiel">{entete.materiel}</p>}
        </section>
      )}
      {parties.map((partie, i) => {
        const afficherTitre = parties.length > 1 || partie.titre
        return (
          <section key={partie.id} className="sujet-partie" id={partie.id}>
            {afficherTitre && (
              <h2 className="sujet-partie-titre">
                <span>{`Partie ${i + 1}${partie.titre ? ` — ${partie.titre}` : ''}`}</span>
                <Points valeur={totalPartie(partie)} />
              </h2>
            )}
            {partie.consignes && <Riche doc={partie.consignes} />}
            <Annexes annexes={partie.annexes} />
            {partie.exercices.map((ex, j) => <Exercice key={ex.id} code={code} ex={ex} index={j} />)}
          </section>
        )
      })}
    </div>
  )
}