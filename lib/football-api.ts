const BASE_URL = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_API_KEY!

// World Cup 2026 competition ID on football-data.org
const WC_2026_ID = 2000

const headers = {
  'X-Auth-Token': API_KEY,
}

export interface FDMatch {
  id: number
  status: string
  utcDate: string
  matchday: number
  stage: string
  group: string | null
  homeTeam: { id: number; name: string; shortName: string; tla: string; crest: string }
  awayTeam: { id: number; name: string; shortName: string; tla: string; crest: string }
  score: {
    winner: string | null
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
    extraTime: { home: number | null; away: number | null }
    penalties: { home: number | null; away: number | null }
  }
  minute: number | null
  venue: string | null
}

export interface FDStanding {
  stage: string
  type: string
  group: string | null
  table: Array<{
    position: number
    team: { id: number; name: string; shortName: string; crest: string }
    playedGames: number
    won: number
    draw: number
    lost: number
    points: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
    form: string | null
  }>
}

export async function fetchMatches(): Promise<FDMatch[]> {
  try {
    const res = await fetch(`${BASE_URL}/competitions/${WC_2026_ID}/matches`, { headers })
    if (!res.ok) return []
    const data = await res.json()
    return data.matches || []
  } catch {
    return []
  }
}

export async function fetchMatch(matchId: number): Promise<FDMatch | null> {
  try {
    const res = await fetch(`${BASE_URL}/matches/${matchId}`, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchStandings(): Promise<FDStanding[]> {
  try {
    const res = await fetch(`${BASE_URL}/competitions/${WC_2026_ID}/standings`, { headers })
    if (!res.ok) return []
    const data = await res.json()
    return data.standings || []
  } catch {
    return []
  }
}

export async function fetchTeams(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/competitions/${WC_2026_ID}/teams`, { headers })
    if (!res.ok) return []
    const data = await res.json()
    return data.teams || []
  } catch {
    return []
  }
}

export async function fetchScorers(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/competitions/${WC_2026_ID}/scorers?limit=20`, { headers })
    if (!res.ok) return []
    const data = await res.json()
    return data.scorers || []
  } catch {
    return []
  }
}

// Map football-data.org status to our status
export function mapStatus(fdStatus: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'SCHEDULED',
    TIMED: 'SCHEDULED',
    IN_PLAY: 'IN_PLAY',
    PAUSED: 'PAUSED',
    FINISHED: 'FINISHED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'POSTPONED',
  }
  return map[fdStatus] || 'SCHEDULED'
}

// Map football-data.org stage to our phase
export function mapPhase(stage: string): string {
  const map: Record<string, string> = {
    GROUP_STAGE: 'GROUP',
    LAST_32: 'R32',
    ROUND_OF_16: 'R16',
    QUARTER_FINALS: 'QF',
    SEMI_FINALS: 'SF',
    THIRD_PLACE: 'THIRD',
    FINAL: 'FINAL',
  }
  return map[stage] || 'GROUP'
}
