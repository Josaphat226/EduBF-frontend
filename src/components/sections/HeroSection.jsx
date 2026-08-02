'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

export default function HeroSection() {
  const { user } = useAuth()
  const firstName = user?.nom_complet?.split(' ')[0]

  return (
    <motion.section
      className="home-hero"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.16 } } }}
    >
      <motion.div
        className="hero-left"
        variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hero-deco-ring hero-deco-ring-1"></div>
        <div className="hero-deco-ring hero-deco-ring-2"></div>
        <div className="hero-deco-dots"></div>
        <div className="hero-deco-corner-tl"></div>
        <div className="hero-deco-corner-br"></div>
        <div className="hero-image-wrapper">
          <div className="hero-image-glow"></div>
          <Image
            src="/images/hero-student.png"
            alt="Étudiant EduBF"
            className="hero-student-img"
            fill
            sizes="(max-width: 768px) 340px, 420px"
            priority
          />
        </div>
      </motion.div>

      <div className="hero-right">
        <motion.h1
          className="hero-title"
          variants={{ hidden: { opacity: 0, y: 26 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {user ? (
            <>
              <span className="title-black">Bienvenue, </span>
              <span className="title-orange">{firstName}</span><span className="title-black"> !</span>
            </>
          ) : (
            <>
              Tu veux réussir ?<br />
              <span className="title-black">Trouve tes </span>
              <span className="title-orange">Documents</span><br />
              <span className="title-black">ici !</span>
            </>
          )}
        </motion.h1>
        <motion.p
          className="hero-desc"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {user
            ? 'Content de te revoir. Explore les dernières ressources ajoutées pour toi.'
            : "La plateforme nationale de ressources éducatives du Burkina Faso. Cours, devoirs et sujets d'examens — tout gratuit."}
        </motion.p>
        <motion.div
          className="hero-btns"
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/documents" className="hero-btn-main">Parcourir les documents</Link>
          {user ? (
            <Link href="/mon-compte" className="hero-btn-outline">Mon compte</Link>
          ) : (
            <Link href="/inscription" className="hero-btn-outline">Créer un compte</Link>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}