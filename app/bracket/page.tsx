import { supabase, Match, Team } from '@/lib/supabase'

export const revalidate = 30

export const metadata = {
  title: 'Mata-Mata — FIFA 2026 Dashboard',
  description: 'Chaveamento do mata-mata da Copa do Mundo FIFA 2026',
}

const ROUNDS = [
  { key: 'R32', label: 'RODADA DE 32', slots: 16, width: 180 },
  { key: 'R16', label: 'OITAVAS DE FINAL', slots: 8, width: 180 },
  { key: 'QF',  label: 'QUARTAS DE FINAL', slots: 4, width: 180 },
  { key: 'SF',  label: 'SEMIFINAL', slots: 2, width: 180 },
  { key: 'FINAL', label: 'FINAL', slots: 1, width: 200 },
]

async function getData() {
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .in('phase', ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'])
    .order('scheduled_at')

  return matches || []
}

function FlagOrPlaceholder({ team, size = 20 }: { team?: Team | null; size?: number }) {
  if (team?.flag_url) {
    return (
      <img
        src={team.flag_url}
        alt={team.name}
        style={{ width: size, height: Math.round(size * 0.7), objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: Math.round(size * 0.7), background: 'var(--bg-600)', borderRadius: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8,
      fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0,
    }}>
      {team?.short_name || '?'}
    </div>
  )
}

function MatchSlot({ match }: { match?: Match & { home_team?: Team; away_team?: Team } }) {
  const isFinished = match?.status === 'FINISHED'
  const isLive = match?.status === 'IN_PLAY' || match?.status === 'PAUSED'
  const hasTeams = match?.home_team_id && match?.away_team_id
  const homeWins = isFinished && match &&
    ((match.home_score ?? 0) > (match.away_score ?? 0) ||
     (match.home_score_penalties ?? 0) > (match.away_score_penalties ?? 0))
  const awayWins = isFinished && !homeWins

  const rowStyle = (winner: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.5rem 0.6rem', gap: '0.4rem',
    background: winner ? 'rgba(240,192,64,0.1)' : 'transparent',
    fontWeight: winner ? 700 : 400,
    color: winner ? 'var(--gold)' : hasTeams ? 'var(--text-primary)' : 'var(--text-muted)',
  })

  const teamName = (team?: Team | null) =>
    team?.short_name || team?.name?.slice(0, 12) || 'A definir'

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${isLive ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
      borderRadius: 8, overflow: 'hidden', transition: 'all 0.2s',
      boxShadow: isLive ? '0 0 12px rgba(34,197,94,0.15)' : 'none',
    }}>
      {/* Home */}
      <div style={rowStyle(!!homeWins)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <FlagOrPlaceholder team={match?.home_team} size={18} />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
            {teamName(match?.home_team)}
          </span>
        </div>
        {(isFinished || isLive) && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, flexShrink: 0 }}>
            {match?.home_score ?? 0}
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Away */}
      <div style={rowStyle(!!awayWins)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <FlagOrPlaceholder team={match?.away_team} size={18} />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
            {teamName(match?.away_team)}
          </span>
        </div>
        {(isFinished || isLive) && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, flexShrink: 0 }}>
            {match?.away_score ?? 0}
          </span>
        )}
      </div>

      {/* Date / Status */}
      <div style={{
        padding: '0.25rem 0.6rem', borderTop: '1px solid var(--border)',
        fontSize: 10, color: isLive ? 'var(--green-live)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center',
      }}>
        {isLive && <span style={{ width: 6, height: 6, background: 'var(--green-live)', borderRadius: '50%', display: 'inline-block', animation: 'pulse-live 1.5s ease-in-out infinite' }} />}
        {match
          ? isLive
            ? `AO VIVO · ${match.minute || ''}′`
            : isFinished ? 'FIM'
            : new Date(match.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
          : '—'
        }
      </div>
    </div>
  )
}

export default async function BracketPage() {
  const allMatches = await getData()

  const byRound = (key: string) =>
    allMatches.filter(m => m.phase === key).sort((a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    ) as (Match & { home_team?: Team; away_team?: Team })[]

  const thirdPlace = allMatches.filter(m => m.phase === 'THIRD') as (Match & { home_team?: Team; away_team?: Team })[]

  const hasAnyData = allMatches.length > 0

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Mata-Mata</h1>
          <p className="page-subtitle">
            {hasAnyData
              ? `${allMatches.length} jogos · chaveamento Copa 2026`
              : 'Rodada de 32 → Oitavas → Quartas → Semis → Final'}
          </p>
        </div>

        {!hasAnyData ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Fase eliminatória ainda não iniciada</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              A fase de grupos está em andamento. O chaveamento será exibido ao iniciar a Rodada de 32.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: '1.5rem' }}>
            <div style={{
              display: 'flex', gap: '2.5rem', minWidth: 'max-content',
              padding: '1rem 0.5rem', alignItems: 'flex-start',
            }}>
              {ROUNDS.map(round => {
                const roundMatches = byRound(round.key)
                const emptySlots = round.slots - roundMatches.length

                return (
                  <div key={round.key} style={{ display: 'flex', flexDirection: 'column', width: round.width }}>
                    {/* Round label */}
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em',
                      color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem',
                      paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
                    }}>
                      {round.label}
                    </div>

                    {/* Match slots */}
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      gap: round.key === 'R32' ? '0.5rem'
                        : round.key === 'R16' ? '1.2rem'
                        : round.key === 'QF' ? '3rem'
                        : round.key === 'SF' ? '7rem'
                        : '15rem',
                    }}>
                      {roundMatches.map(m => (
                        <MatchSlot key={m.id} match={m as any} />
                      ))}
                      {[...Array(emptySlots)].map((_, i) => (
                        <MatchSlot key={`empty-${i}`} />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* 3rd place */}
              {thirdPlace.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', width: 180 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em',
                    color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem',
                    paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
                  }}>
                    3º LUGAR
                  </div>
                  {thirdPlace.map(m => (
                    <MatchSlot key={m.id} match={m as any} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
