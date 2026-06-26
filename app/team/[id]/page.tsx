import { supabase } from '@/lib/supabase'
import { Player } from '@/lib/supabase'
import MatchCard from '@/components/MatchCard'
import { notFound } from 'next/navigation'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: team } = await supabase.from('teams').select('name').eq('id', id).single()
  return { title: `${team?.name || 'Seleção'} — FIFA 2026` }
}

async function getData(id: string) {
  const [
    { data: team },
    { data: players },
    { data: stats },
    { data: homeMatches },
    { data: awayMatches },
    { data: playerStats },
  ] = await Promise.all([
    supabase.from('teams').select('*').eq('id', id).single(),
    supabase.from('players').select('*').eq('team_id', id).order('position').order('jersey_number'),
    supabase.from('standings').select('*').eq('team_id', id).single(),
    supabase.from('matches').select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`).eq('home_team_id', id).order('scheduled_at'),
    supabase.from('matches').select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`).eq('away_team_id', id).order('scheduled_at'),
    supabase.from('player_stats').select(`*, player:players(*)`).in('player_id',
      (await supabase.from('players').select('id').eq('team_id', id)).data?.map(p => p.id) || []
    ).order('goals', { ascending: false }),
  ])

  if (!team) return null

  const allMatches = [...(homeMatches || []), ...(awayMatches || [])].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )

  return { team, players: players || [], stats: stats || null, matches: allMatches, playerStats: playerStats || [] }
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
  if (!data) return notFound()

  const { team, players, stats, matches, playerStats } = data

  const posByPos = players.reduce((acc: Record<string, Player[]>, p: Player) => {
    if (!acc[p.position]) acc[p.position] = []
    acc[p.position].push(p)
    return acc
  }, {} as Record<string, typeof players>)

  const posOrder = ['GK', 'DF', 'MF', 'FW']
  const posLabel: Record<string, string> = { GK: 'Goleiros', DF: 'Defensores', MF: 'Meio-Campistas', FW: 'Atacantes' }

  return (
    <main className="page-content">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {team.flag_url ? (
            <img src={team.flag_url} alt={team.name} style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }} />
          ) : null}
          <div>
            <h1 className="page-title" style={{ fontSize: '2rem' }}>{team.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {team.group_name && <span>Grupo {team.group_name}</span>}
              {team.confederation && <span>{team.confederation}</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
            {[
              { v: stats.points, l: 'Pontos', c: 'var(--gold)' },
              { v: stats.played, l: 'Jogos' },
              { v: stats.wins, l: 'Vitórias', c: 'var(--green-live)' },
              { v: stats.draws, l: 'Empates' },
              { v: stats.losses, l: 'Derrotas', c: 'var(--red-card)' },
              { v: stats.goals_for, l: 'Gols Marcados', c: 'var(--green-live)' },
              { v: stats.goals_against, l: 'Gols Sofridos', c: 'var(--red-card)' },
              { v: `${stats.goal_diff > 0 ? '+' : ''}${stats.goal_diff}`, l: 'Saldo' },
            ].map(({ v, l, c }) => (
              <div key={l} className="stat-card">
                <div className="stat-value" style={c ? { color: c } : {}}>{v}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Players */}
          <div>
            <div className="section-title">Elenco</div>
            {posOrder.map(pos => posByPos[pos]?.length ? (
              <div key={pos} style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  {posLabel[pos]}
                </div>
                <div className="card">
                  {posByPos[pos].map((player: Player, i: number) => {
                    const ps = playerStats.find(s => s.player_id === player.id)
                    return (
                      <div key={player.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.65rem 1rem',
                        borderBottom: i < posByPos[pos].length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-muted)', minWidth: '28px' }}>
                          {player.jersey_number || '—'}
                        </span>
                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{player.name}</span>
                        {ps && ps.goals > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--green-live)', fontWeight: 600 }}>⚽ {ps.goals}</span>
                        )}
                        {ps && ps.yellow_cards > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--yellow-card)' }}>🟨{ps.yellow_cards}</span>
                        )}
                        {ps && ps.red_cards > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--red-card)' }}>🟥{ps.red_cards}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null)}
            {players.length === 0 && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Sem dados de jogadores
              </div>
            )}
          </div>

          {/* Matches */}
          <div>
            <div className="section-title">Partidas</div>
            {matches.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Sem partidas cadastradas
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {matches.map(m => <MatchCard key={m.id} match={m as any} showGroup />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
