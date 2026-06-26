'use client'
import { Match, Team } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  match: Match & { home_team?: Team; away_team?: Team }
  showGroup?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function FlagImg({ url, name }: { url?: string; name?: string }) {
  if (url) return <img src={url} alt={name} className="team-flag" />
  return (
    <div className="team-flag-placeholder">
      {name?.slice(0, 3).toUpperCase() || '???'}
    </div>
  )
}

export default function MatchCard({ match, showGroup }: Props) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'
  const isScheduled = match.status === 'SCHEDULED'

  return (
    <Link href={`/match/${match.id}`}>
      <div className={`match-card ${isLive ? 'live' : isFinished ? 'finished' : ''}`}>
        <div className="match-teams">
          <div className="match-team home">
            <span className="team-name">{match.home_team?.name || 'TBD'}</span>
            <FlagImg url={match.home_team?.flag_url} name={match.home_team?.name} />
          </div>

          <div className="match-score">
            {isScheduled ? (
              <span className="match-meta" style={{ fontSize: '0.8rem', minWidth: '80px', textAlign: 'center' }}>
                {formatDate(match.scheduled_at)}
              </span>
            ) : (
              <>
                <span className="score-number">{match.home_score}</span>
                <span className="score-dash">-</span>
                <span className="score-number">{match.away_score}</span>
              </>
            )}
          </div>

          <div className="match-team away">
            <FlagImg url={match.away_team?.flag_url} name={match.away_team?.name} />
            <span className="team-name">{match.away_team?.name || 'TBD'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', marginLeft: 'auto' }}>
          {isLive && (
            <span className="badge-live">
              {match.minute ? `${match.minute}'` : 'AO VIVO'}
            </span>
          )}
          {isFinished && <span className="badge-finished">FIM</span>}
          {isScheduled && <span className="badge-scheduled">Agendado</span>}
          {showGroup && match.group_name && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Grupo {match.group_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
