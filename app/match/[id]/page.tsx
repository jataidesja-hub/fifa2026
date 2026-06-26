'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { supabase, Match, Team, MatchEvent } from '@/lib/supabase'
import { subscribeToMatch } from '@/lib/realtime'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

const EVENT_ICONS: Record<string, { icon: string; cls: string; label: string }> = {
  GOAL: { icon: '⚽', cls: 'goal', label: 'Gol' },
  OWN_GOAL: { icon: '⚽', cls: 'goal', label: 'Gol Contra' },
  YELLOW_CARD: { icon: '🟨', cls: 'yellow', label: 'Cartão Amarelo' },
  RED_CARD: { icon: '🟥', cls: 'red', label: 'Cartão Vermelho' },
  YELLOW_RED_CARD: { icon: '🟨🟥', cls: 'red', label: 'Segundo Amarelo' },
  PENALTY_MISSED: { icon: '❌', cls: 'red', label: 'Pênalti Perdido' },
  SUBSTITUTION: { icon: '🔄', cls: 'goal', label: 'Substituição' },
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [match, setMatch] = useState<(Match & { home_team?: Team; away_team?: Team }) | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [{ data: matchData }, { data: eventsData }] = await Promise.all([
      supabase
        .from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`)
        .eq('id', id)
        .single(),
      supabase
        .from('match_events')
        .select(`*, player:players(*), team:teams(*)`)
        .eq('match_id', id)
        .order('minute', { ascending: true }),
    ])

    if (!matchData) { setLoading(false); return }
    setMatch(matchData as any)
    setEvents(eventsData || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
    const unsub = subscribeToMatch(
      id,
      (updated) => setMatch(prev => prev ? { ...prev, ...updated } : prev),
      (event) => setEvents(prev => [...prev, event].sort((a, b) => (a.minute || 0) - (b.minute || 0)))
    )
    return unsub
  }, [id, loadData])

  if (loading) return (
    <main className="page-content">
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      </div>
    </main>
  )

  if (!match) return (
    <main className="page-content">
      <div className="container">
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Partida não encontrada</h3>
          <Link href="/" className="btn btn-ghost" style={{ marginTop: '1rem', display: 'inline-flex' }}>Voltar</Link>
        </div>
      </div>
    </main>
  )

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'
  const homeEvents = events.filter(e => e.team_id === match.home_team_id)
  const awayEvents = events.filter(e => e.team_id === match.away_team_id)

  return (
    <main className="page-content">
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
          {' / '}
          {match.group_name && <><Link href="/groups" style={{ color: 'var(--text-muted)' }}>Grupo {match.group_name}</Link>{' / '}</>}
          <span>Partida</span>
        </div>

        {/* Scoreboard */}
        <div className="scoreboard-hero" style={{ marginBottom: '2rem' }}>
          <div className="scoreboard-team">
            {match.home_team?.flag_url ? (
              <img src={match.home_team.flag_url} alt={match.home_team.name} className="scoreboard-flag" />
            ) : <div style={{ width: '80px', height: '56px', background: 'var(--bg-600)', borderRadius: '6px' }} />}
            <span className="scoreboard-team-name">{match.home_team?.name || 'TBD'}</span>
            {/* Home goal events */}
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {homeEvents.filter(e => e.type === 'GOAL' || e.type === 'OWN_GOAL').map(e => (
                <span key={e.id}>{e.minute}'</span>
              ))}
            </div>
          </div>

          <div className="scoreboard-center">
            {isLive && <span className="badge-live">{match.minute ? `${match.minute}'` : 'AO VIVO'}</span>}
            {isFinished && <span className="badge-finished">ENCERRADO</span>}
            {!isLive && !isFinished && <span className="badge-scheduled">Agendado</span>}

            <div className="scoreboard-score">
              {isFinished || isLive ? (
                <>{match.home_score}<span>-</span>{match.away_score}</>
              ) : (
                <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>VS</span>
              )}
            </div>

            {match.home_score_penalties != null && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Pênaltis: {match.home_score_penalties} – {match.away_score_penalties}
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {formatDate(match.scheduled_at)}
            </div>

            {match.phase && match.phase !== 'GROUP' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase' }}>
                {match.phase}
              </div>
            )}
          </div>

          <div className="scoreboard-team">
            {match.away_team?.flag_url ? (
              <img src={match.away_team.flag_url} alt={match.away_team.name} className="scoreboard-flag" />
            ) : <div style={{ width: '80px', height: '56px', background: 'var(--bg-600)', borderRadius: '6px' }} />}
            <span className="scoreboard-team-name">{match.away_team?.name || 'TBD'}</span>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {awayEvents.filter(e => e.type === 'GOAL' || e.type === 'OWN_GOAL').map(e => (
                <span key={e.id}>{e.minute}'</span>
              ))}
            </div>
          </div>
        </div>

        {/* Events */}
        {events.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <span style={{ fontWeight: 700 }}>Eventos da Partida</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{events.length} evento(s)</span>
            </div>
            <div style={{ padding: '1rem' }}>
              <div className="event-list">
                {events.map(event => {
                  const meta = EVENT_ICONS[event.type] || { icon: '•', cls: 'goal', label: event.type }
                  const isHome = event.team_id === match.home_team_id
                  return (
                    <div key={event.id} className="event-item" style={{ flexDirection: isHome ? 'row' : 'row-reverse' }}>
                      <span className="event-minute">{event.minute}'{event.extra_minute ? `+${event.extra_minute}` : ''}</span>
                      <div className={`event-icon ${meta.cls}`}>{meta.icon}</div>
                      <div style={{ flex: 1, textAlign: isHome ? 'left' : 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {event.player?.name || meta.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {meta.label} · {event.team?.name}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {events.length === 0 && (isLive || isFinished) && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum evento registrado
          </div>
        )}
      </div>
    </main>
  )
}
