import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  fetchMatches,
  fetchStandings,
  fetchTeams,
  fetchScorers,
  mapStatus,
  mapPhase,
} from '@/lib/football-api'

export const runtime = 'nodejs'
export const maxDuration = 30

// Map country area codes to FIFA confederations
const AREA_TO_CONFEDERATION: Record<string, string> = {
  // UEFA (Europe)
  ENG: 'UEFA', GER: 'UEFA', ESP: 'UEFA', FRA: 'UEFA', ITA: 'UEFA', POR: 'UEFA',
  NED: 'UEFA', BEL: 'UEFA', CRO: 'UEFA', DEN: 'UEFA', AUT: 'UEFA', SCO: 'UEFA',
  SUI: 'UEFA', POL: 'UEFA', SRB: 'UEFA', HUN: 'UEFA', SVK: 'UEFA', CZE: 'UEFA',
  GRE: 'UEFA', ROM: 'UEFA', UKR: 'UEFA', TUR: 'UEFA', ALB: 'UEFA', SVN: 'UEFA',
  WAL: 'UEFA', FIN: 'UEFA', NOR: 'UEFA', SWE: 'UEFA', ISL: 'UEFA', GEO: 'UEFA',
  MNE: 'UEFA', BIH: 'UEFA', NIR: 'UEFA', IRL: 'UEFA', LUX: 'UEFA', BLR: 'UEFA',
  KVX: 'UEFA', MKD: 'UEFA',
  // CONMEBOL (South America)
  BRA: 'CONMEBOL', ARG: 'CONMEBOL', URU: 'CONMEBOL', COL: 'CONMEBOL', CHI: 'CONMEBOL',
  ECU: 'CONMEBOL', PAR: 'CONMEBOL', PER: 'CONMEBOL', BOL: 'CONMEBOL', VEN: 'CONMEBOL',
  // CONCACAF (North/Central America & Caribbean)
  USA: 'CONCACAF', MEX: 'CONCACAF', CAN: 'CONCACAF', CRC: 'CONCACAF', PAN: 'CONCACAF',
  JAM: 'CONCACAF', HON: 'CONCACAF', SLV: 'CONCACAF', GUA: 'CONCACAF', TRI: 'CONCACAF',
  CUB: 'CONCACAF',
  // CAF (Africa)
  MAR: 'CAF', SEN: 'CAF', GHA: 'CAF', NGA: 'CAF', CMR: 'CAF', CIV: 'CAF',
  EGY: 'CAF', TUN: 'CAF', ALG: 'CAF', MLI: 'CAF', GUI: 'CAF', COM: 'CAF',
  ZAM: 'CAF', ANG: 'CAF', MOZ: 'CAF', TAN: 'CAF', BFA: 'CAF', CTA: 'CAF',
  // AFC (Asia)
  JPN: 'AFC', KOR: 'AFC', AUS: 'AFC', IRN: 'AFC', SAU: 'AFC', QAT: 'AFC',
  IRQ: 'AFC', JOR: 'AFC', UZB: 'AFC', CHN: 'AFC', UAE: 'AFC', BHR: 'AFC',
  KWT: 'AFC', IND: 'AFC', THA: 'AFC', VIE: 'AFC', IDN: 'AFC', PHL: 'AFC',
  // OFC (Oceania)
  NZL: 'OFC',
}

