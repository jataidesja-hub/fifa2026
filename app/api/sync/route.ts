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

  // We are now using the static mock data from the ha-world-cup-2026 repo
  // Syncing with football-data.org is disabled to prevent overwriting the perfect 48-team 104-match structure
  return NextResponse.json({ success: true, message: "Using local HA World Cup data. Sync disabled to preserve 48-team mock." })
}
