import { supabase } from '@/lib/supabase'
import BracketView from '@/components/BracketView'

export const revalidate = 60

export const metadata = {
  title: 'Mata-Mata — FIFA 2026 Dashboard',
  description: 'Chaveamento do mata-mata da Copa do Mundo FIFA 2026',
}

async function getData() {
  const { data: bracket } = await supabase
    .from('bracket')
    .select(`
      *,
      home_team:teams!bracket_home_team_id_fkey(*),
      away_team:teams!bracket_away_team_id_fkey(*),
      winner:teams!bracket_winner_id_fkey(*),
      match:matches(*)
    `)
    .order('round')
    .order('position')

  return bracket || []
}

export default async function BracketPage() {
  const bracket = await getData()

  return (
    <main className="page-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Mata-Mata</h1>
          <p className="page-subtitle">Oitavas → Quartas → Semis → Final</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          {bracket.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <h3 style={{ color: 'var(--text-secondary)' }}>Fase eliminatória ainda não iniciada</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                O chaveamento será exibido após a conclusão da fase de grupos.
              </p>
            </div>
          ) : (
            <BracketView bracket={bracket as any} />
          )}
        </div>
      </div>
    </main>
  )
}
