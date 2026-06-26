import { supabase, Match, Team } from '@/lib/supabase'
import GroupTable from '@/components/GroupTable'

export const revalidate = 30

export const metadata = {
  title: 'Fase de Grupos — FIFA 2026 Dashboard',
  description: 'Classificação de todos os 12 grupos da Copa do Mundo FIFA 2026',
}

type StandingRow = {
  team_id: string
  team: Team
  group_name: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  form: string
  position: number
  id: string
}

async function getData() {
  // Fetch all group-stage matches with teams
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('phase', 'GROUP')
    .order('scheduled_at')

  return matches || []
}

function computeStandings(matches: (Match & { home_team?: Team; away_team?: Team })[]) {
  const stats: Record<string, StandingRow> = {}

  // Initialize all teams (even with 0 played)
  for (const m of matches) {
    const hid = m.home_team_id
    const aid = m.away_team_id
    const grp = m.group_name || 'A'

    if (m.home_team && !stats[hid]) {
      stats[hid] = {
        team_id: hid, team: m.home_team, group_name: grp,
        played: 0, wins: 0, draws: 0, losses: 0,
        goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
        form: '', position: 1, id: hid,
      }
    }
    if (m.away_team && !stats[aid]) {
      stats[aid] = {
        team_id: aid, team: m.away_team, group_name: grp,
        played: 0, wins: 0, draws: 0, losses: 0,
        goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
        form: '', position: 1, id: aid,
      }
    }
  }

  // Compute from finished matches
  for (const m of matches.filter(m => m.status === 'FINISHED')) {
    const hid = m.home_team_id
    const aid = m.away_team_id
    const hs = m.home_score ?? 0
    const as_ = m.away_score ?? 0

    if (!stats[hid] || !stats[aid]) continue

    stats[hid].played++
    stats[aid].played++
    stats[hid].goals_for += hs
    stats[hid].goals_against += as_
    stats[aid].goals_for += as_
    stats[aid].goals_against += hs

    if (hs > as_) {
      stats[hid].wins++; stats[hid].points += 3
      stats[aid].losses++
      stats[hid].form += 'W'; stats[aid].form += 'L'
    } else if (hs < as_) {
      stats[aid].wins++; stats[aid].points += 3
      stats[hid].losses++
      stats[hid].form += 'L'; stats[aid].form += 'W'
    } else {
      stats[hid].draws++; stats[hid].points++
      stats[aid].draws++; stats[aid].points++
      stats[hid].form += 'D'; stats[aid].form += 'D'
    }
  }

  // Compute goal diff
  for (const s of Object.values(stats)) {
    s.goal_diff = s.goals_for - s.goals_against
  }

  // Group and sort
  const groups: Record<string, StandingRow[]> = {}
  for (const s of Object.values(stats)) {
    const g = s.group_name
    if (!groups[g]) groups[g] = []
    groups[g].push(s)
  }

  // Sort each group: pts desc, gd desc, gf desc, name asc
  for (const g of Object.keys(groups)) {
    groups[g].sort((a, b) =>
      b.points - a.points ||
      b.goal_diff - a.goal_diff ||
      b.goals_for - a.goals_for ||
      a.team.name.localeCompare(b.team.name)
    )
    groups[g].forEach((row, i) => { row.position = i + 1 })
  }

  return groups
}

export default async function GroupsPage() {
  const matches = await getData()
  const groups = computeStandings(matches as any)
  const groupKeys = Object.keys(groups).sort()
  const totalFinished = matches.filter(m => m.status === 'FINISHED').length

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Fase de Grupos</h1>
          <p className="page-subtitle">
            {groupKeys.length} grupos · {Object.values(groups).flat().length} seleções
            {totalFinished > 0 && ` · ${totalFinished} jogos disputados`}
          </p>
        </div>

        {groupKeys.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Aguardando dados</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Execute o sync em <a href="/admin" style={{ color: 'var(--blue-accent)' }}>/admin</a> para carregar os grupos.
            </p>
          </div>
        ) : (
          <div className="groups-grid">
            {groupKeys.map(g => (
              <GroupTable key={g} groupName={g} standings={groups[g] as any} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
