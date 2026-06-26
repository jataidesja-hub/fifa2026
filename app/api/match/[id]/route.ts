import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchMatch } from '@/lib/football-api'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (!match?.external_id) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const liveData = await fetchMatch(match.external_id)
  if (!liveData) {
    return NextResponse.json({ error: 'API error' }, { status: 500 })
  }

  await supabase.from('matches').update({
    home_score: liveData.score.fullTime.home || 0,
    away_score: liveData.score.fullTime.away || 0,
    status: liveData.status,
    minute: liveData.minute,
  }).eq('id', id)

  return NextResponse.json({ success: true })
}
