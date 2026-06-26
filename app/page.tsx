import { supabase } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import LiveScore from '@/components/LiveScore'
import Link from 'next/link'

export const revalidate = 60

async function getData() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    { data: allMatches },
    { data: topScorers },
    { data: stats },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`)
      .order('scheduled_at', { ascending: true })
      .limit(50),
    supabase
      .from('player_stats')
      .select(`*, player:players(*, team:teams(*))`)
      .order('goals', { ascending: false })
      .limit(10),
    supabase
      .from('matches')
      .select('status, home_score, away_score'),
  ])

  const liveMatches = (allMatches || []).filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const finishedMatches = (allMatches || []).filter(m => m.status === 'FINISHED')
  const scheduledMatches = (allMatches || []).filter(m => m.status === 'SCHEDULED').slice(0, 10)
  const totalGoals = (stats || []).reduce((acc, m) => acc + (m.home_score || 0) + (m.away_score || 0), 0)

  return { allMatches: allMatches || [], liveMatches, finishedMatches, scheduledMatches, topScorers: topScorers || [], totalGoals, totalMatches: (stats || []).length }
}

export default async function HomePage() {
  const { allMatches, liveMatches, finishedMatches, scheduledMatches, topScorers, totalGoals, totalMatches } = await getData()

  const recentFinished = finishedMatches.slice(-8).reverse()

  return (
    <main className="page-content">
      <div className="container">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            background: 'rgba(240,192,64,0.1)',
            border: '1px solid rgba(240,192,64,0.3)',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--gold)',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
          }}>
            🏆 Copa do Mundo FIFA 2026
          </div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Dashboard em Tempo Real</h1>
          <p className="page-subtitle">48 seleções · 104 jogos · USA, Canada & Mexico</p>
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
          <div className="stat-card animate-fade-up">
            <div className="stat-value">{totalMatches}</div>
            <div className="stat-label">Jogos</div>
          </div>
          <div className="stat-card animate-fade-up delay-1">
            <div className="stat-value">{finishedMatches.length}</div>
            <div className="stat-label">Finalizados</div>
          </div>
          <div className="stat-card animate-fade-up delay-2">
            <div className="stat-value" style={{ color: 'var(--green-live)' }}>{liveMatches.length}</div>
            <div className="stat-label">Ao Vivo</div>
          </div>
          <div className="stat-card animate-fade-up delay-3">
            <div className="stat-value">{totalGoals}</div>
            <div className="stat-label">Gols</div>
          </div>
        </div>

        {/* Live matches widget */}
        <LiveScore initialMatches={allMatches as any} />

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
          <div>
            {/* Próximos jogos */}
            {scheduledMatches.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div className="section-title">Próximos Jogos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {scheduledMatches.map(match => (
                    <MatchCard key={match.id} match={match as any} showGroup />
                  ))}
                </div>
              </div>
            )}

            {/* Resultados recentes */}
            {recentFinished.length > 0 && (
              <div>
                <div className="section-title">Resultados Recentes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentFinished.map(match => (
                    <MatchCard key={match.id} match={match as any} showGroup />
                  ))}
                </div>
              </div>
            )}

            {scheduledMatches.length === 0 && recentFinished.length === 0 && (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Aguardando dados</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Configure a API key e execute o sync para carregar os jogos.
                </p>
                <Link href="/admin" className="btn btn-gold" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  Ir para Admin
                </Link>
              </div>
            )}
          </div>

          {/* Artilheiros sidebar */}
          <div>
            <div className="section-title">Artilheiros</div>
            <div className="card">
              {topScorers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Sem dados ainda
                </div>
              ) : (
                topScorers.map((scorer, i) => (
                  <div key={scorer.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderBottom: i < topScorers.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                      color: i === 0 ? 'var(--gold)' : 'var(--text-muted)',
                      minWidth: '20px',
                    }}>{i + 1}</span>
                    {scorer.player?.team?.flag_url && (
                      <img src={scorer.player.team.flag_url} alt="" style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {scorer.player?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {scorer.player?.team?.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)' }}>{scorer.goals}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>gols</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick links */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/groups" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                Ver Classificação por Grupos
              </Link>
              <Link href="/bracket" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                Ver Chaveamento Mata-Mata
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
