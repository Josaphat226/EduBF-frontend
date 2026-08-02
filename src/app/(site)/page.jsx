import { apiServer } from '@/lib/api'
import HeroSection from '@/components/sections/HeroSection'
import ProcessSteps from '@/components/sections/ProcessSteps'
import BurkinaMap from '@/components/sections/BurkinaMap'
import SearchDemo from '@/components/sections/SearchDemo'
import ExamsSection from '@/components/sections/ExamsSection'
import StatsSection from '@/components/sections/StatsSection'
import DocumentsDiscovery from '@/components/sections/DocumentsDiscovery'

export const metadata = {
  title: 'EduBF — Réussis tes examens',
  description: "EduBF — La plateforme nationale de ressources éducatives du Burkina Faso. Cours, devoirs et sujets d'examens gratuits pour BEPC, BAC, BEP, CAP et BTS.",
}

export default async function HomePage() {
  const { documents, totalDocs } = await apiServer('/documents/home')

  return (
    <>
      <HeroSection />
      <ProcessSteps />
      <BurkinaMap />
      <SearchDemo />
      <ExamsSection />
      <StatsSection totalDocs={totalDocs} />
      <DocumentsDiscovery documents={documents} />
    </>
  )
}