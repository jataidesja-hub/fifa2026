import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export type Team = {
  id: string
  name: string
  short_name: string
  flag_url: string
  group_name: string
  confederation: string
  external_id: number
}

export type Player = {
  id: string
  team_id: string
  name: string
  position: string
  jersey_number: number
  nationality: string
  date_of_birth: string
  external_id: number
}

export type Match = {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  home_score_extra: number | null
  away_score_extra: number | null
  home_score_penalties: number | null
  away_score_penalties: number | null
  phase: string
  group_name: string | null
  match_day: number | null
  bracket_position: number | null
  venue_id: string | null
  scheduled_at: string
  status: string
  minute: number | null
  external_id: number | null
  home_team?: Team
  away_team?: Team
  venue?: Venue
}

export type MatchEvent = {
  id: string
  match_id: string
  player_id: string | null
  team_id: string | null
  type: string
  minute: number | null
  extra_minute: number | null
  detail: string | null
  player?: Player
  team?: Team
}

export type Standing = {
  id: string
  team_id: string
  group_name: string
  position: number
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  form: string | null
  team?: Team
}

export type Venue = {
  id: string
  name: string
  city: string
  country: string
  capacity: number
}

export type BracketEntry = {
  id: string
  round: string
  position: number
  match_id: string | null
  home_team_id: string | null
  away_team_id: string | null
  winner_id: string | null
  home_team?: Team
  away_team?: Team
  winner?: Team
  match?: Match
}

export type PlayerStats = {
  id: string
  player_id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  matches_played: number
  minutes_played: number
  player?: Player
}
