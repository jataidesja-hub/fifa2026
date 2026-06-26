'use client'
import { useState, useEffect, useRef } from 'react'

export default function BracketZoomWrapper({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/jfKfPfyJRdk')
  const [inputValue, setInputValue] = useState('')

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    
    let embedUrl = val
    try {
      if (val.includes('youtube.com/watch')) {
        const url = new URL(val)
        const id = url.searchParams.get('v')
        if (id) embedUrl = `https://www.youtube.com/embed/${id}`
      } else if (val.includes('youtu.be/')) {
        const id = val.split('youtu.be/')[1]?.split('?')[0]
        if (id) embedUrl = `https://www.youtube.com/embed/${id}`
      }
    } catch (err) {}
    if (embedUrl) setVideoUrl(embedUrl)
  }

  useEffect(() => {
    if (!expanded) {
      setScale(1)
      return
    }

    const updateScale = () => {
      if (contentRef.current) {
        const containerWidth = window.innerWidth
        const containerHeight = window.innerHeight
        
        // Remove scale temporariamente para medir o tamanho real do conteúdo
        contentRef.current.style.transform = 'scale(1)'
        const contentWidth = contentRef.current.scrollWidth
        const contentHeight = contentRef.current.scrollHeight
        
        // Calcula a escala necessária para caber na tela, considerando um espaço para o iframe no topo (aprox 300px) e paddings
        const scaleX = (containerWidth - 64) / contentWidth // 32px padding de cada lado
        const scaleY = (containerHeight - 350) / contentHeight // Espaço extra para o iframe e botões
        
        // Pega a menor escala para garantir que caiba tanto na largura quanto na altura
        const newScale = Math.min(scaleX, scaleY, 1.2) // Limite máximo de 1.2x
        
        setScale(newScale)
      }
    }

    // Dá um pequeno atraso para garantir que a renderização inicial do layout ocorreu
    setTimeout(updateScale, 50)
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [expanded])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="btn btn-ghost"
          style={{
            fontSize: '0.8rem',
            padding: '0.5rem 1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {expanded ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              Minimizar
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              Expandir
            </>
          )}
        </button>
      </div>
      
      <div style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: '2rem',
        ...(expanded ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          background: 'var(--bg-900)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto'
        } : {})
      }}>
        {expanded && (
          <>
            <button
              onClick={() => setExpanded(false)}
              style={{
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 105,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            
            {/* Quadrado centralizado para Youtube/Outras páginas */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '2rem',
              zIndex: 102
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={videoUrl} 
                  title="YouTube video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={handleLinkChange}
                placeholder="Cole o link do YouTube aqui..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </>
        )}
        
        <div 
          ref={contentRef}
          style={{
            transform: expanded ? `scale(${scale})` : 'scale(1)',
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease',
            margin: '0 auto',
            minWidth: 'max-content'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
