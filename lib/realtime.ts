import { supabase, Match, MatchEvent, Standing } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

type MatchUpdateCallback = (match: Match) => void
type EventCallback = (event: MatchEvent) => void
type StandingUpdateCallback = (standing: Standing) => void

let matchChannel: RealtimeChannel | null = null
let standingChannel: RealtimeChannel | null = null

export function subscribeToMatch(
  matchId: string,
  onMatchUpdate: MatchUpdateCallback,
  onEvent: EventCallback
): () => void {
  const channel = supabase
    .channel(`match-${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      (payload) => onMatchUpdate(payload.new as Match)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` },
      (payload) => onEvent(payload.new as MatchEvent)
    )
    .subscribe()

  matchChannel = channel

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToStandings(
  onUpdate: StandingUpdateCallback
): () => void {
  const channel = supabase
    .channel('standings-all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'standings' },
      (payload) => onUpdate(payload.new as Standing)
    )
    .subscribe()

  standingChannel = channel

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToLiveMatches(
  onUpdate: MatchUpdateCallback
): () => void {
  const channel = supabase
    .channel('live-matches')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches' },
      (payload) => {
        const match = payload.new as Match
        if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
          onUpdate(match)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
