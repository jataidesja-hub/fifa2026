import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  fetchMatches,
  fetchStandings,
  fetchTeams,
  mapStatus,
  mapPhase,
} from '@/lib/football-api'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'fifa2026-cron-secret'
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let matchesUpdated = 0

  try {
    // Sync teams first
    const teams = await fetchTeams()
    for (const t of teams) {
      await supabase.from('teams').upsert({
        external_id: t.id,
        name: t.name,
        short_name: t.shortName,
        flag_url: t.crest,
        confederation: t.area?.code || '',
      }, { onConflict: 'external_id', ignoreDuplicates: false })
    }

    // Sync matches
    const matches = await fetchMatches()
    for (const m of matches) {
      const { data: homeTeam } = await supabase
        .from('teams').select('id').eq('external_id', m.homeTeam.id).single()
      const { data: awayTeam } = await supabase
        .from('teams').select('id').eq('external_id', m.awayTeam.id).single()

      if (!homeTeam || !awayTeam) continue

      await supabase.from('matches').upsert({
        external_id: m.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        home_score: m.score.fullTime.home || 0,
        away_score: m.score.fullTime.away || 0,
        home_score_extra: m.score.extraTime.home,
        away_score_extra: m.score.extraTime.away,
        home_score_penalties: m.score.penalties.home,
        away_score_penalties: m.score.penalties.away,
        phase: mapPhase(m.stage),
        group_name: m.group ? m.group.replace('GROUP_', '') : null,
        match_day: m.matchday,
        scheduled_at: m.utcDate,
        status: mapStatus(m.status),
      }, { onConflict: 'external_id', ignoreDuplicates: false })

      matchesUpdated++
    }

    // Sync standings
    const standings = await fetchStandings()
    for (const stage of standings) {
      if (!stage.table) continue
      for (const row of stage.table) {
        const { data: team } = await supabase
          .from('teams').select('id').eq('external_id', row.team.id).single()
        if (!team) continue

        const groupName = stage.group ? stage.group.replace('GROUP_', '') : 'A'
        await supabase.from('standings').upsert({
          team_id: team.id,
          group_name: groupName,
          position: row.position,
          played: row.playedGames,
          wins: row.won,
          draws: row.draw,
          losses: row.lost,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          goal_diff: row.goalDifference,
          points: row.points,
          form: row.form,
        }, { onConflict: 'team_id,group_name', ignoreDuplicates: false })
      }
    }

    await supabase.from('sync_log').insert({
      matches_updated: matchesUpdated,
      status: 'OK',
    })

    return NextResponse.json({ success: true, matchesUpdated })
  } catch (error: any) {
    await supabase.from('sync_log').insert({
      status: 'ERROR',
      error_message: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
