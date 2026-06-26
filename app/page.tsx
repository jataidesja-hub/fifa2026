import { supabase, Match, Team } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import LiveScore from '@/components/LiveScore'
import Link from 'next/link'

export const revalidate = 30

async function getData() {
  const now = new Date().toISOString()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    { data: allMatches },
    { data: topScorers },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`)
      .order('scheduled_at', { ascending: false })
      .limit(100),
    supabase
      .from('player_stats')
      .select(`*, player:players(*, team:teams(*))`)
      .order('goals', { ascending: false })
      .limit(10),
  ])

  const all = (allMatches || []) as (Match & { home_team?: Team; away_team?: Team })[]
  const liveMatches = all.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const finishedMatches = all.filter(m => m.status === 'FINISHED')
  const scheduledMatches = all.filter(m => m.status === 'SCHEDULED')

  // Today's matches (all statuses)
  const todayMatches = all.filter(m => {
    const d = new Date(m.scheduled_at)
    return d >= todayStart && d <= todayEnd
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  // Recent results (last 12 finished)
  const recentFinished = [...finishedMatches].sort((a, b) =>
    new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  ).slice(0, 12)

  // Upcoming (next 8 scheduled, not today)
  const upcoming = scheduledMatches.filter(m => {
    const d = new Date(m.scheduled_at)
    return d > todayEnd
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).slice(0, 8)

  const totalGoals = finishedMatches.reduce((acc, m) => acc + (m.home_score || 0) + (m.away_score || 0), 0)

  return {
    all, liveMatches, finishedMatches, scheduledMatches,
    todayMatches, recentFinished, upcoming,
    topScorers: topScorers || [], totalGoals,
  }
}

export default async function HomePage() {
  const { all, liveMatches, finishedMatches, todayMatches, recentFinished, upcoming, topScorers, totalGoals } = await getData()

  return (
    <main className="page-content">
      <div className="container">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-block', padding: '0.35rem 1rem',
            background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)',
            borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)',
            marginBottom: '1rem', letterSpacing: '0.1em',
          }}>
            🏆 Copa do Mundo FIFA 2026
          </div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Dashboard em Tempo Real</h1>
          <p className="page-subtitle">48 seleções · 104 jogos · USA, Canada &amp; Mexico</p>
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
          {[
            { v: all.filter(m => m.home_team_id && m.away_team_id).length, l: 'Jogos', c: '' },
            { v: finishedMatches.length, l: 'Finalizados', c: '' },
            { v: liveMatches.length, l: 'Ao Vivo', c: liveMatches.length > 0 ? 'var(--green-live)' : '' },
            { v: totalGoals, l: 'Gols', c: 'var(--gold)' },
          ].map(({ v, l, c }) => (
            <div key={l} className="stat-card animate-fade-up">
              <div className="stat-value" style={c ? { color: c } : {}}>{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>

        {/* Live matches */}
        <LiveScore initialMatches={all as any} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
          <div>
            {/* Today */}
            {todayMatches.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div className="section-title">Jogos de Hoje</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {todayMatches.map(m => <MatchCard key={m.id} match={m as any} showGroup />)}
                </div>
              </div>
            )}

            {/* Recent results */}
            {recentFinished.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div className="section-title">Resultados Recentes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentFinished.map(m => <MatchCard key={m.id} match={m as any} showGroup />)}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <div className="section-title">Próximos Jogos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {upcoming.map(m => <MatchCard key={m.id} match={m as any} showGroup />)}
                </div>
              </div>
            )}

            {all.length === 0 && (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Aguardando dados</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Vá para Admin → Sincronização → Executar Sync
                </p>
                <Link href="/admin" className="btn btn-gold" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  Ir para Admin
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Artilheiros */}
            <div className="section-title">Artilheiros</div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              {topScorers.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Sem dados ainda
                </div>
              ) : topScorers.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.7rem 1rem',
                  borderBottom: i < topScorers.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: i === 0 ? 'var(--gold)' : 'var(--text-muted)', minWidth: 20 }}>{i + 1}</span>
                  {s.player?.team?.flag_url && <img src={s.player.team.flag_url} alt="" style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.player?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.player?.team?.name}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)' }}>{s.goals}</span>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/groups" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                📊 Fase de Grupos
              </Link>
              <Link href="/bracket" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                🏆 Chaveamento Mata-Mata
              </Link>
              <Link href="/teams" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                🌍 Seleções
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
