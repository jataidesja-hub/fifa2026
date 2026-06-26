'use client'
import { useState, useEffect } from 'react'
import { Match, Team } from '@/lib/supabase'
import { subscribeToLiveMatches } from '@/lib/realtime'

interface Props {
  initialMatches: (Match & { home_team?: Team; away_team?: Team })[]
}

function FlagImg({ url, name }: { url?: string; name?: string }) {
  if (url) return <img src={url} alt={name} style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '3px' }} />
  return <div style={{ width: '28px', height: '20px', background: 'var(--bg-600)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{name?.slice(0,3)}</div>
}

export default function LiveScore({ initialMatches }: Props) {
  const [matches, setMatches] = useState(initialMatches)

  useEffect(() => {
    const unsub = subscribeToLiveMatches((updated) => {
      setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
    })
    return unsub
  }, [])

  const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')

  if (liveMatches.length === 0) return null

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="section-title">Ao Vivo Agora</div>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {liveMatches.map(match => (
          <div key={match.id} style={{
            background: 'var(--bg-card)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius)', padding: '1rem 1.25rem', minWidth: '220px',
            boxShadow: '0 0 20px rgba(34,197,94,0.1)', flex: '0 0 auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="badge-live">{match.minute ? `${match.minute}'` : 'AO VIVO'}</span>
              {match.group_name && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grupo {match.group_name}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <FlagImg url={match.home_team?.flag_url} name={match.home_team?.name} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {match.home_team?.short_name || match.home_team?.name || 'TBD'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{match.home_score}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>-</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{match.away_score}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {match.away_team?.short_name || match.away_team?.name || 'TBD'}
                </span>
                <FlagImg url={match.away_team?.flag_url} name={match.away_team?.name} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
