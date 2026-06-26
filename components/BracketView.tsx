'use client'
import { BracketEntry, Team } from '@/lib/supabase'

interface Props {
  bracket: (BracketEntry & {
    home_team?: Team
    away_team?: Team
    winner?: Team
    match?: any
  })[]
}

const ROUNDS = [
  { key: 'R32', label: 'OITAVAS DE FINAL', slots: 16 },
  { key: 'R16', label: 'QUARTAS DE FINAL', slots: 8 },
  { key: 'QF', label: 'SEMIFINAL', slots: 4 },
  { key: 'SF', label: 'FINAL', slots: 2 },
  { key: 'FINAL', label: 'CAMPEÃO', slots: 1 },
]

function BracketTeamRow({
  team, score, isWinner
}: {
  team?: Team; score?: number; isWinner?: boolean
}) {
  return (
    <div className={`bracket-team ${isWinner ? 'winner' : ''}`}>
      <div className="bracket-team-info">
        {team?.flag_url ? (
          <img src={team.flag_url} alt={team.name} className="team-flag" style={{ width: '20px', height: '14px' }} />
        ) : (
          <div className="team-flag-placeholder" style={{ width: '20px', height: '14px', fontSize: '0.5rem' }}>
            {team?.short_name || '?'}
          </div>
        )}
        <span className="bracket-team-name">{team?.name || 'A definir'}</span>
      </div>
      {score !== undefined && (
        <span className="bracket-score">{score}</span>
      )}
    </div>
  )
}

function BracketMatchCard({ entry }: { entry: BracketEntry & { home_team?: Team; away_team?: Team; winner?: Team; match?: any } }) {
  const homeScore = entry.match?.home_score
  const awayScore = entry.match?.away_score
  const isFinished = entry.match?.status === 'FINISHED'

  return (
    <div className="bracket-match">
      <BracketTeamRow
        team={entry.home_team}
        score={isFinished ? homeScore : undefined}
        isWinner={isFinished && entry.winner_id === entry.home_team_id}
      />
      <BracketTeamRow
        team={entry.away_team}
        score={isFinished ? awayScore : undefined}
        isWinner={isFinished && entry.winner_id === entry.away_team_id}
      />
    </div>
  )
}

export default function BracketView({ bracket }: Props) {
  const byRound = (roundKey: string) =>
    bracket.filter(b => b.round === roundKey).sort((a, b) => a.position - b.position)

  return (
    <div className="bracket-container">
      <div className="bracket-rounds">
        {ROUNDS.map(round => {
          const entries = byRound(round.key)
          const placeholders = Array.from({ length: round.slots - entries.length })

          return (
            <div key={round.key} className="bracket-round" style={{
              gap: round.key === 'R32' ? '0.75rem' : round.key === 'R16' ? '1.5rem' : round.key === 'QF' ? '3rem' : '6rem'
            }}>
              <div className="bracket-round-label">{round.label}</div>
              {entries.map(entry => (
                <BracketMatchCard key={entry.id} entry={entry} />
              ))}
              {placeholders.map((_, i) => (
                <div key={`ph-${i}`} className="bracket-match" style={{ opacity: 0.3 }}>
                  <div className="bracket-team">
                    <div className="bracket-team-info">
                      <div className="team-flag-placeholder" style={{ width: '20px', height: '14px', fontSize: '0.5rem' }}>?</div>
                      <span className="bracket-team-name">A definir</span>
                    </div>
                  </div>
                  <div className="bracket-team" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="bracket-team-info">
                      <div className="team-flag-placeholder" style={{ width: '20px', height: '14px', fontSize: '0.5rem' }}>?</div>
                      <span className="bracket-team-name">A definir</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
