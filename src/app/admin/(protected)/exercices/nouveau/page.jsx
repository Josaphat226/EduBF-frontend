'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import FormulaireInformations from '@/components/admin/contenus/FormulaireInformations'
import '@/styles/editeur.css'

export default function NouveauContenu() {
  const router = useRouter()

  // Crée le contenu (avec un sujet vide), puis ouvre sa fiche
  async function creer(charge) {
    const res = await api.post('/admin/contenus', charge)
    router.push(`/admin/exercices/${res.data.id}`)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Nouveau contenu</h1>
          <p className="admin-page-sub">Exercice, devoir ou sujet d’examen avec son corrigé</p>
        </div>
        <Link href="/admin/exercices" className="btn-admin btn-admin-ghost">← Retour à la liste</Link>
      </div>
      <div className="adoc-card">
        <FormulaireInformations libelleBouton="Créer le contenu" onSubmit={creer} />
      </div>
    </>
  )
}
