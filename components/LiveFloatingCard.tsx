'use client'
import { useState, useEffect } from 'react'
import LiveTimer from './LiveTimer'
import Link from 'next/link'

export default function LiveFloatingCard() {
  const [liveMatches, setLiveMatches] = useState<any[]>([])

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/live-matches')
        if (res.ok) {
          const data = await res.json()
          if (data.matches) {
            setLiveMatches(data.matches.filter((m: any) => m.status === 'IN_PLAY' || m.status === 'PAUSED'))
          }
        }
      } catch (err) {}
    }

    fetchLive()
    const interval = setInterval(fetchLive, 5000)
    return () => clearInterval(interval)
  }, [])

  if (liveMatches.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 110,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {liveMatches.map(m => (
        <Link key={m.id} href={`/match/${m.id}`}>
          <div className="card animate-fade-up" style={{
            padding: '1rem',
            background: 'var(--bg-card)',
            border: '1px solid rgba(34,197,94,0.4)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 12px rgba(34,197,94,0.2)',
            borderRadius: '12px',
            minWidth: '240px',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--green-live)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 6, height: 6, background: 'var(--green-live)', borderRadius: '50%', animation: 'pulse-live 1.5s ease-in-out infinite' }} />
                <LiveTimer initialMinute={m.minute} status={m.status} />
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Ao Vivo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                    {m.homeTeam?.name || m.home_team?.name || 'TBD'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{m.score?.fullTime?.home ?? m.home_score ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                    {m.awayTeam?.name || m.away_team?.name || 'TBD'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{m.score?.fullTime?.away ?? m.away_score ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