function getConfederation(areaCode: string): string {
  return AREA_TO_CONFEDERATION[areaCode] || 'OTHER'
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'fifa2026-cron-secret'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let matchesUpdated = 0

  try {
    // 1. Sync teams
    const teams = await fetchTeams()
    for (const t of teams) {
      if (!t.id) continue
      
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('external_id', t.id)
        .single()

      if (!existingTeam) {
        await supabase.from('teams').insert({
          external_id: t.id,
          name: t.name,
          short_name: t.shortName || t.tla,
          flag_url: t.crest,
          confederation: getConfederation(t.area?.code || ''),
        })
      }
    }

    // 2. Build external_id → internal UUID map for teams
    const { data: dbTeams } = await supabase.from('teams').select('id, external_id').not('external_id', 'is', null)
    const teamMap: Record<number, string> = {}
    for (const t of (dbTeams || [])) {
      teamMap[t.external_id] = t.id
    }

    const scorers = await fetchScorers()
    if (scorers.length > 0) {
      // Upsert all players from scorers first
      for (const s of scorers) {
        if (!s.player?.id || !s.team?.id) continue
        const teamId = teamMap[s.team.id]
        if (!teamId) continue

        const { error: pError } = await supabase.from('players').upsert({
          external_id: s.player.id,
          name: s.player.name,
          team_id: teamId,
        }, { onConflict: 'external_id', ignoreDuplicates: false })
        if (pError) console.error('Player upsert error:', pError.message)
      }

      // Re-fetch player map after upsert
      const { data: updatedPlayerMapData } = await supabase.from('players').select('id, external_id')
      const playerMap: Record<number, string> = {}
      for (const p of (updatedPlayerMapData || [])) {
        playerMap[p.external_id] = p.id
      }

      // Clear existing to avoid constraint errors, then insert fresh
      await supabase.from('player_stats').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      const statsToInsert = []
      for (const s of scorers) {
        if (!s.player?.id || !playerMap[s.player.id]) continue
        statsToInsert.push({
          player_id: playerMap[s.player.id],
          goals: s.goals,
          assists: s.assists ?? 0,
          played_matches: s.playedMatches ?? 0,
        })
      }
      
      if (statsToInsert.length > 0) {
        const { error } = await supabase.from('player_stats').insert(statsToInsert)
        if (error) console.error('Player stats insert error:', error.message)
      }
    }

    // 3. Sync ALL matches (including knockout TBDs)
    const matches = await fetchMatches()
    for (const m of matches) {
      // Allow knockout matches with null teams - they'll be updated when determined
      const homeId = m.homeTeam?.id ? teamMap[m.homeTeam.id] : null
      const awayId = m.awayTeam?.id ? teamMap[m.awayTeam.id] : null

      // Skip group matches without teams (shouldn't happen but guard anyway)
      const phase = mapPhase(m.stage)
      if (phase === 'GROUP' && (!homeId || !awayId)) continue

      const { error } = await supabase.from('matches').upsert({
        external_id: m.id,
        home_team_id: homeId,
        away_team_id: awayId,
        home_score: m.score?.fullTime?.home ?? 0,
        away_score: m.score?.fullTime?.away ?? 0,
        home_score_extra: m.score?.extraTime?.home ?? null,
        away_score_extra: m.score?.extraTime?.away ?? null,
        home_score_penalties: m.score?.penalties?.home ?? null,
        away_score_penalties: m.score?.penalties?.away ?? null,
        phase,
        group_name: m.group ? m.group.replace('GROUP_', '') : null,
        match_day: m.matchday,
        scheduled_at: m.utcDate,
        status: mapStatus(m.status),
      }, { onConflict: 'external_id', ignoreDuplicates: false })

      if (error) console.error('Match upsert error:', error.message, m.id)
      else matchesUpdated++
    }

    // 4. Sync standings
    const standings = await fetchStandings()
    for (const stage of standings) {
      if (!stage.table) continue
      for (const row of stage.table) {
        if (!row.team?.id) continue
        const teamId = teamMap[row.team.id]
        if (!teamId) continue

        const groupName = stage.group ? stage.group.replace(/Group\s?_?/i, '').trim() : 'A'

        // We skip overwriting group_name to preserve user's hardcoded groups
        // await supabase.from('teams').update({ group_name: groupName }).eq('id', teamId)
      }
    }

    await supabase.from('sync_log').insert({
      matches_updated: matchesUpdated,
      status: 'OK',
    })

    return NextResponse.json({ success: true, matchesUpdated, teamsLoaded: teams.length })
  } catch (error: any) {
    await supabase.from('sync_log').insert({
      status: 'ERROR',
      error_message: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
