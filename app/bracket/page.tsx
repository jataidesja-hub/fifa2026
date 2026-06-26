import { supabase, Match, Team } from '@/lib/supabase'

export const revalidate = 30

export const metadata = {
  title: 'Mata-Mata — FIFA 2026 Dashboard',
  description: 'Chaveamento Lado-a-Lado da Copa do Mundo FIFA 2026',
}

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

  return (matches || []) as (Match & { home_team?: Team; away_team?: Team })[]
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
    padding: '0.4rem 0.6rem', gap: '0.4rem',
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
      width: '100%',
    }}>
      <div style={rowStyle(!!homeWins)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <FlagOrPlaceholder team={match?.home_team} size={18} />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
            {teamName(match?.home_team)}
          </span>
        </div>
        {(isFinished || isLive) && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, flexShrink: 0 }}>
            {match?.home_score ?? 0}
          </span>
        )}
      </div>
      <div style={{ height: 1, background: 'var(--border)' }} />
      <div style={rowStyle(!!awayWins)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <FlagOrPlaceholder team={match?.away_team} size={18} />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
            {teamName(match?.away_team)}
          </span>
        </div>
        {(isFinished || isLive) && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, flexShrink: 0 }}>
            {match?.away_score ?? 0}
          </span>
        )}
      </div>
      <div style={{
        padding: '0.2rem 0.6rem', borderTop: '1px solid var(--border)',
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

function Column({ title, matches, gap }: { title: string; matches: any[]; gap: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 200, flexShrink: 0 }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em',
        color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem',
        paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap, justifyContent: 'space-around', flexGrow: 1 }}>
        {matches.map((m, i) => <MatchSlot key={m?.id || i} match={m} />)}
      </div>
    </div>
  )
}

export default async function BracketPage() {
  const allMatches = await getData()

  const byRound = (key: string) =>
    allMatches.filter(m => m.phase === key).sort((a, b) =>
      new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
    )

  const r32 = byRound('R32')
  const r16 = byRound('R16')
  const qf = byRound('QF')
  const sf = byRound('SF')
  const final = byRound('FINAL')
  const third = byRound('THIRD')

  // Left vs Right strict mapping for R32 based on user rules
  // If r32 doesn't have 16 items yet, fill with undefined to prevent crashes
  const pad = (arr: any[], size: number) => {
    const res = [...arr]
    while (res.length < size) res.push(undefined)
    return res
  }

  const r32Full = pad(r32, 16)
  const r32Left = [2, 5, 0, 3, 11, 10, 9, 8].map(i => r32Full[i])
  const r32Right = [1, 4, 6, 7, 14, 13, 12, 15].map(i => r32Full[i])

  // Simple splitting for subsequent rounds
  const r16Full = pad(r16, 8)
  const r16Left = [0, 2, 4, 6].map(i => r16Full[i])
  const r16Right = [1, 3, 5, 7].map(i => r16Full[i])

  const qfFull = pad(qf, 4)
  const qfLeft = [0, 2].map(i => qfFull[i])
  const qfRight = [1, 3].map(i => qfFull[i])

  const sfFull = pad(sf, 2)
  const sfLeft = sfFull.slice(0, 1)
  const sfRight = sfFull.slice(1, 2)

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Mata-Mata</h1>
          <p className="page-subtitle">Formato Lado-a-Lado convergindo para a Final</p>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: '2rem' }}>
          <div style={{
            display: 'flex', gap: '2rem', minWidth: 'max-content',
            padding: '1rem', alignItems: 'stretch', margin: '0 auto'
          }}>
            {/* LEFT BRACKET */}
            <Column title="16-AVOS" matches={r32Left} gap="0.5rem" />
            <Column title="OITAVAS" matches={r16Left} gap="1.5rem" />
            <Column title="QUARTAS" matches={qfLeft} gap="4.5rem" />
            <Column title="SEMIFINAL" matches={sfLeft} gap="12rem" />

            {/* CENTER (FINAL & 3RD) */}
            <div style={{ display: 'flex', flexDirection: 'column', width: 240, flexShrink: 0, justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
              <div style={{ width: '100%' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.1em',
                  color: 'var(--gold)', textAlign: 'center', marginBottom: '1rem',
                  textShadow: '0 0 10px rgba(240,192,64,0.3)'
                }}>
                  GRANDE FINAL
                </div>
                <MatchSlot match={final[0]} />
              </div>

              <div style={{ width: '100%', marginTop: '3rem' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.1em',
                  color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem'
                }}>
                  3º LUGAR
                </div>
                <MatchSlot match={third[0]} />
              </div>
            </div>

            {/* RIGHT BRACKET */}
            <Column title="SEMIFINAL" matches={sfRight} gap="12rem" />
            <Column title="QUARTAS" matches={qfRight} gap="4.5rem" />
            <Column title="OITAVAS" matches={r16Right} gap="1.5rem" />
            <Column title="16-AVOS" matches={r32Right} gap="0.5rem" />
          </div>
        </div>
      </div>
    </main>
  )
}
