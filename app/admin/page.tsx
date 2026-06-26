'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Tab = 'matches' | 'teams' | 'players' | 'sync'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('matches')
  const [authenticated, setAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  // Data states
  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [syncLogs, setSyncLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Match form
  const [matchForm, setMatchForm] = useState({
    home_team_id: '', away_team_id: '', home_score: 0, away_score: 0,
    phase: 'GROUP', group_name: '', scheduled_at: '', status: 'SCHEDULED',
    match_day: 1, minute: 0,
  })

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(d => {
      if (d.authenticated) { setAuthenticated(true); loadData('matches') }
    })
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    })
    if (res.ok) { setAuthenticated(true); loadData('matches') }
    else setLoginError('Credenciais inválidas')
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setAuthenticated(false)
  }

  const loadData = async (t: Tab) => {
    setLoading(true)
    if (t === 'matches') {
      const { data } = await supabase.from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .order('scheduled_at', { ascending: false }).limit(50)
      setMatches(data || [])
    } else if (t === 'teams') {
      const { data } = await supabase.from('teams').select('*').order('name')
      setTeams(data || [])
      // Also load for dropdowns
    } else if (t === 'players') {
      const { data } = await supabase.from('players').select(`*, team:teams(name)`).order('name').limit(100)
      setPlayers(data || [])
    } else if (t === 'sync') {
      const [{ data: logs }, { data: teamsData }] = await Promise.all([
        supabase.from('sync_log').select('*').order('synced_at', { ascending: false }).limit(20),
        supabase.from('teams').select('id, name').order('name'),
      ])
      setSyncLogs(logs || [])
      setTeams(teamsData || [])
    }
    setLoading(false)
  }

  const switchTab = (t: Tab) => { setTab(t); loadData(t) }

  const runSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/sync', { headers: { Authorization: 'Bearer fifa2026-cron-secret' } })
      const data = await res.json()
      setSyncMsg(res.ok ? `✅ Sync concluído: ${data.matchesUpdated} jogos atualizados` : `❌ Erro: ${data.error}`)
    } catch (err: any) {
      setSyncMsg(`❌ ${err.message}`)
    }
    setSyncing(false)
    loadData('sync')
  }

  const updateMatchStatus = async (id: string, field: string, value: any) => {
    await supabase.from('matches').update({ [field]: value }).eq('id', id)
    loadData('matches')
  }

  const deleteMatch = async (id: string) => {
    if (!confirm('Excluir partida?')) return
    await supabase.from('matches').delete().eq('id', id)
    loadData('matches')
  }

  if (!authenticated) {
    return (
      <main className="page-content">
        <div className="container" style={{ maxWidth: '400px' }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>ADMIN</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>FIFA 2026 Dashboard</div>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Usuário</label>
                <input
                  className="form-input"
                  type="text"
                  id="admin-username"
                  value={loginData.username}
                  onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))}
                  placeholder="jasantos"
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  className="form-input"
                  type="password"
                  id="admin-password"
                  value={loginData.password}
                  onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••"
                  autoComplete="current-password"
                />
              </div>
              {loginError && <div style={{ color: 'var(--red-card)', fontSize: '0.875rem', marginBottom: '1rem' }}>{loginError}</div>}
              <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                Entrar
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-content">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Painel Admin</h1>
          <button className="btn btn-ghost" onClick={handleLogout}>Sair</button>
        </div>

        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          {(['matches', 'teams', 'players', 'sync'] as Tab[]).map(t => (
            <button key={t} id={`tab-${t}`} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => switchTab(t)}>
              {{ matches: 'Jogos', teams: 'Seleções', players: 'Jogadores', sync: 'Sincronização' }[t]}
            </button>
          ))}
        </div>

        {/* SYNC TAB */}
        {tab === 'sync' && (
          <div>
            <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Sincronizar com football-data.org</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Puxa dados atualizados da API e salva no Supabase. Configure a FOOTBALL_DATA_API_KEY no .env.local primeiro.
              </p>
              <button
                className={`btn btn-gold`}
                id="btn-sync"
                onClick={runSync}
                disabled={syncing}
                style={{ opacity: syncing ? 0.7 : 1 }}
              >
                {syncing ? 'Sincronizando...' : '🔄 Executar Sync'}
              </button>
              {syncMsg && (
                <div style={{
                  marginTop: '1rem', padding: '0.75rem 1rem',
                  background: syncMsg.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${syncMsg.includes('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: '0.875rem',
                }}>
                  {syncMsg}
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>Log de Sincronizações</span></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Data</th><th>Status</th><th>Jogos</th><th>Erro</th></tr></thead>
                  <tbody>
                    {syncLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(log.synced_at).toLocaleString('pt-BR')}
                        </td>
                        <td>
                          <span style={{ color: log.status === 'OK' ? 'var(--green-live)' : 'var(--red-card)', fontWeight: 600 }}>
                            {log.status}
                          </span>
                        </td>
                        <td>{log.matches_updated}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--red-card)' }}>{log.error_message || '—'}</td>
                      </tr>
                    ))}
                    {syncLogs.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum log</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {tab === 'matches' && (
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 700 }}>Partidas ({matches.length})</span>
            </div>
            {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th><th>Mandante</th><th>Placar</th><th>Visitante</th>
                      <th>Fase</th><th>Status</th><th>Min</th><th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {new Date(m.scheduled_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.home_team?.name || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <input type="number" style={{ width: '40px', background: 'var(--bg-700)', border: 'none', color: 'var(--gold)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', borderRadius: '4px', padding: '2px' }}
                            value={m.home_score} min={0}
                            onChange={e => updateMatchStatus(m.id, 'home_score', parseInt(e.target.value))}
                          />
                          {' - '}
                          <input type="number" style={{ width: '40px', background: 'var(--bg-700)', border: 'none', color: 'var(--gold)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', borderRadius: '4px', padding: '2px' }}
                            value={m.away_score} min={0}
                            onChange={e => updateMatchStatus(m.id, 'away_score', parseInt(e.target.value))}
                          />
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.away_team?.name || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{m.phase}{m.group_name ? ` G${m.group_name}` : ''}</td>
                        <td>
                          <select
                            className="form-select" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                            value={m.status}
                            onChange={e => updateMatchStatus(m.id, 'status', e.target.value)}
                          >
                            {['SCHEDULED','IN_PLAY','PAUSED','FINISHED','POSTPONED'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {m.status === 'IN_PLAY' && (
                            <input type="number" style={{ width: '50px', background: 'var(--bg-700)', border: 'none', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '4px', padding: '2px', fontSize: '0.875rem' }}
                              value={m.minute || 0} min={0} max={120}
                              onChange={e => updateMatchStatus(m.id, 'minute', parseInt(e.target.value))}
                            />
                          )}
                        </td>
                        <td>
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => deleteMatch(m.id)}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                    {matches.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhuma partida. Execute o sync.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700 }}>Seleções ({teams.length})</span></div>
            {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Bandeira</th><th>Nome</th><th>Curto</th><th>Grupo</th><th>Confederação</th><th>ID Ext.</th></tr></thead>
                  <tbody>
                    {teams.map(t => (
                      <tr key={t.id}>
                        <td>{t.flag_url && <img src={t.flag_url} alt="" style={{ width: '32px', height: '22px', objectFit: 'cover', borderRadius: '3px' }} />}</td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.short_name}</td>
                        <td>{t.group_name}</td>
                        <td>{t.confederation}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.external_id}</td>
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhuma seleção</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700 }}>Jogadores ({players.length})</span></div>
            {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Nome</th><th>Posição</th><th>Seleção</th></tr></thead>
                  <tbody>
                    {players.map(p => (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{p.jersey_number || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>
                          <span style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-600)', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {p.position}
                          </span>
                        </td>
                        <td>{p.team?.name}</td>
                      </tr>
                    ))}
                    {players.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum jogador</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
