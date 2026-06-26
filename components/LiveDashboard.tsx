'use client'

import { useState, useEffect, useMemo } from 'react'
import { Match, Team } from '@/lib/supabase'
import GroupTable from '@/components/GroupTable'
import MatchCard from '@/components/MatchCard'

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

export default function LiveDashboard({
  initialTeams,
  initialMatches,
}: {
  initialTeams: Team[]
  initialMatches: (Match & { home_team?: Team; away_team?: Team })[]
}) {
  const [matches, setMatches] = useState(initialMatches)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch live match data every 60 seconds
  useEffect(() => {
    const fetchLive = async () => {
      try {
        setIsUpdating(true)
        const res = await fetch('/api/live-matches')
        if (res.ok) {
          const data = await res.json()
          if (data.matches) {
            // Update the local matches with live scores
            setMatches(prevMatches => {
              const newMatches = [...prevMatches]
              let hasChanges = false

              data.matches.forEach((extMatch: any) => {
                const idx = newMatches.findIndex(m => m.external_id === extMatch.id)
                if (idx !== -1) {
                  const m = newMatches[idx]
                  const newHome = extMatch.score?.fullTime?.home ?? m.home_score
                  const newAway = extMatch.score?.fullTime?.away ?? m.away_score
                  
                  // Map statuses
                  const map: Record<string, string> = {
                    SCHEDULED: 'SCHEDULED', TIMED: 'SCHEDULED', IN_PLAY: 'IN_PLAY',
                    PAUSED: 'PAUSED', FINISHED: 'FINISHED', POSTPONED: 'POSTPONED', CANCELLED: 'POSTPONED'
                  }
                  const newStatus = map[extMatch.status] || 'SCHEDULED'

                  if (m.home_score !== newHome || m.away_score !== newAway || m.status !== newStatus) {
                    newMatches[idx] = {
                      ...m,
                      home_score: newHome,
                      away_score: newAway,
                      status: newStatus
                    }
                    hasChanges = true
                  }
                }
              })

              return hasChanges ? newMatches : prevMatches
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch live matches:', err)
      } finally {
        setTimeout(() => setIsUpdating(false), 1000)
      }
    }

    const interval = setInterval(fetchLive, 60000) // 1 minute
    return () => clearInterval(interval)
  }, [])

  const groups = useMemo(() => {
    const stats: Record<string, StandingRow> = {}

    for (const t of initialTeams) {
      stats[t.id] = {
        team_id: t.id, team: t, group_name: t.group_name || 'A',
        played: 0, wins: 0, draws: 0, losses: 0,
        goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
        form: '', position: 1, id: t.id,
      }
    }

    // Include FINISHED and IN_PLAY matches in live standings calculation
    for (const m of matches.filter(m => m.status === 'FINISHED' || m.status === 'IN_PLAY')) {
      const hid = m.home_team_id
      const aid = m.away_team_id
      const hs = m.home_score ?? 0
      const as_ = m.away_score ?? 0

      if (!hid || !aid || !stats[hid] || !stats[aid]) continue

      stats[hid].played++
      stats[aid].played++
      stats[hid].goals_for += hs
      stats[hid].goals_against += as_
      stats[aid].goals_for += as_
      stats[aid].goals_against += hs

      if (hs > as_) {
        stats[hid].wins++; stats[hid].points += 3
        stats[aid].losses++
      } else if (hs < as_) {
        stats[aid].wins++; stats[aid].points += 3
        stats[hid].losses++
      } else {
        stats[hid].draws++; stats[hid].points++
        stats[aid].draws++; stats[aid].points++
      }
    }

    for (const s of Object.values(stats)) {
      s.goal_diff = s.goals_for - s.goals_against
    }

    const groupsMap: Record<string, StandingRow[]> = {}
    for (const s of Object.values(stats)) {
      const g = s.group_name
      if (!groupsMap[g]) groupsMap[g] = []
      groupsMap[g].push(s)
    }

    for (const g of Object.keys(groupsMap)) {
      groupsMap[g].sort((a, b) =>
        b.points - a.points ||
        b.goal_diff - a.goal_diff ||
        b.goals_for - a.goals_for ||
        a.team.name.localeCompare(b.team.name)
      )
      groupsMap[g].forEach((row, i) => { row.position = i + 1 })
    }

    return groupsMap
  }, [matches, initialTeams])

  const groupKeys = Object.keys(groups).sort()

  // Find live or next upcoming matches if none are today
  const liveMatches = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED').sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())
  
  // If there are live matches, show live + next 2 scheduled. If no live, show next 4 scheduled.
  const activeMatches = liveMatches.length > 0 
    ? [...liveMatches, ...scheduledMatches.slice(0, 4)]
    : scheduledMatches.slice(0, 4)

  return (
    <div className="live-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Jogos em Destaque (Ao Vivo & Hoje)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: isUpdating ? 'var(--accent)' : 'var(--text-muted)' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: isUpdating ? 'var(--accent)' : 'var(--text-muted)',
            boxShadow: isUpdating ? '0 0 8px var(--accent)' : 'none',
            transition: 'all 0.3s ease'
          }} />
          {isUpdating ? 'Sincronizando...' : 'Ao Vivo'}
        </div>
      </div>

      {activeMatches.length > 0 ? (
        <div className="matches-grid" style={{ marginBottom: '4rem' }}>
          {activeMatches.map(m => (
            <MatchCard key={m.id} match={m as any} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '4rem', color: 'var(--text-muted)' }}>
          Nenhum jogo ocorrendo hoje.
        </div>
      )}

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Classificação Dinâmica</h2>
      <div className="groups-grid">
        {groupKeys.map(g => (
          <GroupTable key={g} groupName={g} standings={groups[g] as any} />
        ))}
      </div>
    </div>
  )
}
