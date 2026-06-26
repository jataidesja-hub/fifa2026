import { NextResponse } from 'next/server'
import { fetchMatches } from '@/lib/football-api'

export const revalidate = 15

export async function GET() {
  try {
    const matches = await fetchMatches()
    return NextResponse.json({ matches })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
