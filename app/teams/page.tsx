import { supabase } from '@/lib/supabase'
import { Team } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 60

export const metadata = {
  title: 'Seleções — FIFA 2026 Dashboard',
}

const CONFEDERATIONS: Record<string, { label: string; color: string }> = {
  UEFA: { label: 'Europa', color: '#3b82f6' },
  CONMEBOL: { label: 'América do Sul', color: '#22c55e' },
  CONCACAF: { label: 'América do Norte/Central', color: '#f59e0b' },
  CAF: { label: 'África', color: '#ef4444' },
  AFC: { label: 'Ásia', color: '#8b5cf6' },
  OFC: { label: 'Oceania', color: '#06b6d4' },
}

async function getData() {
  const { data: teams } = await supabase
    .from('teams')
    .select(`*`)
    .order('confederation')
    .order('name')

  const { data: standings } = await supabase
    .from('standings')
    .select('team_id, points, goals_for, goals_against, wins, played')

  return { teams: teams || [], standings: standings || [] }
}

export default async function TeamsPage() {
  const { teams, standings } = await getData()

  const statsMap = standings.reduce((acc, s) => {
    acc[s.team_id] = s
    return acc
  }, {} as Record<string, any>)

  const confMap = teams.reduce((acc, t) => {
    const c = t.confederation || 'OTHER'
    if (!acc[c]) acc[c] = []
    acc[c].push(t)
    return acc
  }, {} as Record<string, typeof teams>)

  const confs = Object.keys(confMap).sort()

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Seleções</h1>
          <p className="page-subtitle">{teams.length} seleções classificadas</p>
        </div>

        {teams.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Aguardando dados das seleções</h3>
          </div>
        ) : confs.map(conf => (
          <div key={conf} style={{ marginBottom: '2.5rem' }}>
            <div className="section-title">
              <span style={{ color: CONFEDERATIONS[conf]?.color || 'var(--gold)' }}>
                {conf}
              </span>
              {CONFEDERATIONS[conf]?.label && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  — {CONFEDERATIONS[conf].label}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {confMap[conf].map((team: Team) => {
                const stats = statsMap[team.id]
                return (
                  <Link href={`/team/${team.id}`} key={team.id}>
                    <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {team.flag_url ? (
                          <img src={team.flag_url} alt={team.name} style={{ width: '48px', height: '34px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
                        ) : (
                          <div style={{ width: '48px', height: '34px', background: 'var(--bg-600)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {team.short_name || team.name.slice(0, 3)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</div>
                          {team.group_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grupo {team.group_name}</div>
                          )}
                        </div>
                      </div>
                      {stats && (
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span title="Jogos">⚽ {stats.played}J</span>
                          <span title="Pontos" style={{ color: 'var(--gold)', fontWeight: 700 }}>{stats.points} pts</span>
                          <span title="Gols Marcados">+{stats.goals_for}G</span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
