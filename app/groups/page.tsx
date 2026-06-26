import { supabase } from '@/lib/supabase'
import GroupTable from '@/components/GroupTable'

export const revalidate = 60

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

  return standings || []
}

export default async function GroupsPage() {
  const standings = await getData()

  const groupMap = standings.reduce((acc, s) => {
    const g = s.group_name
    if (!acc[g]) acc[g] = []
    acc[g].push(s)
    return acc
  }, {} as Record<string, typeof standings>)

  const groups = Object.keys(groupMap).sort()

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Fase de Grupos</h1>
          <p className="page-subtitle">12 grupos · 48 seleções · {standings.length > 0 ? `${groups.length} grupos com dados` : 'aguardando dados'}</p>
        </div>

        {groups.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Classificação ainda não disponível</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Os grupos serão exibidos assim que os dados forem sincronizados.
            </p>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map(g => (
              <GroupTable key={g} groupName={g} standings={groupMap[g] as any} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
