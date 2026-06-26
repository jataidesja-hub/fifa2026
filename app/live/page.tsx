import { supabase, Match, Team } from '@/lib/supabase'
import LiveDashboard from '@/components/LiveDashboard'

export const revalidate = 60 // Base cache

export const metadata = {
  title: 'Ao Vivo — FIFA 2026 Dashboard',
  description: 'Acompanhe placares ao vivo e a reorganização automática dos grupos da Copa 2026',
}

async function getData() {
  const [
    { data: allTeams },
    { data: matches }
  ] = await Promise.all([
    supabase.from('teams').select('*').not('group_name', 'is', null),
    supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)').order('scheduled_at', { ascending: true })
  ])

  return { allTeams: (allTeams || []) as Team[], matches: (matches || []) as (Match & { home_team?: Team; away_team?: Team })[] }
}

export default async function LivePage() {
  const { allTeams, matches } = await getData()

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Placar Ao Vivo</h1>
          <p className="page-subtitle">
            Acompanhe os resultados em tempo real. A classificação dos grupos se ajusta no momento do gol!
          </p>
        </div>

        <LiveDashboard initialTeams={allTeams} initialMatches={matches} />
      </div>
    </main>
  )
}
