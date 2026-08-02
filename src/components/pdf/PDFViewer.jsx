'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

export default function PDFViewer({ url, title, onClose, embedded = false }) {
  const containerRef = useRef(null)
  const viewerAreaRef = useRef(null)
  const pdfProxyRef = useRef(null)

  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [areaWidth, setAreaWidth] = useState(360)
  const [progress, setProgress] = useState(0)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [isFullscreenMode, setIsFullscreenMode] = useState(false) // notre propre "plein écran", pas celui du navigateur
  const [pageInputValue, setPageInputValue] = useState('1')
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchIndex, setSearchIndex] = useState(0)
  const [searching, setSearching] = useState(false)

  const displayFullscreen = !embedded || isFullscreenMode

  useEffect(() => {
    function measure() {
      setIsMobile(window.innerWidth < 640)
      if (viewerAreaRef.current) {
        setAreaWidth(viewerAreaRef.current.clientWidth)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    if (viewerAreaRef.current) ro.observe(viewerAreaRef.current)
    return () => {
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [showThumbnails, displayFullscreen])

  // Empêche la page de défiler derrière notre "plein écran maison" pendant
  // qu'il est ouvert, et remet tout en ordre proprement à la fermeture —
  // contrairement à l'ancienne fonction plein écran du navigateur, ceci
  // est entièrement sous notre contrôle et ne peut pas laisser la page
  // dans un état cassé.
  useEffect(() => {
    if (isFullscreenMode) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = previousOverflow }
    }
  }, [isFullscreenMode])

  function onDocumentLoadSuccess(pdf) {
    pdfProxyRef.current = pdf
    setNumPages(pdf.numPages)
    setProgress(100)
  }

  function onDocumentLoadProgress({ loaded, total }) {
    if (total) setProgress(Math.round((loaded / total) * 100))
  }

  useEffect(() => { setPageInputValue(String(pageNumber)) }, [pageNumber])

  function goToPage(n) {
    const clamped = Math.min(Math.max(1, n), numPages || 1)
    setPageNumber(clamped)
    setShowThumbnails(false)
  }

  function handlePageInputSubmit(e) {
    e.preventDefault()
    goToPage(parseInt(pageInputValue, 10) || 1)
  }

  const runSearch = useCallback(async (query) => {
    if (!query.trim() || !pdfProxyRef.current || !numPages) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const q = query.toLowerCase()
    const matches = []
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfProxyRef.current.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map(it => it.str).join(' ').toLowerCase()
      if (text.includes(q)) matches.push(i)
    }
    setSearchResults(matches)
    setSearchIndex(0)
    if (matches.length > 0) goToPage(matches[0])
    setSearching(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages])

  function handleSearchSubmit(e) {
    e.preventDefault()
    runSearch(searchQuery)
  }

  function nextResult() {
    if (searchResults.length === 0) return
    const next = (searchIndex + 1) % searchResults.length
    setSearchIndex(next)
    goToPage(searchResults[next])
  }

  function prevResult() {
    if (searchResults.length === 0) return
    const prev = (searchIndex - 1 + searchResults.length) % searchResults.length
    setSearchIndex(prev)
    goToPage(searchResults[prev])
  }

  const margin = isMobile ? 16 : 48
  const pageWidth = Math.max(160, (areaWidth - margin) * zoom)

  return (
    <div
      ref={containerRef}
      className="pdfv-container"
      style={displayFullscreen ? {
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        background: '#1E293B',
      } : {
        position: 'relative', width: '100%', height: isMobile ? '75vh' : '650px',
        display: 'flex', flexDirection: 'column',
        background: '#1E293B', borderRadius: 14, overflow: 'hidden',
      }}
    >
      <style>{`
        .pdfv-toolbar { display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem 1rem; flex-wrap: nowrap; }
        .pdfv-title { font-weight: 700; font-size: 0.85rem; margin-right: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }
        .pdfv-group { display: flex; align-items: center; gap: 0.3rem; }
        .pdfv-search-input { padding: 0.35rem 0.6rem; border-radius: 6px; border: none; font-size: 0.85rem; width: 140px; }
        .pdfv-page-input { width: 36px; text-align: center; border-radius: 6px; border: none; padding: 0.3rem; }
        .pdfv-page-doc canvas { max-width: 100%; height: auto !important; }

        @media (max-width: 640px) {
          .pdfv-toolbar { padding: 0.5rem 0.6rem; gap: 0.35rem; overflow-x: auto; flex-wrap: nowrap; }
          .pdfv-title { display: none; }
          .pdfv-search-input { width: 90px; font-size: 0.8rem; }
          .pdfv-zoom-label { display: none; }
          .pdfv-btn { padding: 0.3rem 0.45rem !important; font-size: 0.8rem !important; }
          .pdfv-page-input { width: 28px; }
        }
      `}</style>

      <div className="pdfv-toolbar" style={{ background: '#0F172A', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => setShowThumbnails(v => !v)} title="Miniatures" style={btnStyle} className="pdfv-btn">▤</button>

        <span className="pdfv-title">{title}</span>

        {isMobile && !searchOpen ? (
          <button onClick={() => setSearchOpen(true)} title="Rechercher" style={btnStyle} className="pdfv-btn">🔍</button>
        ) : (
          <form onSubmit={handleSearchSubmit} className="pdfv-group">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pdfv-search-input"
              autoFocus={isMobile}
            />
            <button type="submit" style={btnStyle} className="pdfv-btn" disabled={searching}>{searching ? '…' : '🔍'}</button>
            {isMobile && (
              <button type="button" onClick={() => setSearchOpen(false)} style={btnStyle} className="pdfv-btn">✕</button>
            )}
            {searchResults.length > 0 && (
              <>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{searchIndex + 1}/{searchResults.length}</span>
                <button type="button" onClick={prevResult} style={btnStyle} className="pdfv-btn">↑</button>
                <button type="button" onClick={nextResult} style={btnStyle} className="pdfv-btn">↓</button>
              </>
            )}
          </form>
        )}

        {(!isMobile || !searchOpen) && (
          <>
            <div className="pdfv-group">
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} style={btnStyle} className="pdfv-btn" title="Zoom arrière">−</button>
              <span className="pdfv-zoom-label" style={{ fontSize: '0.8rem', width: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} style={btnStyle} className="pdfv-btn" title="Zoom avant">+</button>
            </div>

            <form onSubmit={handlePageInputSubmit} className="pdfv-group">
              <button type="button" onClick={() => goToPage(pageNumber - 1)} style={btnStyle} className="pdfv-btn" disabled={pageNumber <= 1}>←</button>
              <input
                type="text"
                value={pageInputValue}
                onChange={e => setPageInputValue(e.target.value)}
                className="pdfv-page-input"
              />
              <span style={{ fontSize: '0.8rem' }}>/ {numPages || '…'}</span>
              <button type="button" onClick={() => goToPage(pageNumber + 1)} style={btnStyle} className="pdfv-btn" disabled={pageNumber >= (numPages || 1)}>→</button>
            </form>

            {embedded && (
              <button onClick={() => setIsFullscreenMode(v => !v)} style={btnStyle} className="pdfv-btn" title="Plein écran">
                {isFullscreenMode ? '⤡' : '⤢'}
              </button>
            )}
            <a href={url} download style={{ ...btnStyle, textDecoration: 'none', display: 'inline-block' }} className="pdfv-btn" title="Télécharger">⬇</a>
            {onClose && (
              <button onClick={onClose} style={{ ...btnStyle, background: '#EF4444' }} className="pdfv-btn" title="Fermer">✕</button>
            )}
          </>
        )}
      </div>

      {progress < 100 && (
        <div style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#F59E0B', transition: 'width 0.2s' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {showThumbnails && (
          <div
            style={
              isMobile
                ? { position: 'absolute', inset: 0, zIndex: 10, overflowY: 'auto', background: 'rgba(15,23,42,0.97)', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }
                : { width: 140, overflowY: 'auto', background: '#0F172A', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flexShrink: 0 }
            }
          >
            {isMobile && (
              <button onClick={() => setShowThumbnails(false)} style={{ ...btnStyle, alignSelf: 'flex-end', marginBottom: '0.4rem' }}>✕ Fermer</button>
            )}
            <Document file={url}>
              {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map(n => (
                <div
                  key={n}
                  onClick={() => goToPage(n)}
                  style={{
                    cursor: 'pointer', border: n === pageNumber ? '2px solid #F59E0B' : '2px solid transparent',
                    borderRadius: 6, overflow: 'hidden', maxWidth: isMobile ? 160 : 110, margin: isMobile ? '0 auto' : 0,
                  }}
                >
                  <Page pageNumber={n} width={isMobile ? 160 : 110} renderTextLayer={false} renderAnnotationLayer={false} />
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.7rem', padding: '0.2rem 0' }}>{n}</div>
                </div>
              ))}
            </Document>
          </div>
        )}

        <div
          ref={viewerAreaRef}
          className="pdfv-page-doc"
          style={{ flex: 1, minWidth: 0, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: isMobile ? '0.5rem' : '1.5rem' }}
        >
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadProgress={onDocumentLoadProgress}
            loading={<div style={{ color: '#94A3B8', paddingTop: '3rem' }}>Chargement du document...</div>}
            error={<div style={{ color: '#F87171', paddingTop: '3rem' }}>Impossible de charger ce PDF.</div>}
          >
            <Page pageNumber={pageNumber} width={pageWidth} />
          </Document>
        </div>
      </div>
    </div>
  )
}

const btnStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: '#fff',
  borderRadius: 6,
  padding: '0.35rem 0.6rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  flexShrink: 0,
}