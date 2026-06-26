import { supabase, Match, Team } from '@/lib/supabase'
import BracketZoomWrapper from '@/components/BracketZoomWrapper'
import LiveFloatingCard from '@/components/LiveFloatingCard'
export const revalidate = 30

export const metadata = {
  title: 'Mata-Mata — FIFA 2026 Dashboard',
  description: 'Chaveamento Lado-a-Lado da Copa do Mundo FIFA 2026',
}

async function getData() {
  const [{ data: matches }, { data: standings }] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .in('phase', ['ROUND_32', 'ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'])
      .order('scheduled_at'),
    supabase
      .from('standings')
      .select(`*, team:teams(*)`)
  ])

  return {
    matches: (matches || []) as (Match & { home_team?: Team & { isProjected?: boolean }; away_team?: Team & { isProjected?: boolean } })[],
    standings: (standings || [])
  }
}

function FlagOrPlaceholder({ team, size = 20 }: { team?: (Team & { isProjected?: boolean }) | null; size?: number }) {
  if (team?.flag_url) {
    return (
      <img
        src={team.flag_url}
        alt={team.name}
        style={{ width: size, height: Math.round(size * 0.7), objectFit: 'cover', borderRadius: 2, flexShrink: 0, opacity: team.isProjected ? 0.3 : 1 }}
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

function MatchSlot({ match }: { match?: Match & { home_team?: Team & { isProjected?: boolean }; away_team?: Team & { isProjected?: boolean } } }) {
  const isFinished = match?.status === 'FINISHED'
  const isLive = match?.status === 'IN_PLAY' || match?.status === 'PAUSED'
  const hasTeams = match?.home_team_id && match?.away_team_id
  const homeWins = isFinished && match &&
    ((match.home_score ?? 0) > (match.away_score ?? 0) ||
     (match.home_score_penalties ?? 0) > (match.away_score_penalties ?? 0))
  const awayWins = isFinished && !homeWins

  const rowStyle = (winner: boolean, team?: (Team & { isProjected?: boolean }) | null): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.4rem 0.6rem', gap: '0.4rem',
    background: winner ? 'rgba(240,192,64,0.1)' : 'transparent',
    fontWeight: winner ? 700 : 400,
    color: winner ? 'var(--gold)' : team ? 'var(--text-primary)' : 'var(--text-muted)',
    opacity: team?.isProjected ? 0.5 : 1,
  })

  const teamName = (team?: (Team & { isProjected?: boolean }) | null) =>
    team?.short_name || team?.name?.slice(0, 12) || 'A definir'

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${isLive ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
      borderRadius: 8, overflow: 'hidden', transition: 'all 0.2s',
      boxShadow: isLive ? '0 0 12px rgba(34,197,94,0.15)' : 'none',
      width: '100%',
    }}>
      <div style={rowStyle(!!homeWins, match?.home_team)}>
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
      <div style={rowStyle(!!awayWins, match?.away_team)}>
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
  const { matches, standings } = await getData()

  // Projeção dinâmica dos times (32 classificados)
  const qualifiedTeams = (() => {
    if (standings.length === 0) return []
    // Agrupa standings por grupo
    const groups: Record<string, typeof standings> = {}
    for (const s of standings) {
      if (!groups[s.group_name]) groups[s.group_name] = []
      groups[s.group_name].push(s)
    }
    
    const top2: (Team & { isProjected?: boolean })[] = []
    const thirds: (typeof standings[0])[] = []
    
    for (const g in groups) {
      const gStds = groups[g].sort((a, b) => a.position - b.position)
      if (gStds[0]?.team) top2.push({ ...gStds[0].team, isProjected: true })
      if (gStds[1]?.team) top2.push({ ...gStds[1].team, isProjected: true })
      if (gStds[2]) thirds.push(gStds[2])
    }
    
    // Pega os 8 melhores terceiros
    thirds.sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for)
    const top8Thirds = thirds.slice(0, 8).map(s => s.team ? { ...s.team, isProjected: true } : null).filter(Boolean) as (Team & { isProjected?: boolean })[]
    
    return [...top2, ...top8Thirds]
  })()

  // Descobrir quais times já estão no mata-mata real
  const assignedTeamIds = new Set<string>()
  for (const m of matches) {
    if (m.phase === 'ROUND_32') {
      if (m.home_team_id) assignedTeamIds.add(m.home_team_id)
      if (m.away_team_id) assignedTeamIds.add(m.away_team_id)
    }
  }

  // Lista de times classificados que AINDA NÃO estão no mata-mata real
  const remainingProjectedTeams = qualifiedTeams.filter(t => !assignedTeamIds.has(t.id))

  // Preencher os buracos do R32 com os times projetados
  const projectedMatches = matches.map(m => {
    if (m.phase === 'ROUND_32') {
      const newM = { ...m }
      if (!newM.home_team_id && remainingProjectedTeams.length > 0) {
        newM.home_team = remainingProjectedTeams.shift()
      }
      if (!newM.away_team_id && remainingProjectedTeams.length > 0) {
        newM.away_team = remainingProjectedTeams.shift()
      }
      return newM
    }
    return m
  })

  const byRound = (r: string) => projectedMatches
    .filter(m => m.phase === r)
    .sort((a, b) =>
      new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
    )

  const r32 = byRound('ROUND_32')
  const r16 = byRound('ROUND_16')
  const qf = byRound('QUARTER_FINAL')
  const sf = byRound('SEMI_FINAL')
  const final = byRound('FINAL')
  const third = byRound('THIRD_PLACE')

  // Left vs Right strict mapping for R32 based on user rules
  // If r32 doesn't have 16 items yet, fill with undefined to prevent crashes
  const pad = (arr: any[], size: number) => {
    const res = [...arr]
    while (res.length < size) res.push(undefined)
    return res
  }

  const r32Full = pad(r32, 16)
  const r32Left = [1, 4, 0, 2, 10, 11, 8, 9].map(i => r32Full[i])
  const r32Right = [3, 5, 6, 7, 13, 15, 12, 14].map(i => r32Full[i])

  // Simple splitting for subsequent rounds
  const r16Full = pad(r16, 8)
  const r16Left = [0, 1, 4, 5].map(i => r16Full[i])
  const r16Right = [2, 3, 6, 7].map(i => r16Full[i])

  const qfFull = pad(qf, 4)
  const qfLeft = [0, 1].map(i => qfFull[i])
  const qfRight = [2, 3].map(i => qfFull[i])

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

        <BracketZoomWrapper>
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
        </BracketZoomWrapper>

        <LiveFloatingCard />
      </div>
    </main>
  )
}
