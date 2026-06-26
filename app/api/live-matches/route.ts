import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: dbMatches } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .order('scheduled_at', { ascending: true })

    if (!dbMatches) return NextResponse.json({ matches: [] })

    const now = new Date()
    
    const liveMatches = dbMatches.map(m => {
      const scheduled = new Date(m.scheduled_at)
      const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / 60000)
      
      let status = m.status
      let minute = m.minute
      let home_score = m.home_score ?? 0
      let away_score = m.away_score ?? 0

      // Match is happening now (within 115 minutes from scheduled start)
      if (diffMinutes >= 0 && diffMinutes <= 115) {
        status = 'IN_PLAY'
        minute = diffMinutes > 45 ? diffMinutes - 15 : diffMinutes // Simples halftime offset
        
        // Exact match mock for the simulation showcase
        if (m.home_team?.name === 'Norway' && m.away_team?.name === 'France') {
           home_score = 1; away_score = 2; minute = diffMinutes - 4;
        } else if (m.home_team?.name === 'Senegal' && m.away_team?.name === 'Iraq') {
           home_score = 1; away_score = 0; minute = diffMinutes - 5;
        } else {
           // General deterministic mock
           home_score = Math.floor((minute || 0) / 30)
           away_score = Math.floor((minute || 0) / 40)
        }
      }

      return {
        id: m.external_id || m.id,
        status: status,
        minute: minute,
        homeTeam: { id: m.home_team?.external_id, name: m.home_team?.name },
        awayTeam: { id: m.away_team?.external_id, name: m.away_team?.name },
        score: {
          fullTime: { home: home_score, away: away_score }
        }
      }
    })

    return NextResponse.json({ matches: liveMatches })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
