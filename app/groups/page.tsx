import { supabase, Standing, Team } from '@/lib/supabase'
import GroupTable from '@/components/GroupTable'

export const revalidate = 30

export const metadata = {
  title: 'Fase de Grupos — FIFA 2026 Dashboard',
  description: 'Classificação de todos os 12 grupos da Copa do Mundo FIFA 2026',
}

async function getData() {
  const { data: standings } = await supabase
    .from('standings')
    .select(`*, team:teams(*)`)
    .order('group_name')
    .order('position')

  return (standings || []) as (Standing & { team: Team })[]
}

export default async function GroupsPage() {
  const standings = await getData()
  
  // Group by group_name
  const groups: Record<string, (Standing & { team: Team })[]> = {}
  for (const s of standings) {
    const g = s.group_name
    if (!groups[g]) groups[g] = []
    groups[g].push(s)
  }

  const groupKeys = Object.keys(groups).sort()

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Fase de Grupos</h1>
          <p className="page-subtitle">
            {groupKeys.length > 0 ? `${groupKeys.length} grupos · 48 seleções` : 'Aguardando dados'}
          </p>
        </div>

        {groupKeys.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Classificação ainda não disponível</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Os grupos serão exibidos assim que os dados forem sincronizados.
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
