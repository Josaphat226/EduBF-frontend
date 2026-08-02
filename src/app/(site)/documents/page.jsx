import { Suspense } from 'react'
import DocumentsClient from '@/components/pages/DocumentsClient'

export const metadata = {
  title: 'Tous les documents — EduBF',
  description: 'Cours, sujets, corrigés et examens blancs pour BEPC, BAC, BEP, CAP et BTS au Burkina Faso.',
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsClient />
    </Suspense>
  )
}