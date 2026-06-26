'use client'
import { Standing, Team } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  standings: (Standing & { team?: Team })[]
  groupName: string
}

function FormBadge({ result }: { result: string }) {
  const color = result === 'W' ? 'var(--green-live)'
    : result === 'L' ? 'var(--red-card)'
    : 'var(--text-muted)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '18px', height: '18px', borderRadius: '3px', fontSize: '0.65rem',
      fontWeight: 700, background: `${color}22`, color, margin: '0 1px',
    }}>{result}</span>
  )
}

function PosBadge({ pos }: { pos: number }) {
  return <span className={`pos-badge pos-${pos}`}>{pos}</span>
}

export default function GroupTable({ standings, groupName }: Props) {
  return (
    <div className="card animate-fade-up">
      <div className="card-header">
        <span className="group-label">GRUPO {groupName}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {standings[0]?.played !== undefined ? `${standings[0].played} jogos` : ''}
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="standings-table">
          <thead>
            <tr>
              <th style={{ width: '24px' }}>#</th>
              <th style={{ textAlign: 'left', minWidth: '140px' }}>Seleção</th>
              <th title="Jogos">J</th>
              <th title="Vitórias">V</th>
              <th title="Empates">E</th>
              <th title="Derrotas">D</th>
              <th title="Gols Marcados">GM</th>
              <th title="Gols Sofridos">GS</th>
              <th title="Saldo">SG</th>
              <th title="Pontos">PTS</th>
              <th>Forma</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.id || i}>
                <td>
                  <PosBadge pos={row.position} />
                </td>
                <td>
                  <Link href={`/team/${row.team_id}`} style={{ textDecoration: 'none' }}>
                    <div className="team-cell">
                      {row.team?.flag_url ? (
                        <img src={row.team.flag_url} alt={row.team.name} className="team-flag" style={{ width: '24px', height: '18px' }} />
                      ) : (
                        <div className="team-flag-placeholder" style={{ width: '24px', height: '18px', fontSize: '0.55rem' }}>
                          {row.team?.short_name || '?'}
                        </div>
                      )}
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {row.team?.name || 'TBD'}
                      </span>
                    </div>
                  </Link>
                </td>
                <td>{row.played}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.goals_for}</td>
                <td>{row.goals_against}</td>
                <td style={{ color: row.goal_diff > 0 ? 'var(--green-live)' : row.goal_diff < 0 ? 'var(--red-card)' : 'inherit' }}>
                  {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                </td>
                <td className="pts-cell">{row.points}</td>
                <td>
                  <div style={{ display: 'flex' }}>
                    {row.form?.split('').slice(-5).map((r, j) => (
                      <FormBadge key={j} result={r} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
